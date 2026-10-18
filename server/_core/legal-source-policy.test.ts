import { describe, expect, it } from "vitest";
import {
  OFFICIAL_LEGAL_SOURCES,
  isOfficialLegalSourceUrl,
} from "./legal-source-policy";

describe("official legal source policy", () => {
  it("contains only secure official-source URLs and the core legal publication channels", () => {
    const domains = OFFICIAL_LEGAL_SOURCES.map(source => source.domain);

    expect(domains).toEqual(
      expect.arrayContaining([
        "api.sejm.gov.pl",
        "isap.sejm.gov.pl",
        "dziennikiurzedowe.gov.pl",
        "rcl.gov.pl",
        "legislacja.gov.pl",
        "ksef.podatki.gov.pl",
        "sn.pl",
      ])
    );
    expect(
      OFFICIAL_LEGAL_SOURCES.every(source => source.url.startsWith("https://"))
    ).toBe(true);
  });

  it("admits an exact official source and rejects an unrelated host", () => {
    expect(
      isOfficialLegalSourceUrl("https://api.sejm.gov.pl/eli/acts/DU/2026")
    ).toBe(true);
    expect(isOfficialLegalSourceUrl("https://example.com/act")).toBe(false);
  });
});
