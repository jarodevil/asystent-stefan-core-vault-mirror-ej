export type OfficialLegalSource = {
  name: string;
  domain: string;
  url: string;
  description: string;
  scope: "published-law" | "legislative-process" | "tax" | "judiciary";
};

/**
 * Sources shown to the user and admitted to Stefan's knowledge workflow.
 * Each entry is an official Polish public institution or official publication.
 */
export const OFFICIAL_LEGAL_SOURCES: readonly OfficialLegalSource[] = [
  {
    name: "ELI API Sejmu RP",
    domain: "api.sejm.gov.pl",
    url: "https://api.sejm.gov.pl/eli_pl.html",
    description: "Dziennik Ustaw i Monitor Polski w ustandaryzowanym API.",
    scope: "published-law",
  },
  {
    name: "ISAP",
    domain: "isap.sejm.gov.pl",
    url: "https://isap.sejm.gov.pl/",
    description: "Internetowy System Aktów Prawnych Kancelarii Sejmu.",
    scope: "published-law",
  },
  {
    name: "Dzienniki Urzędowe RCL",
    domain: "dziennikiurzedowe.gov.pl",
    url: "https://dziennikiurzedowe.gov.pl/",
    description: "Oficjalne dzienniki urzędowe administracji rządowej.",
    scope: "published-law",
  },
  {
    name: "Rządowe Centrum Legislacji",
    domain: "rcl.gov.pl",
    url: "https://rcl.gov.pl/",
    description: "Informacje RCL oraz publikacje dotyczące legislacji.",
    scope: "legislative-process",
  },
  {
    name: "Rządowy Proces Legislacyjny",
    domain: "legislacja.gov.pl",
    url: "https://legislacja.gov.pl/",
    description: "Projekty ustaw i rozporządzeń prowadzone przez RCL.",
    scope: "legislative-process",
  },
  {
    name: "KSeF — Ministerstwo Finansów",
    domain: "ksef.podatki.gov.pl",
    url: "https://ksef.podatki.gov.pl/",
    description: "Komunikaty, materiały i kalendarium KSeF 2.0.",
    scope: "tax",
  },
  {
    name: "Sąd Najwyższy",
    domain: "sn.pl",
    url: "https://www.sn.pl/",
    description: "Oficjalne publikacje i informacje Sądu Najwyższego.",
    scope: "judiciary",
  },
] as const;

export function isOfficialLegalSourceUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname;
    return OFFICIAL_LEGAL_SOURCES.some(
      source =>
        hostname === source.domain || hostname.endsWith(`.${source.domain}`)
    );
  } catch {
    return false;
  }
}
