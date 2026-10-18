import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "../..");

function readClientFile(...segments: string[]) {
  return fs.readFileSync(
    path.join(projectRoot, "client", "src", ...segments),
    "utf8"
  );
}

describe("privacy, retention and GDPR request UI", () => {
  it("registers an integrated privacy route and navigation entry", () => {
    const app = readClientFile("App.tsx");
    const layout = readClientFile("components", "StefanLayout.tsx");
    const accountAccess = readClientFile("components", "AccountAccess.tsx");

    expect(app).toContain('import Privacy from "./pages/Privacy";');
    expect(app).toContain('<Route path="/privacy" component={Privacy} />');
    expect(layout).toContain('path: "/privacy"');
    expect(layout).toContain('label: "Prywatność i RODO"');
    expect(layout).toContain("<AccountAccess />");
    expect(accountAccess).toContain("getLoginUrl");
    expect(accountAccess).toContain("useAuth");
    expect(accountAccess).toContain("Manus OAuth");
  });

  it("states the implemented retention mechanics and a safe GDPR request channel", () => {
    const privacy = readClientFile("pages", "Privacy.tsx");

    expect(privacy).toContain("Prywatność, retencja danych i RODO");
    expect(privacy).toContain("ponad 30 dni są automatycznie");
    expect(privacy).toContain("jednym rotującym kluczem");
    expect(privacy).toMatch(/Procedura[\s\S]*zgłoszenia[\s\S]*RODO/);
    expect(privacy).toContain("Pasjar1979@gmail.com");
    expect(privacy).toContain("RODO — rozporządzenie (UE) 2016/679");
    expect(privacy).toContain("UODO — skarga");
    expect(privacy).toContain("nie zastępuje indywidualnej porady prawnej");
  });
});
