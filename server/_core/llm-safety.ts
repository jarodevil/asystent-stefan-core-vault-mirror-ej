/**
 * LLM Safety Module - Ochrona przed halucynacjami i sabotażem
 * Zapewnia bezpieczeństwo odpowiedzi LLM poprzez:
 * 1. Walidację konfiguracji modelu
 * 2. Walidację odpowiedzi (ISAP link, disclaimer)
 * 3. Logging zmian bezpieczeństwa
 * 4. Alerting przy anomaliach
 */

import crypto from "crypto";

export interface LLMConfig {
  model: string;
  temperature: number;
  systemPrompt: string;
  maxTokens: number;
  timestamp: number;
  configHash: string;
}

export interface LLMValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  timestamp: number;
}

// Models verified in the live proxy catalog on 2026-09-05.
// Retired/absent IDs are intentionally rejected instead of silently falling back.
const APPROVED_MODELS = [
  "gemini-3.1-pro-preview",
  "gemini-3-flash-preview",
];

// Maksymalna dozwolona temperatura dla odpowiedzi prawnych.
// Stefan uses 0.1; higher values are rejected rather than merely warned.
const MAX_TEMPERATURE = 0.2;

// Obowiązkowe elementy w odpowiedzi
const REQUIRED_ELEMENTS = {
  isapLink: "isap.sejm.gov.pl",
  disclaimer: ["UWAGA", "Analiza nie stanowi porady", "zweryfikować"],
};

// Portale rządowe do weryfikacji aktów prawnych
const VERIFIED_SOURCES = [
  "isap.sejm.gov.pl",
  "podatki.gov.pl",
  "pit.gov.pl",
  "sn.pl",
  "nsa.gov.pl",
  "trybunal.gov.pl",
];

// Akty prawne podatkowe do walidacji
const TAX_LAW_ACTS = [
  "Ustawa o VAT",
  "Ustawa o PIT",
  "Ustawa o CIT",
  "Ordynacja podatkowa",
  "Ustawa o podatku akcyzowym",
  "Ustawa o podatku od towarów i usług",
];

/**
 * Oblicza hash konfiguracji LLM
 */
export function hashLLMConfig(config: Omit<LLMConfig, "configHash" | "timestamp">): string {
  const configString = JSON.stringify({
    model: config.model,
    temperature: config.temperature,
    systemPrompt: config.systemPrompt,
    maxTokens: config.maxTokens,
  });
  return crypto.createHash("sha256").update(configString).digest("hex");
}

/**
 * Waliduje konfigurację LLM przed użyciem
 */
export function validateLLMConfig(config: LLMConfig): LLMValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // 1. Sprawdzenie czy model jest zatwierdzony
  if (!APPROVED_MODELS.includes(config.model)) {
    issues.push(`Model "${config.model}" nie jest zatwierdzony. Zatwierdzeni: ${APPROVED_MODELS.join(", ")}`);
  }

  // 2. Sprawdzenie temperatury (KRYTYCZNE)
  if (config.temperature > MAX_TEMPERATURE) {
    issues.push(
      `Temperatura ${config.temperature} przekracza maksimum ${MAX_TEMPERATURE}. ` +
      `Wysoka temperatura powoduje halucynacje!`
    );
  }

  if (config.temperature > 0.1) {
    warnings.push(`Temperatura ${config.temperature} jest wyższa niż docelowa 0.1`);
  }

  // 3. Sprawdzenie czy system prompt zawiera zabezpieczenia
  const systemPromptLower = config.systemPrompt.toLowerCase();
  if (!systemPromptLower.includes("halucynacja") && !systemPromptLower.includes("isap")) {
    warnings.push("System prompt nie zawiera wymaganych zabezpieczeń przed halucynacjami");
  }

  // 4. Sprawdzenie czy maxTokens jest rozsądny
  if (config.maxTokens > 4000) {
    warnings.push(`maxTokens ${config.maxTokens} jest wysokie - może zwiększyć koszty`);
  }

  // 5. Weryfikacja hash
  const expectedHash = hashLLMConfig({
    model: config.model,
    temperature: config.temperature,
    systemPrompt: config.systemPrompt,
    maxTokens: config.maxTokens,
  });

  if (config.configHash !== expectedHash) {
    issues.push("Hash konfiguracji nie zgadza się - możliwa manipulacja!");
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    timestamp: Date.now(),
  };
}

