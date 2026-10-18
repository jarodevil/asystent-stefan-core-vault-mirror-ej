import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const auditScript = resolve(import.meta.dirname, "../../scripts/stefan-diff-audit.mjs");

function executeAudit(project: string, ...arguments_: string[]) {
  const result = execFileSync("node", [auditScript, "--project", project, ...arguments_], {
    encoding: "utf8",
  });
  return JSON.parse(result) as { decision: string; criticalChanges?: number; recommendedTests?: string[] };
}

describe("Stefan Audit Pack", () => {
  it("detects critical LLM changes locally and maps only targeted safety tests", () => {
    const fixture = mkdtempSync(join(tmpdir(), "stefan-audit-pack-"));
    try {
      mkdirSync(join(fixture, "server", "_core"), { recursive: true });
      mkdirSync(join(fixture, "client", "src"), { recursive: true });
      mkdirSync(join(fixture, "drizzle"), { recursive: true });
      writeFileSync(join(fixture, "server", "_core", "llm.ts"), "export const model = 'baseline';\n");
      writeFileSync(join(fixture, "client", "src", "App.tsx"), "export default function App() { return null; }\n");
      writeFileSync(join(fixture, "drizzle", "schema.ts"), "export const schemaVersion = 1;\n");
      writeFileSync(join(fixture, "package.json"), "{}\n");

      expect(executeAudit(fixture, "--init").decision).toBe("baseline-initialized");

      writeFileSync(join(fixture, "server", "_core", "llm.ts"), "export const model = 'changed';\n");
      const audit = executeAudit(fixture);

      expect(audit.decision).toBe("critical-change-escalation");
      expect(audit.criticalChanges).toBe(1);
      expect(audit.recommendedTests).toEqual([
        "server/_core/legal-model-gateway.test.ts",
        "server/_core/llm-safety.test.ts",
        "server/_core/model-compatibility.test.ts",
      ]);
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });

  it("requires explicit verification before baseline promotion", () => {
    const source = readFileSync(auditScript, "utf8");
    expect(source).toContain("--verified");
    expect(source).toContain("Refusing to promote baseline without --verified");
  });
});
