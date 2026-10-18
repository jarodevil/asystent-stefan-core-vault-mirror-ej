import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { chatSessions } from "../../drizzle/schema";
import {
  encryptDatabaseBackup,
  getManagedBackupEncryptionSecret,
} from "./backup-cron";

vi.mock("./sdk", () => ({
  sdk: { authenticateRequest: vi.fn() },
}));

import { sdk } from "./sdk";
import { createScheduledTaskHandler } from "./scheduled-tasks";

const projectRoot = path.resolve(import.meta.dirname, "../..");

describe("automation reliability contracts", () => {
  it("maps the archive flag to the existing production column", () => {
    expect(chatSessions.archived.name).toBe("isArchived");
  });

  it("encrypts database backup bytes and never keeps plaintext in the envelope", () => {
    const plaintext = Buffer.from("sensitive SQL backup payload");
    const encrypted = encryptDatabaseBackup(plaintext, "a".repeat(64));

    expect(encrypted.subarray(0, 20).toString("utf8")).toBe(
      "STEFAN_DB_BACKUP_V1\n"
    );
    expect(encrypted.includes(plaintext)).toBe(false);
  });

  it("accepts only a dedicated backup secret with sufficient entropy length", () => {
    expect(() => getManagedBackupEncryptionSecret("too-short")).toThrow(
      "Managed backup encryption secret is unavailable."
    );
    expect(getManagedBackupEncryptionSecret("a".repeat(32))).toHaveLength(32);
  });

  it("rejects non-cron calls before work is run", async () => {
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({
      isCron: false,
    } as any);
    const work = vi.fn();
    const handler = createScheduledTaskHandler("test", work);
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;

    await handler({ originalUrl: "/api/scheduled/test" } as any, response);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(work).not.toHaveBeenCalled();
  });

  it("runs authenticated cron work and returns a JSON success envelope", async () => {
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({
      isCron: true,
      taskUid: "cron-1",
    } as any);
    const handler = createScheduledTaskHandler("test", async () => ({
      count: 3,
    }));
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;

    await handler({ originalUrl: "/api/scheduled/test" } as any, response);

    expect(response.json).toHaveBeenCalledWith({
      ok: true,
      task: "test",
      result: { count: 3 },
    });
  });

  it("keeps recurring work out of the web-server process", () => {
    const serverSource = fs.readFileSync(
      path.join(projectRoot, "server/_core/index.ts"),
      "utf8"
    );
    const legacySources = ["rss-cron.ts", "archive-cron.ts", "backup-cron.ts"]
      .map(file =>
        fs.readFileSync(path.join(projectRoot, "server/_core", file), "utf8")
      )
      .join("\n");

    expect(serverSource).not.toContain("initRSSCronJob");
    expect(serverSource).not.toContain("initArchiveCron");
    expect(serverSource).not.toContain("initBackupCron");
    expect(legacySources).not.toContain("node-cron");
    expect(legacySources).not.toContain("setInterval(");
    expect(legacySources).not.toContain("setTimeout(");
  });

  it("never inserts invented legal-news fallback content", () => {
    const source = fs.readFileSync(
      path.join(projectRoot, "server/_core/rss-fetcher.ts"),
      "utf8"
    );

    expect(source).not.toContain("getFallbackNews");
    expect(source).not.toContain("fallback-1");
    expect(source).toContain("ELI API returned no official legal records");
  });
});
