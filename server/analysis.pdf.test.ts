import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  storagePut: vi.fn(),
  invokeLegalModel: vi.fn(),
}));

vi.mock("./storage", () => ({ storagePut: mocks.storagePut }));
vi.mock("./_core/legal-model-gateway", async () => {
  const actual = await vi.importActual<typeof import("./_core/legal-model-gateway")>("./_core/legal-model-gateway");
  return { ...actual, invokeLegalModel: mocks.invokeLegalModel };
});

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const minimalPdf = Buffer.from("%PDF-1.4\nminimal test document\n%%EOF").toString("base64");
const safeResult = {
  content: "Analiza testowa. https://isap.sejm.gov.pl\n\n⚠️ UWAGA: Analiza nie stanowi porady prawnej.",
  model: "gemini-3.1-pro-preview",
  fallbackUsed: false,
  safetyBlocked: false,
};

describe("PDF Analysis through the legal model gateway", () => {
  beforeEach(() => {
    mocks.storagePut.mockReset();
    mocks.invokeLegalModel.mockReset();
  });

  it("exposes the PDF analysis procedure", () => {
    const caller = appRouter.createCaller(createPublicContext());
    expect(caller.analysis.analyzePDFWithGemini).toBeDefined();
  });

  it("uploads the PDF and sends its reference only to the verified gateway", async () => {
    mocks.storagePut.mockResolvedValue({ url: "https://storage.example.test/temp-pdf/test.pdf" });
    mocks.invokeLegalModel.mockResolvedValue(safeResult);
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.analysis.analyzePDFWithGemini({
      fileData: minimalPdf,
      filename: "test.pdf",
      mimeType: "application/pdf",
    });

    expect(mocks.storagePut).toHaveBeenCalledOnce();
    expect(mocks.invokeLegalModel).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          role: "user",
          content: expect.arrayContaining([
            expect.objectContaining({ type: "file_url" }),
          ]),
        }),
      ]),
      "pdf"
    );
    expect(result).toMatchObject({
      success: true,
      analysis: safeResult.content,
      model: "gemini-3.1-pro-preview",
      fallbackUsed: false,
      safetyBlocked: false,
    });
  });

  it("returns a controlled failure when temporary storage is unavailable", async () => {
    mocks.storagePut.mockRejectedValue(new Error("storage unavailable"));
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.analysis.analyzePDFWithGemini({
      fileData: minimalPdf,
      filename: "test.pdf",
      mimeType: "application/pdf",
    });

    expect(result).toMatchObject({ success: false, model: "fallback" });
    expect(mocks.invokeLegalModel).not.toHaveBeenCalled();
  });
});
