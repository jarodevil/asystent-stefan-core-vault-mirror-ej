import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "../..");

describe("PWA development guard", () => {
  it("unregisters Stefan PWA caches in Vite development before loading React", () => {
    const html = fs.readFileSync(path.join(projectRoot, "client/index.html"), "utf8");

    expect(html).toContain("const isDevelopment = import.meta.env.DEV");
    expect(html).toContain("navigator.serviceWorker.getRegistrations()");
    expect(html).toContain("name.startsWith('stefan-')");
    expect(html).toContain("if (hadController) window.location.reload()");
    expect(html.indexOf("navigator.serviceWorker.getRegistrations()")).toBeLessThan(
      html.indexOf('<script type="module" src="/src/main.tsx"></script>')
    );
  });

  it("binds the production Service Worker and its cache to the active release", () => {
    const html = fs.readFileSync(path.join(projectRoot, "client/index.html"), "utf8");
    const worker = fs.readFileSync(path.join(projectRoot, "client/public/sw.js"), "utf8");

    expect(html).toContain("VITE_STEFAN_BUILD_ID");
    expect(html).toContain("/sw.js?build=${encodeURIComponent(buildId)}");
    expect(html).toContain("updateViaCache: 'none'");
    expect(worker).toContain("new URL(self.location.href).searchParams.get('build')");
    expect(worker).toContain("const CACHE_VERSION = `stefan-${BUILD_ID}`");
    expect(worker).toContain("networkOnlyStrategy(request)");
    expect(worker).toContain("name.startsWith('stefan-')");
    expect(worker).not.toContain("stefan_pending_sync");
    expect(worker).not.toContain("sync-notes");
  });
});
