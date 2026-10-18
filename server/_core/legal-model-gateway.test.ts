import { describe, expect, it, vi } from "vitest";
import {
  LEGAL_FALLBACK_MODEL,
  LEGAL_PRIMARY_MODEL,
  getLegalRuntimeConfig,
  invokeLegalModel,
  validateLegalSettingUpdate,
} from "./legal-model-gateway";
import type { InvokeResult } from "./llm";

const safeAnswer = "Zweryfikowany komunikat. https://isap.sejm.gov.pl\n\n⚠️ UWAGA: Analiza nie stanowi porady prawnej.";

function response(model: string, content = safeAnswer): InvokeResult {
  return {
    id: "test",
    created: 0,
    model,
    choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
  };
}

function setting(value: string) {
  return async () => ({ value }) as any;
}

function dependencies(invoke: (params: any) => Promise<InvokeResult>) {
  return {
    invoke,
    getSetting: async (key: string) => {
      const values: Record<string, string> = {
        model: LEGAL_PRIMARY_MODEL,
        temperature: "0.1",
        thinking_level: "high",
      };
      return { value: values[key] } as any;
    },
    verifySource: async () => true,
    audit: async () => undefined,
  };
}

describe("legal model gateway", () => {
  it("uses Pro as the primary legal model", async () => {
    const invoke = vi.fn().mockResolvedValue(response(LEGAL_PRIMARY_MODEL));
    const result = await invokeLegalModel([{ role: "user", content: "test" }], "chat", dependencies(invoke));

    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke.mock.calls[0][0].model).toBe(LEGAL_PRIMARY_MODEL);
    expect(result).toMatchObject({ model: LEGAL_PRIMARY_MODEL, fallbackUsed: false, safetyBlocked: false });
  });

  it("uses Flash only after a retryable Pro failure", async () => {
    const invoke = vi
      .fn()
      .mockRejectedValueOnce(new Error("LLM invoke failed: 503 Service Unavailable"))
      .mockResolvedValueOnce(response(LEGAL_FALLBACK_MODEL));

    const result = await invokeLegalModel([{ role: "user", content: "test" }], "chat", dependencies(invoke));

    expect(invoke.mock.calls.map((call) => call[0].model)).toEqual([LEGAL_PRIMARY_MODEL, LEGAL_FALLBACK_MODEL]);
    expect(result).toMatchObject({ model: LEGAL_FALLBACK_MODEL, fallbackUsed: true, safetyBlocked: false });
  });

  it("forwards a user STOP signal to the active model request", async () => {
    const controller = new AbortController();
    const invoke = vi.fn().mockResolvedValue(response(LEGAL_PRIMARY_MODEL));

    await invokeLegalModel(
      [{ role: "user", content: "test" }],
      "chat",
      { ...dependencies(invoke), signal: controller.signal }
    );

    expect(invoke.mock.calls[0][0].signal).toBe(controller.signal);
  });

  it("does not invoke a fallback model after the user stops the request", async () => {
    const controller = new AbortController();
    controller.abort();
    const invoke = vi.fn().mockRejectedValue(new DOMException("Stopped by user", "AbortError"));

    await expect(
      invokeLegalModel(
        [{ role: "user", content: "test" }],
        "chat",
        { ...dependencies(invoke), signal: controller.signal }
      )
    ).rejects.toMatchObject({ name: "AbortError" });

    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it("does not downgrade after a non-retryable failure", async () => {
    const invoke = vi.fn().mockRejectedValue(new Error("LLM invoke failed: 400 Bad Request"));
    const result = await invokeLegalModel([{ role: "user", content: "test" }], "chat", dependencies(invoke));

    expect(invoke).toHaveBeenCalledTimes(1);
    expect(result.safetyBlocked).toBe(true);
    expect(result.model).toBe("safety-blocked");
  });

  it("returns a safe refusal when both approved models are unavailable", async () => {
    const invoke = vi.fn().mockRejectedValue(new Error("fetch failed: network timeout"));
    const result = await invokeLegalModel([{ role: "user", content: "test" }], "chat", dependencies(invoke));

    expect(invoke.mock.calls.map((call) => call[0].model)).toEqual([LEGAL_PRIMARY_MODEL, LEGAL_FALLBACK_MODEL]);
    expect(result.safetyBlocked).toBe(true);
    expect(result.content).toContain("Nie mogę bezpiecznie wyświetlić");
  });

  it("blocks content with an unapproved source", async () => {
    const invoke = vi.fn().mockResolvedValue(response(LEGAL_PRIMARY_MODEL, `${safeAnswer}\nhttps://example.com/not-official`));
    const result = await invokeLegalModel(
      [{ role: "user", content: "test" }],
      "document",
      { ...dependencies(invoke), verifySource: async (url: string) => url.includes("isap.sejm.gov.pl") }
    );

    expect(result.safetyBlocked).toBe(true);
  });

  it("rejects unsafe owner model settings", async () => {
    expect(() => validateLegalSettingUpdate("model", LEGAL_FALLBACK_MODEL)).toThrow("Legal model must remain");
    expect(() => validateLegalSettingUpdate("temperature", "0.2")).toThrow("fixed at 0.1");
    expect(() => validateLegalSettingUpdate("thinking_level", "low")).toThrow("fixed at high");
  });

  it("derives the enforced runtime configuration only from safe values", async () => {
    const config = await getLegalRuntimeConfig(async (key: string) => {
      const values: Record<string, string> = { model: LEGAL_PRIMARY_MODEL, temperature: "0.1", thinking_level: "high" };
      return { value: values[key] } as any;
    });

    expect(config).toMatchObject({ model: LEGAL_PRIMARY_MODEL, temperature: 0.1, reasoningEffort: "high" });
    await expect(getLegalRuntimeConfig(setting(LEGAL_FALLBACK_MODEL))).rejects.toThrow();
  });
});
