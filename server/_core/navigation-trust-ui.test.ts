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

describe("navigation, official updates and trust UI", () => {
  it("keeps desktop content unobstructed and exposes an accessible on-demand menu", () => {
    const layout = readClientFile("components", "StefanLayout.tsx");

    expect(layout).toContain("{isSidebarOpen && (");
    expect(layout).toContain('aria-controls="stefan-navigation"');
    expect(layout).toContain("aria-expanded={isSidebarOpen}");
    expect(layout).toContain("closeOnEscape");
    expect(layout).toContain("<OfficialUpdatesBar />");
    expect(layout).toContain("expandedGroup");
    expect(layout).toContain("aria-expanded={expandedGroup === group.label}");
    expect(layout).toContain("min-h-0 flex-1");
    expect(layout).not.toContain("lg:pl-[17rem]");
    expect(layout).not.toContain("lg:translate-x-0");
  });

  it("renders the RSS bar from verified local official publications without placeholders", () => {
    const ticker = readClientFile("components", "OfficialUpdatesBar.tsx");

    expect(ticker).toContain("trpc.legalNews.getRecent.useQuery()");
    expect(ticker).toContain("href={item.url}");
    expect(ticker).toContain("office-ticker-track");
    expect(ticker).toContain("aria-hidden={isDuplicate || undefined}");
    expect(ticker).not.toContain("overflow-x-auto");
    expect(ticker).toContain("Brak nowych publikacji w lokalnej kopii");
    expect(ticker).not.toContain(
      "Nowelizacja ustawy o ochronie danych osobowych"
    );
  });

  it("makes trust information visible while rejecting unsupported certification claims", () => {
    const home = readClientFile("pages", "Home.tsx");
    const about = readClientFile("pages", "About.tsx");

    expect(home).toContain("Standard zaufania Stefana");
    expect(home).toContain('href="/about"');
    expect(about).toContain("RODO — rozporządzenie (UE) 2016/679");
    expect(about).toContain("AI Act — rozporządzenie (UE) 2024/1689");
    expect(about).toContain("UODO — prawa osoby, której dane dotyczą");
    expect(about).toContain("nie jest formalnym certyfikatem zgodności");
    expect(about).toContain("Pasternak Jarek — Jaro&apos;Devil");
  });

  it("uses available workspace width after the navigation is collapsed", () => {
    const home = readClientFile("pages", "Home.tsx");
    const settings = readClientFile("pages", "Settings.tsx");

    expect(home).toContain('className="container max-w-none py-8 lg:py-10"');
    expect(settings).toContain(
      'className="container max-w-none py-8 space-y-6 lg:py-10"'
    );
    expect(settings).toContain('className="grid gap-6 xl:grid-cols-2"');
    expect(settings).toContain('className="xl:col-span-2"');
  });

  it("provides a visible account entry where stored work is unavailable", () => {
    const account = readClientFile("components", "AccountAccess.tsx");
    const sessions = readClientFile("pages", "Sessions.tsx");
    const notes = readClientFile("pages", "Notes.tsx");

    expect(account).toContain("getLoginUrl");
    expect(account).toContain('const ACCESS_PIN = "XXXX"');
    expect(account).toContain("Manus OAuth");
    expect(sessions).toContain('<AccountAccess variant="inline" />');
    expect(notes).toContain('<AccountAccess variant="inline" />');
  });
});