/**
 * Waliduje odpowiedź LLM
 */
export function validateLLMResponse(response: string): LLMValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  const normalizedResponse = response.toLowerCase();

  // Model output must never override the system contract.
  const injectionPatterns = [
    "ignore previous instructions",
    "ignoruj poprzednie instrukcje",
    "zignoruj zasady systemowe",
    "system prompt",
    "ujawnij prompt",
  ];
  if (injectionPatterns.some((pattern) => normalizedResponse.includes(pattern))) {
    issues.push("Odpowiedź zawiera wzorzec prompt injection i została zablokowana");
  }

  // 1. Sprawdzenie czy zawiera ISAP link
  if (!response.includes(REQUIRED_ELEMENTS.isapLink)) {
    issues.push("Brak linku do ISAP - odpowiedź może zawierać fałszywe informacje");
  }

  // 2. Sprawdzenie czy zawiera disclaimer
  const hasDisclaimer = REQUIRED_ELEMENTS.disclaimer.some(
    elem => response.includes(elem)
  );
  if (!hasDisclaimer) {
    issues.push("Brak wymaganego disclaimera - narusza wymogi bezpieczeństwa");
  }

  // 3. Sprawdzenie czy nie zawiera podejrzanych numerów Dz. U.
  // Pattern: "Dz. U. XXXX nr XXX" - ale bez weryfikacji w ISAP
  const dzuPattern = /Dz\.\s*U\.\s*\d{4}\s*nr\s*\d+/gi;
  const matches = response.match(dzuPattern);
  if (matches && matches.length > 0) {
    // Ostrzeżenie - mogą być fałszywe
    warnings.push(
      `Znaleziono ${matches.length} referencji do Dz. U. - ` +
      `upewnij się że zostały zweryfikowane w ISAP`
    );
  }

  // 4. Sprawdzenie czy odpowiedź nie jest pusta
  if (!response || response.trim().length === 0) {
    issues.push("Odpowiedź jest pusta");
  }

  // 5. Sprawdzenie czy odpowiedź nie jest zbyt krótka (może być obcięta)
  if (response.length < 50) {
    warnings.push("Odpowiedź jest bardzo krótka - może być niekompletna");
  }

  // 6. Walidacja odpowiedzi podatkowych
  const isTaxRelated = TAX_LAW_ACTS.some(act => response.includes(act));
  if (isTaxRelated) {
    // Sprawdzenie czy zawiera linki do portali podatkowych
    const hasTaxSource = VERIFIED_SOURCES.some(source => response.includes(source));
    if (!hasTaxSource) {
      issues.push(
        "Odpowiedź dotyczy prawa podatkowego, ale nie zawiera linków do zweryfikowanych źródeł " +
        "(podatki.gov.pl, pit.gov.pl, nsa.gov.pl)"
      );
    }

    // Sprawdzenie czy zawiera ostrzezenie o interpretacjach podatkowych
    if (!response.includes("interpretacja podatkowa") && !response.includes("organ podatkowy")) {
      warnings.push(
        "Odpowiedź podatkowa powinna zawierać informację o możliwości uzyskania " +
        "indywidualnej interpretacji podatkowej"
      );
    }
  }

  // 7. Sprawdzenie czy nie zawiera fałszywych cytatów z Ordynacji podatkowej
  if (response.includes("Ordynacja podatkowa")) {
    // Pattern: "art. XXX Ordynacji podatkowej"
    const artPattern = /art\.\s*\d+[a-z]?\s*Ordynacji podatkowej/gi;
    const artMatches = response.match(artPattern);
    if (artMatches && artMatches.length > 0) {
      warnings.push(
        `Znaleziono ${artMatches.length} referencji do Ordynacji podatkowej - ` +
        `zweryfikuj w ISAP lub podatki.gov.pl`
      );
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    timestamp: Date.now(),
  };
}

