import { invokeLLM } from "./llm";
import { cacheSet } from "./system-cache";

const PROBE_TOKEN = "STEFAN_COMPATIBLE_V1";
const MODELS = ["gemini-3.1-pro-preview", "gemini-3-flash-preview"] as const;

type ProbeResult = {
  model: string;
  available: boolean;
  contractPassed: boolean;
  output: string;
  error?: string;
};

export type CompatibilityReport = {
  checkedAt: string;
  passed: boolean;
  results: ProbeResult[];
};

/**
 * Small live contract test. It verifies model availability, prompt adherence,
 * non-empty output, and the exact response contract without sending legal data.
 */
export async function runModelCompatibilityProbe(): Promise<CompatibilityReport> {
  const results: ProbeResult[] = [];

  for (const model of MODELS) {
    try {
      const response = await invokeLLM({
        model,
        messages: [
          {
            role: "system",
            content: `Return exactly one token: ${PROBE_TOKEN}. Do not add anything else.`,
          },
          { role: "user", content: "Compatibility probe." },
        ],
        maxTokens: 1024,
        reasoningEffort: "low",
      });
      const raw = response.choices[0]?.message?.content;
      const output = typeof raw === "string" ? raw.trim() : "";
      results.push({
        model,
        available: true,
        contractPassed: output === PROBE_TOKEN,
        output: output.slice(0, 120),
      });
    } catch (error) {
      results.push({
        model,
        available: false,
        contractPassed: false,
        output: "",
        error: error instanceof Error ? error.message.slice(0, 300) : String(error),
      });
    }
  }

  const report: CompatibilityReport = {
    checkedAt: new Date().toISOString(),
    passed: results.every((result) => result.available && result.contractPassed),
    results,
  };

  await cacheSet(
    "model_compatibility_last",
    JSON.stringify(report),
    null,
    { checkedAt: report.checkedAt, passed: report.passed }
  );

  return report;
}

export async function getLastModelCompatibilityReport(): Promise<CompatibilityReport | null> {
  const { cacheGet } = await import("./system-cache");
  const cached = await cacheGet("model_compatibility_last");
  if (!cached) return null;
  try {
    return JSON.parse(cached.value) as CompatibilityReport;
  } catch {
    return null;
  }
}

export const MODEL_COMPATIBILITY_MODELS = MODELS;
export const MODEL_COMPATIBILITY_PROBE_TOKEN = PROBE_TOKEN;

/** Test-only export for deterministic unit tests. */
export function isCompatibleProbeOutput(output: string): boolean {
  return output.trim() === PROBE_TOKEN;
}

