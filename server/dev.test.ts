import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Dev Panel - Owner-Only Access", () => {
  const ownerContext: Context = {
    user: {
      id: 1,
      openId: "test-owner",
      name: "Agnieszka Marcinkiewicz",
      email: "pasjar1979@gmail.com",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      loginMethod: "oauth",
    },
    req: {} as any,
    res: {} as any,
  };

  const nonOwnerContext: Context = {
    user: {
      id: 2,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      loginMethod: "oauth",
    },
    req: {} as any,
    res: {} as any,
  };

  const caller = appRouter.createCaller(ownerContext);
  const nonOwnerCaller = appRouter.createCaller(nonOwnerContext);

  describe("getSettings", () => {
    it("should allow owner to get settings", async () => {
      const settings = await caller.dev.getSettings();
      expect(settings).toBeDefined();
      expect(Array.isArray(settings)).toBe(true);
    });

    it("should deny non-owner access", async () => {
      await expect(nonOwnerCaller.dev.getSettings()).rejects.toThrow("Unauthorized: Owner-only");
    });
  });

  describe("updateSetting", () => {
    it("should allow owner to update setting", async () => {
      const result = await caller.dev.updateSetting({
        key: "test_key",
        value: "test_value",
      });
      expect(result).toBeDefined();
    });

    it("should deny non-owner access", async () => {
      await expect(
        nonOwnerCaller.dev.updateSetting({
          key: "test_key",
          value: "test_value",
        })
      ).rejects.toThrow("Unauthorized: Owner-only");
    });
  });

  describe("getErrorLogs", () => {
    it("should allow owner to get error logs", async () => {
      const logs = await caller.dev.getErrorLogs({ limit: 10, offset: 0 });
      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);
    });

    it("should deny non-owner access", async () => {
      await expect(
        nonOwnerCaller.dev.getErrorLogs({ limit: 10, offset: 0 })
      ).rejects.toThrow("Unauthorized: Owner-only");
    });
  });

  describe("getSourceWhitelist", () => {
    it("should allow owner to get source whitelist", async () => {
      const sources = await caller.dev.getSourceWhitelist();
      expect(sources).toBeDefined();
      expect(Array.isArray(sources)).toBe(true);
      
      // Verify default sources exist
      const domains = sources.map((s: any) => s.domain);
      expect(domains).toContain("sejm.gov.pl");
      expect(domains).toContain("podatki.gov.pl");
    });

    it("should deny non-owner access", async () => {
      await expect(nonOwnerCaller.dev.getSourceWhitelist()).rejects.toThrow("Unauthorized: Owner-only");
    });
  });

  describe("addSource", () => {
    beforeEach(async () => {
      // Cleanup test domain to avoid duplicate entry errors on re-runs
      const { getDb } = await import("./db");
      const { sourceWhitelist } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (db) {
        await db.delete(sourceWhitelist).where(eq(sourceWhitelist.domain, "test-domain.gov.pl"));
      }
    });

    it("should allow owner to add source", async () => {
      const result = await caller.dev.addSource({
        domain: "test-domain.gov.pl",
        description: "Test domain",
      });
      expect(result).toBeDefined();
    });

    it("should deny non-owner access", async () => {
      await expect(
        nonOwnerCaller.dev.addSource({
          domain: "test-domain.gov.pl",
          description: "Test domain",
        })
      ).rejects.toThrow("Unauthorized: Owner-only");
    });
  });
});

describe("Dev Settings - Default Values", () => {
  const ownerContext: Context = {
    user: {
      id: 1,
      openId: "test-owner",
      name: "Agnieszka Marcinkiewicz",
      email: "pasjar1979@gmail.com",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      loginMethod: "oauth",
    },
    req: {} as any,
    res: {} as any,
  };

  const caller = appRouter.createCaller(ownerContext);

  it("should have default temperature setting", async () => {
    const settings = await caller.dev.getSettings();
    const temperature = settings.find((s: any) => s.key === "temperature");
    expect(temperature).toBeDefined();
    expect(temperature?.value).toBe("0.1");
  });

  it("should have default model setting", async () => {
    const settings = await caller.dev.getSettings();
    const model = settings.find((s: any) => s.key === "model");
    expect(model).toBeDefined();
    expect(model?.value).toBe("gemini-3.1-pro-preview");
  });

  it("should have default thinking_level setting", async () => {
    const settings = await caller.dev.getSettings();
    const thinkingLevel = settings.find((s: any) => s.key === "thinking_level");
    expect(thinkingLevel).toBeDefined();
    expect(thinkingLevel?.value).toBe("high");
  });
});
