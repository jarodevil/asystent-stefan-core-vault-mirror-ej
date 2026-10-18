export type ReleaseConsistencyDependencies = {
  clientRelease: string;
  isDevelopment: boolean;
  fetchServerRelease: () => Promise<string>;
  clearStefanCaches: () => Promise<void>;
  updateServiceWorker: () => Promise<void>;
  getReloadGuard: () => string | null;
  setReloadGuard: (value: string) => void;
  reload: () => void;
};

export type ReleaseConsistencyResult =
  | "skipped"
  | "current"
  | "reloading"
  | "guarded"
  | "unavailable";

const RELOAD_GUARD_KEY = "stefan-release-reload";

/**
 * Porównuje klienta z serwerem i odświeża wyłącznie Cache Storage Stefana.
 * Celowo nie dotyka cookies, localStorage ani danych trwałych użytkownika.
 */
export async function enforceReleaseConsistency(
  dependencies: ReleaseConsistencyDependencies
): Promise<ReleaseConsistencyResult> {
  if (dependencies.isDevelopment) return "skipped";

  try {
    const serverRelease = await dependencies.fetchServerRelease();
    if (!serverRelease || serverRelease === dependencies.clientRelease) {
      return "current";
    }

    const guardValue = `${dependencies.clientRelease}:${serverRelease}`;
    if (dependencies.getReloadGuard() === guardValue) {
      return "guarded";
    }

    dependencies.setReloadGuard(guardValue);
    await dependencies.clearStefanCaches();
    await dependencies.updateServiceWorker();
    dependencies.reload();
    return "reloading";
  } catch {
    // Brak sieci lub chwilowy błąd nie może przerywać pracy w trybie offline.
    return "unavailable";
  }
}

export function startReleaseConsistencyCheck() {
  if (typeof window === "undefined" || typeof caches === "undefined") return;

  void enforceReleaseConsistency({
    clientRelease: import.meta.env.VITE_STEFAN_BUILD_ID || "development",
    isDevelopment: import.meta.env.DEV,
    fetchServerRelease: async () => {
      const response = await fetch("/api/app-version", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!response.ok) throw new Error("Version endpoint unavailable");
      const payload = (await response.json()) as { release?: unknown };
      if (typeof payload.release !== "string") throw new Error("Invalid version response");
      return payload.release;
    },
    clearStefanCaches: async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("stefan-"))
          .map((name) => caches.delete(name))
      );
    },
    updateServiceWorker: async () => {
      if (!("serviceWorker" in navigator)) return;
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
    },
    getReloadGuard: () => sessionStorage.getItem(RELOAD_GUARD_KEY),
    setReloadGuard: (value) => sessionStorage.setItem(RELOAD_GUARD_KEY, value),
    reload: () => window.location.reload(),
  });
}
