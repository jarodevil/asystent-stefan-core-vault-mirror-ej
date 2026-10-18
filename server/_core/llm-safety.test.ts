import { describe, it, expect } from "vitest";
import {
  validateLLMResponse,
  validateLLMConfig,
  hashLLMConfig,
  enforceSecurityRequirements,
  detectConfigTampering,
  createSafeLLMConfig,
} from "./llm-safety";

describe("LLM Safety Module", () => {
  describe("validateLLMResponse", () => {
    it("powinien zaakceptować odpowiedź z ISAP link i disclaimer", () => {
      const response = `Kodeks cywilny reguluje umowy.
      
⚠️ UWAGA: Analiza nie stanowi porady prawnej. Zweryfikuj w systemie ISAP https://isap.sejm.gov.pl`;

      const result = validateLLMResponse(response);
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it("powinien odrzucić odpowiedź bez ISAP link", () => {
      const response = "Kodeks cywilny reguluje umowy.";

      const result = validateLLMResponse(response);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain("Brak linku do ISAP - odpowiedź może zawierać fałszywe informacje");
    });

    it("powinien odrzucić odpowiedź bez disclaimer", () => {
      const response = "Kodeks cywilny reguluje umowy. Sprawdź https://isap.sejm.gov.pl";

      const result = validateLLMResponse(response);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.includes("disclaimer"))).toBe(true);
    });

    it("powinien ostrzegać o podejrzanych numerach Dz. U.", () => {
      const response = `Dz. U. 2025 nr 999 reguluje to.
      
⚠️ UWAGA: Analiza nie stanowi porady prawnej. Zweryfikuj w systemie ISAP https://isap.sejm.gov.pl`;

      const result = validateLLMResponse(response);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("powinien odrzucić pustą odpowiedź", () => {
      const result = validateLLMResponse("");
      expect(result.isValid).toBe(false);
    });
  });

  describe("validateLLMConfig", () => {
    it("powinien zaakceptować poprawną konfigurację", () => {
      const config = createSafeLLMConfig("gemini-3.1-pro-preview", "Jesteś asystent prawny.");

      const result = validateLLMConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it("powinien odrzucić temperaturę > 1.0", () => {
      const config = {
        model: "gemini-3.1-pro-preview",
        temperature: 1.5, // Gemini 3 wymaga max 1.0
        systemPrompt: "Jesteś asystent prawny.",
        maxTokens: 2000,
        timestamp: Date.now(),
        configHash: "abc123",
      };

      const result = validateLLMConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.includes("temperatura"))).toBe(true);
    });

    it("powinien ostrzegać o temperaturze > 0.1", () => {
      const config = {
        model: "gemini-3.1-pro-preview",
        temperature: 0.25,
        systemPrompt: "Jesteś asystent prawny.",
        maxTokens: 2000,
        timestamp: Date.now(),
        configHash: hashLLMConfig({
          model: "gemini-3.1-pro-preview",
          temperature: 0.25,
          systemPrompt: "Jesteś asystent prawny.",
          maxTokens: 2000,
        }),
      };

      const result = validateLLMConfig(config);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("powinien odrzucić niezatwierdzony model", () => {
      const config = {
        model: "unknown-model",
        temperature: 0.2,
        systemPrompt: "Jesteś asystent prawny.",
        maxTokens: 2000,
        timestamp: Date.now(),
        configHash: "abc123",
      };

      const result = validateLLMConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.includes("nie jest zatwierdzony"))).toBe(true);
    });
  });

  describe("enforceSecurityRequirements", () => {
    it("powinien dodać ISAP link jeśli go brakuje", () => {
      const response = "Kodeks cywilny reguluje umowy.";
      const secured = enforceSecurityRequirements(response);

      expect(secured).toContain("isap.sejm.gov.pl");
    });

    it("powinien dodać disclaimer jeśli go brakuje", () => {
      const response = "Kodeks cywilny reguluje umowy. https://isap.sejm.gov.pl";
      const secured = enforceSecurityRequirements(response);

      expect(secured).toContain("UWAGA");
      expect(secured).toContain("Analiza nie stanowi porady");
    });

    it("nie powinien duplikować istniejących elementów", () => {
      const response = `Kodeks cywilny reguluje umowy.
      
⚠️ UWAGA: Analiza nie stanowi porady prawnej. Zweryfikuj w systemie ISAP https://isap.sejm.gov.pl`;

      const secured = enforceSecurityRequirements(response);
      const isapCount = (secured.match(/isap\.sejm\.gov\.pl/g) || []).length;
      const disclaimerCount = (secured.match(/UWAGA/g) || []).length;

      expect(isapCount).toBe(1);
      expect(disclaimerCount).toBe(1);
    });
  });

  describe("hashLLMConfig", () => {
    it("powinien generować konsystentny hash", () => {
      const config = {
        model: "gemini-3.1-pro-preview",
        temperature: 0.2,
        systemPrompt: "Jesteś asystent prawny.",
        maxTokens: 2000,
      };

      const hash1 = hashLLMConfig(config);
      const hash2 = hashLLMConfig(config);

      expect(hash1).toBe(hash2);
    });

    it("powinien generować różne hashe dla różnych konfiguracji", () => {
      const config1 = {
        model: "gemini-3.1-pro-preview",
        temperature: 0.2,
        systemPrompt: "Jesteś asystent prawny.",
        maxTokens: 2000,
      };

      const config2 = {
        model: "gemini-3.1-pro-preview",
        temperature: 0.3,
        systemPrompt: "Jesteś asystent prawny.",
        maxTokens: 2000,
      };

      const hash1 = hashLLMConfig(config1);
      const hash2 = hashLLMConfig(config2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("detectConfigTampering", () => {
    it("powinien wykryć zmianę temperatury", () => {
      const prev = createSafeLLMConfig("gemini-3.1-pro-preview", "Prompt");
      const current = {
        ...prev,
        temperature: 0.5,
      };

      const issues = detectConfigTampering(prev, current);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(i => i.includes("Temperatura"))).toBe(true);
    });

    it("powinien wykryć zmianę modelu", () => {
      const prev = createSafeLLMConfig("gemini-3.1-pro-preview", "Prompt");
      const current = {
        ...prev,
        model: "gemini-3-flash-preview",
      };

      const issues = detectConfigTampering(prev, current);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(i => i.includes("Model"))).toBe(true);
    });

    it("powinien zwrócić pustą tablicę jeśli konfiguracja nie zmieniła się", () => {
      const config = createSafeLLMConfig("gemini-3.1-pro-preview", "Prompt");

      const issues = detectConfigTampering(config, config);
      expect(issues).toHaveLength(0);
    });
  });

  describe("createSafeLLMConfig", () => {
    it("powinien tworzyć konfigurację z temperaturą 0.1", () => {
      const config = createSafeLLMConfig("gemini-3.1-pro-preview", "Prompt");

      expect(config.temperature).toBe(0.1);
      expect(config.model).toBe("gemini-3.1-pro-preview");
    });

    it("powinien generować poprawny hash", () => {
      const config = createSafeLLMConfig("gemini-3.1-pro-preview", "Prompt");

      const expectedHash = hashLLMConfig({
        model: config.model,
        temperature: config.temperature,
        systemPrompt: config.systemPrompt,
        maxTokens: config.maxTokens,
      });

      expect(config.configHash).toBe(expectedHash);
    });
  });
});