/**
 * Safe response used when validation fails. The original model output is never shown.
 */
export function buildSafetyBlockedResponse(): string {
  return `Nie mogę bezpiecznie wyświetlić tej odpowiedzi, ponieważ nie przeszła kontroli źródeł lub wymaganych zabezpieczeń. Nie będę uzupełniać braków domysłami. Zweryfikuj pytanie i podstawę prawną w oficjalnym systemie ISAP: https://isap.sejm.gov.pl, a następnie ponów analizę.\n\n⚠️ UWAGA: Analiza nie stanowi porady prawnej.`;
}

/**
 * Loguje zdarzenie bezpieczeństwa
 */
export function logSecurityEvent(
  eventType: "config_change" | "validation_failure" | "suspicious_response" | "alert",
  details: any
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    eventType,
    details,
    severity: eventType === "alert" ? "HIGH" : "MEDIUM",
  };

  console.log(`[SECURITY] ${JSON.stringify(logEntry)}`);

  // TODO: Wysłanie do centralnego systemu logowania
  // TODO: Alerting jeśli severity = HIGH
}

/**
 * Sprawdza czy konfiguracja LLM mogła zostać zmieniona bez autoryzacji
 */
export function detectConfigTampering(
  previousConfig: LLMConfig,
  currentConfig: LLMConfig
): string[] {
  const issues: string[] = [];

  if (previousConfig.model !== currentConfig.model) {
    issues.push(`Model zmienił się z "${previousConfig.model}" na "${currentConfig.model}"`);
  }

  if (previousConfig.temperature !== currentConfig.temperature) {
    issues.push(
      `Temperatura zmienił się z ${previousConfig.temperature} na ${currentConfig.temperature}`
    );
  }

  if (previousConfig.systemPrompt !== currentConfig.systemPrompt) {
    issues.push("System prompt został zmieniony");
  }

  if (previousConfig.maxTokens !== currentConfig.maxTokens) {
    issues.push(`maxTokens zmienił się z ${previousConfig.maxTokens} na ${currentConfig.maxTokens}`);
  }

  return issues;
}

/**
 * Tworzy bezpieczną konfigurację LLM
 */
export function createSafeLLMConfig(
  model: string = "manus-llm",
  systemPrompt: string
): LLMConfig {
  const config = {
    model,
    temperature: 0.1, // Legal-safe default; low temperature reduces variance
    systemPrompt,
    maxTokens: 2000,
    timestamp: Date.now(),
  };

  return {
    ...config,
    configHash: hashLLMConfig(config),
  };
}

/**
 * Sprawdza czy odpowiedź jest bezpieczna do wyświetlenia użytkownikowi
 */
export function isSafeToDisplay(response: string): boolean {
  const validation = validateLLMResponse(response);
  return validation.isValid;
}

/**
 * Dodaje wymagane elementy bezpieczeństwa do odpowiedzi jeśli ich brakuje
 */
export function enforceSecurityRequirements(response: string): string {
  let secured = response;

  // Dodaj ISAP link jeśli go brakuje
  if (!secured.includes(REQUIRED_ELEMENTS.isapLink)) {
    secured += `\n\n📋 Sprawdzenie: https://${REQUIRED_ELEMENTS.isapLink}`;
  }

  // Dodaj disclaimer jeśli go brakuje
  if (!REQUIRED_ELEMENTS.disclaimer.some(elem => secured.includes(elem))) {
    secured += `\n\n⚠️ UWAGA: Analiza nie stanowi porady prawnej. ` +
      `Przed podjęciem jakichkolwiek działań OBOWIĄZKOWO zweryfikuj wszystkie informacje ` +
      `w systemie ISAP lub skonsultuj się z uprawnionym prawnikiem.`;
  }

  return secured;
}
