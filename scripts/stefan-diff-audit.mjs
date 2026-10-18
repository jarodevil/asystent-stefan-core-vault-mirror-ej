#!/usr/bin/env node
/**
 * Stefan Audit Pack — zero-LLM differential audit.
 * It fingerprints project sources and classifies only changed components.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, copyFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

const args = new Set(process.argv.slice(2));
const projectArgIndex = process.argv.indexOf("--project");
const projectRoot = resolve(projectArgIndex >= 0 ? process.argv[projectArgIndex + 1] : process.cwd());
const kitDirectory = join(projectRoot, "audit-kit");
const baselineFile = join(kitDirectory, "stefan-audit-baseline.json");
const candidateFile = join(kitDirectory, "stefan-audit-candidate.json");
const reportDirectory = join(kitDirectory, "reports");
const allowedExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".html", ".css", ".md"]);
const ignoredDirectories = new Set(["node_modules", ".git", "dist", ".vite", "coverage", "reports"]);

const contracts = [
  {
    id: "llm-safety",
    tier: "critical",
    description: "Verified legal model routing, source gate, prompt injection handling and runtime compatibility probe.",
    paths: ["server/_core/llm.ts", "server/_core/llm-safety.ts", "server/_core/legal-model-gateway.ts", "server/_core/model-compatibility.ts", "server/db-model-audit.ts", "server/routers.ts"],
    tests: ["server/_core/legal-model-gateway.test.ts", "server/_core/llm-safety.test.ts", "server/_core/model-compatibility.test.ts"],
  },
  {
    id: "legal-data-ksef",
    tier: "critical",
    description: "Government-source KSeF monitoring, ELI ingestion and legal-context injection.",
    paths: ["server/_core/ksef-monitor.ts", "server/_core/eli-api-client.ts", "server/_core/rss-cron.ts", "server/ksef-knowledge.ts"],
    tests: ["server/ksef-monitor.test.ts", "server/ksef.test.ts", "server/ksef-templates.test.ts"],
  },
  {
    id: "persistence-and-access",
    tier: "critical",
    description: "Database schema, user isolation and durable chat, note and generated-document data.",
    paths: ["drizzle/schema.ts", "server/db-sessions.ts", "server/db-notes.ts", "server/db-documents.ts", "server/_core/system-cache.ts"],
    tests: ["server/auth.logout.test.ts", "server/ksef-client-cards.test.ts"],
  },
  {
    id: "pwa-and-runtime",
    tier: "critical",
    description: "React singleton, Vite resolution, Service Worker freshness and protected asset delivery.",
    paths: ["vite.config.ts", "server/_core/vite.ts", "server/_core/release-version.ts", "client/index.html", "client/public/sw.js", "server/_core/storageProxy.ts"],
    tests: ["server/_core/pwa-development-guard.test.ts", "server/_core/release-version.test.ts", "client/src/lib/releaseConsistency.test.ts"],
  },
  {
    id: "document-integrity",
    tier: "critical",
    description: "Generated documents, print/PDF surfaces and mandatory Jaro'Devil signature.",
    paths: ["client/src/components/DocumentPreviewModal.tsx", "client/src/lib/brandSignature.ts", "client/src/pages/KsefClientCards.tsx", "client/src/pages/Templates.tsx", "client/src/pages/Analysis.tsx", "server/_core/pdf-export.ts"],
    tests: ["server/_core/document-signature.test.ts", "server/ksef-templates.test.ts"],
  },
];

function extensionOf(fileName) {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index) : "";
}

function shouldTrack(relativePath) {
  if (relativePath.startsWith("audit-kit/") || relativePath.startsWith("client/public/pdf.worker")) return false;
  return allowedExtensions.has(extensionOf(relativePath));
}

function walk(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) continue;
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) files.push(...walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function classify(relativePath) {
  const matching = contracts.filter(contract => contract.paths.includes(relativePath));
  if (matching.length > 0) {
    return { tier: "critical", contracts: matching.map(contract => contract.id) };
  }
  if (relativePath.includes(".test.")) return { tier: "test", contracts: [] };
  return { tier: "standard", contracts: [] };
}

function sha256(fullPath) {
  return createHash("sha256").update(readFileSync(fullPath)).digest("hex");
}

function snapshot() {
  const roots = ["server", "client/src", "client/public", "drizzle"];
  const explicit = ["package.json", "pnpm-lock.yaml", "vite.config.ts", "tsconfig.json", "client/index.html", "scripts/stefan-diff-audit.mjs", "scripts/build-release.mjs"];
  const filePaths = roots.flatMap(root => walk(join(projectRoot, root))).concat(
    explicit.map(file => join(projectRoot, file)).filter(existsSync),
  );
  const files = {};
  for (const fullPath of filePaths) {
    const relativePath = relative(projectRoot, fullPath).replaceAll("\\", "/");
    if (!shouldTrack(relativePath)) continue;
    const classification = classify(relativePath);
    files[relativePath] = { sha256: sha256(fullPath), ...classification };
  }
  return {
    schemaVersion: "1.0",
    product: "System Stefan",
    generatedAt: new Date().toISOString(),
    contracts,
    files,
  };
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function diff(base, current) {
  const names = new Set([...Object.keys(base.files), ...Object.keys(current.files)]);
  const changes = [];
  for (const name of [...names].sort()) {
    const before = base.files[name];
    const after = current.files[name];
    if (!before) changes.push({ path: name, type: "added", ...after });
    else if (!after) changes.push({ path: name, type: "deleted", ...before });
    else if (before.sha256 !== after.sha256) changes.push({ path: name, type: "modified", ...after });
  }
  return changes;
}

function recommendedTests(changes) {
  const selected = new Set();
  for (const change of changes) {
    for (const contract of contracts.filter(item => change.contracts.includes(item.id))) {
      contract.tests.forEach(test => selected.add(test));
    }
  }
  return [...selected].sort();
}

function classifyDecision(changes) {
  const critical = changes.filter(change => change.tier === "critical");
  if (critical.length === 0 && changes.length === 0) return "fast-audit-pass";
  if (critical.length > 0) return "critical-change-escalation";
  return "standard-change-review";
}

function markdownReport(result) {
  const rows = result.changes.length
    ? result.changes.map(change => `| \`${change.path}\` | ${change.type} | ${change.tier} | ${change.contracts.join(", ") || "—"} |`).join("\n")
    : "| — | brak | — | — |";
  const testCommand = result.recommendedTests.length
    ? `pnpm vitest run ${result.recommendedTests.join(" ")}`
    : "npx tsc --noEmit";
  return `# Stefan — raport audytu różnicowego\n\n**Data:** ${result.generatedAt}\n\n| Decyzja | Zmodyfikowane pliki | Zmiany krytyczne |\n|---|---:|---:|\n| **${result.decision}** | ${result.changes.length} | ${result.criticalChanges} |\n\n## Zmiany\n\n| Plik | Typ | Ryzyko | Kontrakt |\n|---|---|---|---|\n${rows}\n\n## Kolejny krok\n\n1. Wykonaj bezkosztową walidację: \`npx tsc --noEmit\`.\n2. Wykonaj wyłącznie testy celowane: \`${testCommand}\`.\n3. Nie uruchamiaj pełnego \`pnpm test\` rutynowo — zestaw zawiera testy analizy PDF, które wywołują model Gemini.\n4. Promuj baseline dopiero po pozytywnej walidacji: \`node stefan_diff_audit.mjs --project <projekt> --promote --verified\`.\n`;
}

function writeReport(result) {
  mkdirSync(reportDirectory, { recursive: true });
  const stamp = result.generatedAt.replaceAll(":", "-").replaceAll(".", "-");
  writeFileSync(join(reportDirectory, `differential-audit-${stamp}.json`), `${JSON.stringify(result, null, 2)}\n`);
  writeFileSync(join(reportDirectory, `differential-audit-${stamp}.md`), markdownReport(result));
}

function main() {
  mkdirSync(kitDirectory, { recursive: true });
  if (args.has("--init")) {
    if (existsSync(baselineFile)) throw new Error("Baseline already exists. Use --promote --verified after a reviewed audit.");
    const current = snapshot();
    writeFileSync(baselineFile, `${JSON.stringify(current, null, 2)}\n`);
    console.log(JSON.stringify({ decision: "baseline-initialized", files: Object.keys(current.files).length, baselineFile }, null, 2));
    return;
  }

  if (args.has("--promote")) {
    if (!args.has("--verified")) throw new Error("Refusing to promote baseline without --verified.");
    if (!existsSync(candidateFile)) throw new Error("No audit candidate exists. Run the audit first.");
    copyFileSync(candidateFile, baselineFile);
    console.log(JSON.stringify({ decision: "baseline-promoted", baselineFile }, null, 2));
    return;
  }

  if (!existsSync(baselineFile)) throw new Error("Missing baseline. Run once with --init after an approved release.");
  const baseline = readJson(baselineFile);
  const current = snapshot();
  const changes = diff(baseline, current);
  writeFileSync(candidateFile, `${JSON.stringify(current, null, 2)}\n`);
  const result = {
    schemaVersion: "1.0",
    generatedAt: current.generatedAt,
    baselineGeneratedAt: baseline.generatedAt,
    decision: classifyDecision(changes),
    criticalChanges: changes.filter(change => change.tier === "critical").length,
    changes,
    recommendedTests: recommendedTests(changes),
    candidateFile,
  };
  writeReport(result);
  console.log(JSON.stringify(result, null, 2));
}

try {
  main();
} catch (error) {
  console.error(`[StefanAudit] ${error.message}`);
  process.exitCode = 1;
}
