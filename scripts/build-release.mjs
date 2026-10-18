import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const fingerprintRoots = [
  "client",
  "server",
  "shared",
  "package.json",
  "vite.config.ts",
  "scripts/build-release.mjs",
];

function collectFiles(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  const entry = fs.statSync(absolutePath);

  if (entry.isFile()) return [relativePath];

  return fs
    .readdirSync(absolutePath, { withFileTypes: true })
    .flatMap((child) =>
      collectFiles(path.join(relativePath, child.name))
    );
}

function sourceFingerprint() {
  const hash = createHash("sha256");
  const files = fingerprintRoots.flatMap(collectFiles).sort();

  for (const relativePath of files) {
    hash.update(relativePath);
    hash.update(fs.readFileSync(path.join(projectRoot, relativePath)));
  }

  return `r-${hash.digest("hex").slice(0, 12)}`;
}

function run(command, args, env) {
  execFileSync(command, args, { env, stdio: "inherit" });
}

const buildId = process.env.STEFAN_BUILD_ID?.trim() || sourceFingerprint();
const env = {
  ...process.env,
  STEFAN_BUILD_ID: buildId,
  VITE_STEFAN_BUILD_ID: buildId,
};

run("pnpm", ["exec", "vite", "build"], env);
run(
  "pnpm",
  [
    "exec",
    "esbuild",
    "server/_core/index.ts",
    "--platform=node",
    "--packages=external",
    "--bundle",
    "--format=esm",
    "--outdir=dist",
    `--define:process.env.STEFAN_BUILD_ID=${JSON.stringify(buildId)}`,
  ],
  env
);
