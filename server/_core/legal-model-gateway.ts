import crypto from "crypto";
import { getDevSetting, isDomainWhitelisted } from "../db-dev";
import { recordModelAuditEvent } from "../db-model-audit";
import { buildSafetyBlockedResponse, logSecurityEvent, validateLLMResponse } from "./llm-safety";
import { invokeLLM, type InvokeParams, type InvokeResult, type Message } from "./llm";

export const LEGAL_PRIMARY_MODEL = "gemini-3.1-pro-preview" as const;
export const LEGAL_FALLBACK_MODEL = "gemini-3-flash-preview" as const;
export const LEGAL_APPROVED_MODELS = [LEGAL_PRIMARY_MODEL, LEGAL_FALLBACK_MODEL] as const;

export type LegalSurface = "chat" | "document" | "pdf" | "ksef";

export type LegalRuntimeConfig = {
  model: typeof LEGAL_PRIMARY_MODEL;
  temperature: 0.1;
  reasoningEffort: "high";
  configHash: string;
};

export type LegalModelResult = {
  content: string;
  model: string;
  fallbackUsed: boolean;
  safetyBlocked: boolean;
};

type GatewayDependencies = {
  invoke?: (params: InvokeParams) => Promise<InvokeResult>;
  getSetting?: typeof getDevSetting;
  verifySource?: (url: string) => Promise<boolean>;
  audit?: typeof recordModelAuditEvent;
  signal?: AbortSignal;
};

const SAFETY_RESPONSE_MODEL = "safety-blocked";
const REQUIRED_SETTINGS = {
  model: LEGAL_PRIMARY_MODEL,
  temperature: "0.1",
  thinking_level: "high",
} as const;

function toContent(response: InvokeResult): string {
  const content = response.choices[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("\n");
  }
  return "";
}

function configHash(config: Omit<LegalRuntimeConfig, "configHash">): string {
  return crypto.createHash("sha256").update(JSON.stringify(config)).digest("hex");
}

function retryable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /(?:network|fetch|timeout|timed out|\b408\b|\b429\b|\b5\d\d\b)/i.test(message);
}

function wasAborted(error: unknown, signal?: AbortSignal): boolean {
  return signal?.aborted === true || (error instanceof DOMException && error.name === "AbortError");
}

function errorKind(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const status = message.match(/\b(408|429|5\d\d)\b/)?.[1];
  if (status) return `http_${status}`;
  if (/timeout|timed out/i.test(message)) return "timeout";
  if (/network|fetch/i.test(message)) return "network";
  return "non_retryable";
}

function extractUrls(content: string): string[] {
  const urls: string[] = Array.from(content.match(/https?:\/\/[^\s)\]>,]+/gi) ?? []);
  if (/\bisap\.sejm\.gov\.pl\b/i.test(content) && !urls.some((url) => /isap\.sejm\.gov\.pl/i.test(url))) {
    urls.push("https://isap.sejm.gov.pl");
  }
  return Array.from(new Set(urls));
}

export function validateLegalSettingUpdate(key: string, value: string): void {
  if (key === "model" && value !== REQUIRED_SETTINGS.model) {
    throw new Error(`Legal model must remain ${LEGAL_PRIMARY_MODEL}; fallback is managed internally.`);
  }
  if (key === "temperature" && value !== REQUIRED_SETTINGS.temperature) {
    throw new Error("Legal temperature is fixed at 0.1 for deterministic factual answers.");
  }
  if (key === "thinking_level" && value !== REQUIRED_SETTINGS.thinking_level) {
    throw new Error("Legal reasoning effort is fixed at high for legal-financial analysis.");
  }
}

export async function getLegalRuntimeConfig(
  getSetting: typeof getDevSetting = getDevSetting
): Promise<LegalRuntimeConfig> {
  const [model, temperature, thinkingLevel] = await Promise.all([
    getSetting("model"),
    getSetting("temperature"),
    getSetting("thinking_level"),
  ]);

  validateLegalSettingUpdate("model", model?.value ?? REQUIRED_SETTINGS.model);
  validateLegalSettingUpdate("temperature", temperature?.value ?? REQUIRED_SETTINGS.temperature);
  validateLegalSettingUpdate("thinking_level", thinkingLevel?.value ?? REQUIRED_SETTINGS.thinking_level);

  const config = {
    model: LEGAL_PRIMARY_MODEL,
    temperature: 0.1 as const,
    reasoningEffort: "high" as const,
  };

  return { ...config, configHash: configHash(config) };
}

async function auditSafely(
  audit: typeof recordModelAuditEvent,
  event: Parameters<typeof recordModelAuditEvent>[0]
): Promise<void> {
  try {
    await audit(event);
  } catch (error) {
    console.warn("[LegalModelGateway] Model audit write failed", error);
  }
}

