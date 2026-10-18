import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "../..");

function readClientFile(...segments: string[]) {
  return fs.readFileSync(path.join(projectRoot, "client", "src", ...segments), "utf8");
}

describe("KSeF UI contracts", () => {
  it("preserves primary KSeF procedures while using the office visual system", () => {
    const source = readClientFile("pages", "KSeF.tsx");

    expect(source).toContain("trpc.ksef.askQuestion.useMutation()");
    expect(source).toContain("trpc.ksef.checkObligation.useQuery");
    expect(source).toContain("trpc.ksef.refreshAlerts.useMutation");
    expect(source).toContain("trpc.ksef.markRead.useMutation");
    expect(source).toContain("trpc.ksef.fillTemplate.useMutation");
    expect(source).toContain("office-hero");
    expect(source).toContain("data-[state=active]:bg-primary");
  });

  it("preserves client-card actions while using the office visual system", () => {
    const source = readClientFile("pages", "KsefClientCards.tsx");

    expect(source).toContain("trpc.ksef.createClientCard.useMutation");
    expect(source).toContain("trpc.ksef.updateClientCard.useMutation");
    expect(source).toContain("trpc.ksef.deleteClientCard.useMutation");
    expect(source).toContain("exportToPdf(card, checklist)");
    expect(source).toContain("office-hero");
  });
});
