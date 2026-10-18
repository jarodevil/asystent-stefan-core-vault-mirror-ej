import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generateChatPDF, type ChatHistoryPDF } from "./pdf-export";

const projectRoot = path.resolve(import.meta.dirname, "../..");

describe("Jaro'Devil document signature", () => {
  it("uses the official signature asset on every active client-side document surface", () => {
    const sources: Array<[string, string]> = [
      ["client/src/components/DocumentPreviewModal.tsx", "JARODEVIL_SIGNATURE_URL"],
      ["client/src/pages/KsefClientCards.tsx", "loadJaroDevilSignatureDataUrl"],
      ["client/src/pages/Templates.tsx", "JARODEVIL_SIGNATURE_URL"],
      ["client/src/pages/Analysis.tsx", "JARODEVIL_SIGNATURE_URL"],
      ["client/src/components/StefanLayout.tsx", "JARODEVIL_SIGNATURE_URL"],
    ];

    for (const [source, signatureReference] of sources) {
      const content = fs.readFileSync(path.join(projectRoot, source), "utf8");
      expect(content, source).toContain(signatureReference);
    }
  });

  it("generates an actual PDF history export with the Jaro'Devil footer text", async () => {
    const history: ChatHistoryPDF = {
      sessionId: 1,
      title: "Kontrola eksportu",
      createdAt: new Date("2026-09-05T08:00:00.000Z"),
      updatedAt: new Date("2026-09-05T08:05:00.000Z"),
      messages: [
        { role: "user", content: "Przykładowe pytanie", createdAt: new Date("2026-09-05T08:00:00.000Z") },
        { role: "assistant", content: "Przykładowa odpowiedź", createdAt: new Date("2026-09-05T08:01:00.000Z") },
      ],
    };

    const pdf = await generateChatPDF(history);
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.toString("latin1")).toContain("Jaro'Devil");
  }, 30_000);
});