async function blockedResult(
  surface: LegalSurface,
  config: LegalRuntimeConfig,
  audit: typeof recordModelAuditEvent,
  values: { model?: string; fallbackUsed?: boolean; failureKind?: string | null; validationIssues?: number; sourceVerified?: boolean }
): Promise<LegalModelResult> {
  await auditSafely(audit, {
    surface,
    model: values.model ?? SAFETY_RESPONSE_MODEL,
    fallbackUsed: values.fallbackUsed ?? false,
    safetyBlocked: true,
    validationIssues: values.validationIssues ?? 0,
    sourceVerified: values.sourceVerified ?? false,
    promptTokens: null,
    completionTokens: null,
    failureKind: values.failureKind ?? null,
    configHash: config.configHash,
  });

  return {
    content: buildSafetyBlockedResponse(),
    model: SAFETY_RESPONSE_MODEL,
    fallbackUsed: values.fallbackUsed ?? false,
    safetyBlocked: true,
  };
}

/**
 * Calls only the two models explicitly approved for Stefan. Pro is always first.
 * Flash is tried only when Pro has a retryable transport or service failure.
 */
export async function invokeLegalModel(
  messages: Message[],
  surface: LegalSurface,
  dependencies: GatewayDependencies = {}
): Promise<LegalModelResult> {
  const invoke = dependencies.invoke ?? invokeLLM;
  const getSetting = dependencies.getSetting ?? getDevSetting;
  const verifySource = dependencies.verifySource ?? isDomainWhitelisted;
  const audit = dependencies.audit ?? recordModelAuditEvent;

  let config: LegalRuntimeConfig;
  try {
    config = await getLegalRuntimeConfig(getSetting);
  } catch (error) {
    const fallbackConfig: LegalRuntimeConfig = {
      model: LEGAL_PRIMARY_MODEL,
      temperature: 0.1,
      reasoningEffort: "high",
      configHash: configHash({ model: LEGAL_PRIMARY_MODEL, temperature: 0.1, reasoningEffort: "high" }),
    };
    logSecurityEvent("config_change", { issue: error instanceof Error ? error.message : String(error) });
    return blockedResult(surface, fallbackConfig, audit, { failureKind: "invalid_runtime_config" });
  }

  let response: InvokeResult;
  let fallbackUsed = false;
  let usedModel: string = LEGAL_PRIMARY_MODEL;

  try {
    response = await invoke({
      model: LEGAL_PRIMARY_MODEL,
      messages,
      maxTokens: 16384,
      reasoningEffort: config.reasoningEffort,
      signal: dependencies.signal,
    });
  } catch (primaryError) {
    if (wasAborted(primaryError, dependencies.signal)) {
      throw primaryError;
    }
    if (!retryable(primaryError)) {
      logSecurityEvent("alert", { surface, model: LEGAL_PRIMARY_MODEL, failure: errorKind(primaryError) });
      return blockedResult(surface, config, audit, {
        model: LEGAL_PRIMARY_MODEL,
        failureKind: errorKind(primaryError),
      });
    }

    fallbackUsed = true;
    usedModel = LEGAL_FALLBACK_MODEL;
    try {
      response = await invoke({
        model: LEGAL_FALLBACK_MODEL,
        messages,
        maxTokens: 16384,
        reasoningEffort: config.reasoningEffort,
        signal: dependencies.signal,
      });
    } catch (fallbackError) {
      if (wasAborted(fallbackError, dependencies.signal)) {
        throw fallbackError;
      }
      logSecurityEvent("alert", {
        surface,
        model: LEGAL_FALLBACK_MODEL,
        failure: errorKind(fallbackError),
        primaryFailure: errorKind(primaryError),
      });
      return blockedResult(surface, config, audit, {
        model: LEGAL_FALLBACK_MODEL,
        fallbackUsed: true,
        failureKind: errorKind(fallbackError),
      });
    }
  }

  const content = toContent(response);
  const validation = validateLLMResponse(content);
  const sourceUrls = extractUrls(content);
  const allowedSources = await Promise.all(sourceUrls.map(verifySource));
  const sourceVerified = sourceUrls.length > 0 && allowedSources.every(Boolean);
  const validationIssues = validation.issues.length + (sourceVerified ? 0 : 1);

  if (!validation.isValid || !sourceVerified) {
    logSecurityEvent("validation_failure", {
      surface,
      model: response.model || usedModel,
      issues: validation.issues,
      sourceVerified,
    });
    return blockedResult(surface, config, audit, {
      model: response.model || usedModel,
      fallbackUsed,
      validationIssues,
      sourceVerified,
      failureKind: !sourceVerified ? "unapproved_source" : null,
    });
  }

  const reportedModel = response.model || usedModel;
  await auditSafely(audit, {
    surface,
    model: reportedModel,
    fallbackUsed,
    safetyBlocked: false,
    validationIssues: 0,
    sourceVerified: true,
    promptTokens: response.usage?.prompt_tokens ?? null,
    completionTokens: response.usage?.completion_tokens ?? null,
    failureKind: null,
    configHash: config.configHash,
  });

  return {
    content,
    model: reportedModel,
    fallbackUsed,
    safetyBlocked: false,
  };
}
