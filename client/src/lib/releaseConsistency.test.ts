import { describe, expect, it, vi } from "vitest";
import { enforceReleaseConsistency } from "./releaseConsistency";

function dependencies(overrides: Partial<Parameters<typeof enforceReleaseConsistency>[0]> = {}) {
  return {
    clientRelease: "r-client",
    isDevelopment: false,
    fetchServerRelease: vi.fn().mockResolvedValue("r-server"),
    clearStefanCaches: vi.fn().mockResolvedValue(undefined),
    updateServiceWorker: vi.fn().mockResolvedValue(undefined),
    getReloadGuard: vi.fn().mockReturnValue(null),
    setReloadGuard: vi.fn(),
    reload: vi.fn(),
    ...overrides,
  };
}

describe("release consistency", () => {
  it("does nothing when the browser and server run the same release", async () => {
    const input = dependencies({ fetchServerRelease: vi.fn().mockResolvedValue("r-client") });

    await expect(enforceReleaseConsistency(input)).resolves.toBe("current");
    expect(input.clearStefanCaches).not.toHaveBeenCalled();
    expect(input.reload).not.toHaveBeenCalled();
  });

  it("clears only Stefan cache and reloads once after a release mismatch", async () => {
    const input = dependencies();

    await expect(enforceReleaseConsistency(input)).resolves.toBe("reloading");
    expect(input.setReloadGuard).toHaveBeenCalledWith("r-client:r-server");
    expect(input.clearStefanCaches).toHaveBeenCalledOnce();
    expect(input.updateServiceWorker).toHaveBeenCalledOnce();
    expect(input.reload).toHaveBeenCalledOnce();
  });

  it("prevents a reload loop when the same mismatch persists", async () => {
    const input = dependencies({ getReloadGuard: vi.fn().mockReturnValue("r-client:r-server") });

    await expect(enforceReleaseConsistency(input)).resolves.toBe("guarded");
    expect(input.clearStefanCaches).not.toHaveBeenCalled();
    expect(input.updateServiceWorker).not.toHaveBeenCalled();
    expect(input.reload).not.toHaveBeenCalled();
  });

  it("keeps the current page intact when the release endpoint is unavailable", async () => {
    const input = dependencies({ fetchServerRelease: vi.fn().mockRejectedValue(new Error("offline")) });

    await expect(enforceReleaseConsistency(input)).resolves.toBe("unavailable");
    expect(input.clearStefanCaches).not.toHaveBeenCalled();
    expect(input.reload).not.toHaveBeenCalled();
  });
});
