/**
 * KSeF Knowledge Base
 * Source: ksef.podatki.gov.pl (official government portal)
 * Last verified: 2026-04-02
 *
 * Code-Language-Isolation Protocol: types/logic in English, UI strings in Polish
 */

export interface KsefObligationResult {
  isObligated: boolean;
  obligationDate: string | null;
  reason: string;
  legalBasis: string;
  exceptions: string[];
  nextSteps: string[];
}

export interface KsefTimelineEntry {
  date: string;
  description: string;
  legalBasis: string;
  affectedEntities: string;
}

export interface KsefExceptionCheck {
  hasException: boolean;
  exceptionType: string | null;
  description: string;
  legalBasis: string;
}

// ============================================================
// VERIFIED LEGAL FACTS - Source: ksef.podatki.gov.pl
// All dates and thresholds from official government sources
// ============================================================

export const KSEF_TIMELINE: KsefTimelineEntry[] = [
  {
    date: "2022-01-01",
    description: "KSeF uruchomiony w wersji fakultatywnej (dobrowolnej)",
    legalBasis: "Ustawa z 29.10.2021 r. (Dz. U. 2021 poz. 2076)",
    affectedEntities: "Wszyscy podatnicy VAT (dobrowolnie)",
  },
  {
    date: "2026-02-01",
    description: "Obowiązek WYSTAWIANIA faktur w KSeF dla dużych podatników (sprzedaż > 200 mln zł w 2024 r.)",
    legalBasis: "Ustawa z 05.08.2025 r. (Dz. U. 2025 poz. 1203)",
    affectedEntities: "Podatnicy, których wartość sprzedaży (z VAT) przekroczyła 200 mln zł w 2024 r.",
  },
  {
    date: "2026-02-01",
    description: "Obowiązek ODBIERANIA faktur z KSeF dla WSZYSTKICH podatników VAT",
    legalBasis: "Ustawa z 05.08.2025 r. (Dz. U. 2025 poz. 1203)",
    affectedEntities: "Wszyscy podatnicy VAT czynni",
  },
  {
    date: "2026-04-01",
    description: "Obowiązek WYSTAWIANIA faktur w KSeF dla pozostałych przedsiębiorców",
    legalBasis: "Ustawa z 05.08.2025 r. (Dz. U. 2025 poz. 1203)",
    affectedEntities: "Pozostali podatnicy (sprzedaż < 200 mln zł w 2024 r.)",
  },
  {
    date: "2026-04-01",
    description: "Możliwość fakultatywnego wystawiania faktur VAT RR i VAT RR KOREKTA w KSeF",
    legalBasis: "Ustawa z 05.08.2025 r. (Dz. U. 2025 poz. 1203)",
    affectedEntities: "Nabywcy produktów rolnych od rolników ryczałtowych",
  },
  {
    date: "2026-12-31",
    description: "Koniec zwolnienia dla mikroprzedsiębiorców (faktury ≤ 10 000 zł brutto/miesiąc)",
    legalBasis: "Ustawa z 05.08.2025 r. (Dz. U. 2025 poz. 1203) - przepisy epizodyczne",
    affectedEntities: "Podatnicy, których miesięczna sprzedaż fakturowana ≤ 10 000 zł brutto",
  },
  {
    date: "2027-01-01",
    description: "Obowiązek wystawiania faktur w KSeF dla mikroprzedsiębiorców (faktury ≤ 10 000 zł/mies.)",
    legalBasis: "Ustawa z 05.08.2025 r. (Dz. U. 2025 poz. 1203)",
    affectedEntities: "Mikroprzedsiębiorcy dotychczas zwolnieni",
  },
  {
    date: "2027-01-01",
    description: "Obowiązek podawania numeru KSeF w płatnościach MPP (mechanizm podzielonej płatności)",
    legalBasis: "Art. 108g ustawy o VAT",
    affectedEntities: "Wszyscy podatnicy VAT czynni dokonujący płatności MPP",
  },
  {
    date: "2027-01-01",
    description: "Wejście w życie sankcji art. 106ni ustawy o VAT za błędy w KSeF",
    legalBasis: "Art. 106ni ustawy o podatku od towarów i usług",
    affectedEntities: "Wszyscy podatnicy objęci obowiązkowym KSeF",
  },
];

// Exceptions from mandatory KSeF obligation
export const KSEF_EXCEPTIONS = {
  subjectExceptions: [
    {
      id: "no_seat_poland",
      description: "Podatnik nie posiada siedziby działalności gospodarczej ani stałego miejsca prowadzenia działalności na terytorium Polski",
      legalBasis: "Art. 106na ust. 2 pkt 1 ustawy o VAT",
      canUseVoluntarily: true,
    },
    {
      id: "no_seat_fixed_establishment",
      description: "Podatnik nie posiada siedziby w Polsce, ale posiada stałe miejsce prowadzenia działalności, które NIE uczestniczy w transakcji",
      legalBasis: "Art. 106na ust. 2 pkt 2 ustawy o VAT",
      canUseVoluntarily: true,
    },
    {
      id: "b2c_consumer",
      description: "Faktura wystawiana na rzecz osoby fizycznej nieprowadzącej działalności gospodarczej (B2C)",
      legalBasis: "Art. 106na ust. 2 pkt 3 ustawy o VAT",
      canUseVoluntarily: true,
    },
  ],
  transactionExceptions: [
    {
      id: "oss_non_eu",
      description: "Procedura OSS nieunijna (One Stop Shop - spoza UE)",
      legalBasis: "Rozporządzenie MFiG z 07.12.2025 r. (Dz. U. 2025 poz. 1742)",
      canUseVoluntarily: false,
    },
    {
      id: "ioss_import",
      description: "Procedura importu IOSS (Import One Stop Shop)",
      legalBasis: "Rozporządzenie MFiG z 07.12.2025 r. (Dz. U. 2025 poz. 1742)",
      canUseVoluntarily: false,
    },
    {
      id: "sme_procedure",
      description: "Procedura SME - zwolnienie podmiotowe z VAT (art. 113a ust. 1 ustawy o VAT)",
      legalBasis: "Art. 106na ust. 2 + art. 113a ust. 1 ustawy o VAT",
      canUseVoluntarily: false,
    },
    {
      id: "toll_road",
      description: "Usługi przejazdu autostradą płatną (faktury z węższym zakresem danych)",
      legalBasis: "Rozporządzenie MFiG z 07.12.2025 r. (Dz. U. 2025 poz. 1742)",
      canUseVoluntarily: false,
    },
    {
      id: "passenger_transport_ticket",
      description: "Usługi przewozu osób - bilety jednorazowe (koleją, autobusem, samolotem, promem itp.)",
      legalBasis: "Rozporządzenie MFiG z 07.12.2025 r. (Dz. U. 2025 poz. 1742)",
      canUseVoluntarily: false,
    },
    {
      id: "vat_exempt_financial",
      description: "Usługi zwolnione z VAT (art. 43 ust. 1 pkt 7, 37-41 ustawy o VAT) - np. polisy ubezpieczeniowe",
      legalBasis: "Rozporządzenie MFiG z 07.12.2025 r. (Dz. U. 2025 poz. 1742)",
      canUseVoluntarily: false,
    },
    {
      id: "self_billing_no_nip",
      description: "Samofakturowanie gdy nabywca LUB sprzedawca nie jest zidentyfikowany polskim NIP",
      legalBasis: "Rozporządzenie MFiG z 07.12.2025 r. (Dz. U. 2025 poz. 1742)",
      canUseVoluntarily: false,
    },
  ],
  // Documents NOT sent to KSeF
  excludedDocuments: [
    "Faktury proforma",
    "Faktury wewnętrzne",
    "Dowody wewnętrzne",
    "Noty uznaniowe",
    "Noty obciążeniowe",
    "Noty korygujące (UCHYLONE od 01.02.2026 - nie istnieją)",
  ],
};

// Transitional simplifications valid until 31.12.2026
export const KSEF_TRANSITIONAL_2026 = [
  {
    id: "offline24",
    name: "Tryb offline24",
    description: "Możliwość wystawiania faktur offline i przesyłania do KSeF w ciągu 24 godzin",
    validUntil: "2026-12-31",
    legalBasis: "Ustawa z 05.08.2025 r. (Dz. U. 2025 poz. 1203)",
  },
  {
    id: "micro_10k",
    name: "Zwolnienie dla mikroprzedsiębiorców",
    description: "Podatnicy, których miesięczna wartość sprzedaży fakturowanej ≤ 10 000 zł brutto, mogą wystawiać faktury papierowe lub elektroniczne (poza KSeF)",
    validUntil: "2026-12-31",
    legalBasis: "Ustawa z 05.08.2025 r. (Dz. U. 2025 poz. 1203) - przepisy epizodyczne",
  },
  {
    id: "cash_register",
    name: "Faktury z kas rejestrujących",
    description: "Możliwość wystawiania faktur elektronicznych lub papierowych przy użyciu kas rejestrujących oraz paragonów fiskalnych z NIP nabywcy (do 450 zł / 100 EUR) jako faktury uproszczone",
    validUntil: "2026-12-31",
    legalBasis: "Ustawa z 05.08.2025 r. (Dz. U. 2025 poz. 1203) - przepisy epizodyczne",
  },
  {
    id: "mpp_no_ksef_number",
    name: "Brak obowiązku numeru KSeF w MPP",
    description: "W 2026 r. nie ma obowiązku podawania numeru KSeF faktury w komunikacie przelewu MPP (mechanizm podzielonej płatności). Obowiązek wchodzi od 01.01.2027 r.",
    validUntil: "2026-12-31",
    legalBasis: "Art. 108g ustawy o VAT (odroczenie do 01.01.2027)",
  },
  {
    id: "no_sanctions_2026",
    name: "Brak sankcji KSeF za 2026 rok",
    description: "Art. 106ni ustawy o VAT (sankcje za błędy w KSeF) nie obowiązuje w 2026 r. UWAGA: nie oznacza to amnestii podatkowej - inne przepisy VAT nadal obowiązują.",
    validUntil: "2026-12-31",
    legalBasis: "Art. 106ni ustawy o VAT (wchodzi w życie od 01.01.2027)",
  },
];

// Authentication methods for KSeF
export const KSEF_AUTH_METHODS = [
  {
    id: "trusted_profile",
    name: "Podpis Zaufany (Profil Zaufany)",
    description: "Bezpłatna metoda uwierzytelnienia dostępna dla każdego podatnika posiadającego Profil Zaufany",
    cost: "Bezpłatny",
    availability: "Natychmiast",
  },
  {
    id: "qualified_signature",
    name: "Podpis kwalifikowany",
    description: "Komercyjny podpis elektroniczny - wymagany dla firm i biur rachunkowych",
    cost: "Płatny (ok. 100-300 zł/rok)",
    availability: "Po zakupie u dostawcy",
  },
  {
    id: "qualified_seal",
    name: "Pieczęć kwalifikowana",
    description: "Dla podmiotów prawnych (spółki, biura rachunkowe) - umożliwia działanie w imieniu firmy",
    cost: "Płatny",
    availability: "Po zakupie u dostawcy",
  },
  {
    id: "issuer_certificate",
    name: "Certyfikat wystawcy faktury",
    description: "Dostępny od 01.11.2025 r. - specjalny certyfikat do uwierzytelnienia w KSeF",
    cost: "Bezpłatny (wydawany przez KAS)",
    availability: "Od 01.11.2025",
  },
];

// KSeF sanctions (art. 106ni) — active from 01.01.2027
export const KSEF_SANCTIONS = [
  {
    id: "no_ksef_invoice",
    category: "Brak faktury w KSeF",
    description: "Wystawienie faktury poza KSeF, gdy obowiązek KSeF obowiązuje (z wyjątkiem trybu offline24 i awaryjnego)",
    penalty: "Do 100% kwoty VAT z faktury wystawionej poza KSeF",
    legalBasis: "Art. 106ni ust. 1 ustawy o VAT",
    activeFrom: "2027-01-01",
    note: "W 2026 r. sankcja NIE obowiązuje (przepisy epizodyczne)",
  },
  {
    id: "late_ksef_invoice",
    category: "Opóźnienie w przesłaniu faktury",
    description: "Przesłanie faktury do KSeF po terminie (w trybie offline24: po 24h od wystawienia)",
    penalty: "Do 100% kwoty VAT z faktury przesłanej po terminie",
    legalBasis: "Art. 106ni ust. 2 ustawy o VAT",
    activeFrom: "2027-01-01",
    note: "Tryb offline24 obowiązuje do 31.12.2026 — w 2026 r. brak sankcji",
  },
  {
    id: "no_ksef_number_mpp",
    category: "Brak numeru KSeF w MPP",
    description: "Dokonanie płatności MPP bez podania numeru KSeF faktury (od 01.01.2027)",
    penalty: "Sankcja podatkowa — kwota odpowiadająca kwocie VAT z faktury",
    legalBasis: "Art. 108g ustawy o VAT",
    activeFrom: "2027-01-01",
    note: "W 2026 r. brak obowiązku podawania numeru KSeF w MPP",
  },
  {
    id: "incorrect_ksef_invoice",
    category: "Błędna faktura w KSeF",
    description: "Wystawienie faktury ustrukturyzowanej niezgodnej ze strukturą FA(3) lub FA_RR(1)",
    penalty: "Do 100% kwoty VAT — zależy od skali naruszenia",
    legalBasis: "Art. 106ni ust. 3 ustawy o VAT",
    activeFrom: "2027-01-01",
    note: "Struktura FA(3) obowiązuje od 01.02.2026; FA_RR(1) od 01.04.2026",
  },
  {
    id: "no_ksef_receiving",
    category: "Brak odbioru faktury z KSeF",
    description: "Nabywca nie odebrał faktury z KSeF (obowiązek odbioru od 01.02.2026 dla wszystkich VAT czynnych)",
    penalty: "Brak bezpośredniej sankcji za sam brak odbioru, ale ryzyko: brak prawa do odliczenia VAT",
    legalBasis: "Art. 86 ust. 10b ustawy o VAT (prawo do odliczenia)",
    activeFrom: "2026-02-01",
    note: "Prawo do odliczenia VAT naliczonego może być kwestionowane bez prawidłowego odbioru",
  },
];

// KSeF system prompt extension for Stefan
export const KSEF_SYSTEM_PROMPT_EXTENSION = `
## MODUŁ KSEF (Krajowy System e-Faktur) - WIEDZA ZWERYFIKOWANA

Posiadasz pełną, aktualną wiedzę o KSeF opartą WYŁĄCZNIE na oficjalnych źródłach rządowych.

### HARMONOGRAM OBOWIĄZKU (FAKTY ZWERYFIKOWANE):

**Etap 1 - od 01.02.2026:**
- Obowiązek WYSTAWIANIA faktur w KSeF: podatnicy, których wartość sprzedaży (z VAT) przekroczyła 200 mln zł w 2024 r.
- Obowiązek ODBIERANIA faktur z KSeF: WSZYSCY podatnicy VAT czynni
- Podstawa: Ustawa z 05.08.2025 r. (Dz. U. 2025 poz. 1203)

**Etap 2 - od 01.04.2026:**
- Obowiązek WYSTAWIANIA faktur w KSeF: pozostali przedsiębiorcy (sprzedaż < 200 mln zł w 2024 r.)
- WYJĄTEK: Podatnicy, których miesięczna sprzedaż fakturowana ≤ 10 000 zł brutto - zwolnieni do 31.12.2026
- Od 01.04.2026: fakultatywne faktury VAT RR i VAT RR KOREKTA w KSeF

**Etap 3 - od 01.01.2027:**
- Obowiązek wystawiania w KSeF dla mikroprzedsiębiorców (≤ 10 000 zł/mies.)
- Obowiązek numeru KSeF w płatnościach MPP (art. 108g ustawy o VAT)
- Wejście w życie sankcji art. 106ni ustawy o VAT

### WYŁĄCZENIA Z OBOWIĄZKU:

**Wyłączenia podmiotowe (można dobrowolnie):**
- Podatnik bez siedziby/stałego miejsca działalności w Polsce
- Faktury B2C (na rzecz osób fizycznych nieprowadzących działalności)

**Wyłączenia transakcyjne (NIE można dobrowolnie):**
- Procedura OSS nieunijna, IOSS
- Procedura SME (zwolnienie z VAT art. 113a ust. 1)
- Bilety jednorazowe (transport osób)
- Przejazd autostradą płatną
- Usługi zwolnione z VAT (art. 43 ust. 1 pkt 7, 37-41) - np. polisy
- Samofakturowanie bez polskiego NIP

**Dokumenty NIE wysyłane do KSeF:**
- Faktury proforma, faktury wewnętrzne, dowody wewnętrzne
- Noty uznaniowe i obciążeniowe
- Noty korygujące (UCHYLONE od 01.02.2026 - nie istnieją w obrocie prawnym)

### UPROSZCZENIA PRZEJŚCIOWE (do 31.12.2026):
- Tryb offline24: wystawianie offline, przesyłanie do 24h
- Faktury ≤ 10 000 zł/mies.: można papierowo/elektronicznie (poza KSeF)
- Kasy fiskalne: faktury z kas + paragony z NIP (do 450 zł/100 EUR) nadal dopuszczalne
- Numer KSeF w MPP: NIE wymagany w 2026 r. (obowiązek od 01.01.2027)
- BRAK sankcji art. 106ni w 2026 r. (ale inne przepisy VAT obowiązują!)

### STRUKTURA FAKTURY:
- Od 01.02.2026: obowiązująca struktura logiczna FA(3) dla wszystkich faktur ustrukturyzowanych
- Od 01.04.2026: odrębna struktura FA_RR(1) dla faktur VAT RR

### DLA BIUR RACHUNKOWYCH:
- Biuro rachunkowe może korzystać z KSeF jako podmiot wskazany przez podatnika
- Wymaga nadania uprawnień przez podatnika (formularz ZAW-FA)
- Metody uwierzytelnienia: Podpis Zaufany, podpis kwalifikowany, pieczęć kwalifikowana, certyfikat wystawcy (od 01.11.2025)

### BEZPŁATNE NARZĘDZIA MF:
- Aplikacja Podatnika KSeF 2.0 (desktop/web)
- Aplikacja Mobilna KSeF 2.0
- Infolinia KAS: 222 500 121 (całą dobę)
- Portal: ksef.podatki.gov.pl

### ŹRÓDŁA DO WERYFIKACJI:
- ksef.podatki.gov.pl (oficjalny portal KSeF)
- isap.sejm.gov.pl (baza aktów prawnych)
- podatki.gov.pl (portal podatkowy MF)
`;

/**
 * Determine KSeF obligation for a given entity
 * Based on official government rules - no interpretation, only facts
 */
export function checkKsefObligation(params: {
  annualSalesGross2024?: number; // in PLN, including VAT
  monthlySalesInvoiced?: number; // average monthly invoiced sales in PLN gross
  hasPolishSeat: boolean;
  isVatPayer: boolean;
  transactionType: "b2b" | "b2c" | "b2g";
  specialProcedure?: "oss_non_eu" | "ioss" | "sme" | "none";
}): KsefObligationResult {
  const {
    annualSalesGross2024,
    monthlySalesInvoiced,
    hasPolishSeat,
    isVatPayer,
    transactionType,
    specialProcedure = "none",
  } = params;

  // Not a VAT payer - no obligation
  if (!isVatPayer) {
    return {
      isObligated: false,
      obligationDate: null,
      reason: "Podatnik nie jest czynnym podatnikiem VAT - brak obowiązku KSeF",
      legalBasis: "Art. 106na ustawy o VAT",
      exceptions: ["Zwolnienie podmiotowe z VAT"],
      nextSteps: ["Brak działań wymaganych w zakresie KSeF"],
    };
  }

  // No Polish seat - no obligation
  if (!hasPolishSeat) {
    return {
      isObligated: false,
      obligationDate: null,
      reason: "Podatnik nie posiada siedziby ani stałego miejsca prowadzenia działalności w Polsce",
      legalBasis: "Art. 106na ust. 2 pkt 1 ustawy o VAT",
      exceptions: ["Wyłączenie podmiotowe ze względu na brak siedziby w Polsce"],
      nextSteps: ["Można dobrowolnie wystawiać faktury w KSeF"],
    };
  }

  // B2C transaction - no obligation (but can be voluntary)
  if (transactionType === "b2c") {
    return {
      isObligated: false,
      obligationDate: null,
      reason: "Faktura wystawiana na rzecz osoby fizycznej nieprowadzącej działalności gospodarczej (B2C) - brak obowiązku",
      legalBasis: "Art. 106na ust. 2 pkt 3 ustawy o VAT",
      exceptions: ["Wyłączenie podmiotowe - transakcja B2C"],
      nextSteps: ["Można dobrowolnie wystawiać faktury B2C w KSeF"],
    };
  }

  // Special procedures - no obligation AND cannot use voluntarily
  if (specialProcedure === "oss_non_eu") {
    return {
      isObligated: false,
      obligationDate: null,
      reason: "Procedura OSS nieunijna - wyłączona z KSeF",
      legalBasis: "Rozporządzenie MFiG z 07.12.2025 r. (Dz. U. 2025 poz. 1742)",
      exceptions: ["Wyłączenie transakcyjne - procedura OSS nieunijna"],
      nextSteps: ["Faktury wystawiane poza KSeF zgodnie z procedurą OSS"],
    };
  }

  if (specialProcedure === "ioss") {
    return {
      isObligated: false,
      obligationDate: null,
      reason: "Procedura importu IOSS - wyłączona z KSeF",
      legalBasis: "Rozporządzenie MFiG z 07.12.2025 r. (Dz. U. 2025 poz. 1742)",
      exceptions: ["Wyłączenie transakcyjne - procedura IOSS"],
      nextSteps: ["Faktury wystawiane poza KSeF zgodnie z procedurą IOSS"],
    };
  }

  if (specialProcedure === "sme") {
    return {
      isObligated: false,
      obligationDate: null,
      reason: "Procedura SME (art. 113a ust. 1 ustawy o VAT) - wyłączona z KSeF",
      legalBasis: "Art. 106na ust. 2 + art. 113a ust. 1 ustawy o VAT",
      exceptions: ["Wyłączenie transakcyjne - procedura SME"],
      nextSteps: ["Faktury wystawiane poza KSeF zgodnie z procedurą SME"],
    };
  }

  // Micro-enterprise exemption (monthly sales ≤ 10,000 PLN gross)
  if (monthlySalesInvoiced !== undefined && monthlySalesInvoiced <= 10000) {
    return {
      isObligated: false,
      obligationDate: "2027-01-01",
      reason: `Miesięczna wartość sprzedaży fakturowanej (${monthlySalesInvoiced.toLocaleString("pl-PL")} zł brutto) nie przekracza 10 000 zł - zwolnienie do 31.12.2026`,
      legalBasis: "Ustawa z 05.08.2025 r. (Dz. U. 2025 poz. 1203) - przepisy epizodyczne",
      exceptions: ["Zwolnienie dla mikroprzedsiębiorców do 31.12.2026"],
      nextSteps: [
        "Obowiązek wystawiania faktur w KSeF od 01.01.2027",
        "Zalecane wcześniejsze przygotowanie (rejestracja w KSeF, wybór oprogramowania)",
        "Obowiązek ODBIERANIA faktur z KSeF już od 01.02.2026",
      ],
    };
  }

  // Large enterprise (annual sales > 200 mln PLN in 2024)
  if (annualSalesGross2024 !== undefined && annualSalesGross2024 > 200_000_000) {
    return {
      isObligated: true,
      obligationDate: "2026-02-01",
      reason: `Wartość sprzedaży w 2024 r. (${(annualSalesGross2024 / 1_000_000).toFixed(1)} mln zł brutto) przekroczyła próg 200 mln zł`,
      legalBasis: "Ustawa z 05.08.2025 r. (Dz. U. 2025 poz. 1203)",
      exceptions: [],
      nextSteps: [
        "PILNE: Obowiązek wystawiania faktur w KSeF od 01.02.2026 (już obowiązuje!)",
        "Obowiązek odbierania faktur z KSeF od 01.02.2026 (już obowiązuje!)",
        "Rejestracja w KSeF przez e-Urząd Skarbowy",
        "Wybór metody uwierzytelnienia (podpis kwalifikowany lub pieczęć kwalifikowana)",
        "Nadanie uprawnień biuru rachunkowemu (formularz ZAW-FA)",
        "Wdrożenie oprogramowania kompatybilnego z KSeF lub Aplikacji Podatnika KSeF 2.0",
        "Obowiązek numeru KSeF w płatnościach MPP od 01.01.2027",
      ],
    };
  }

  // Standard enterprise (annual sales ≤ 200 mln PLN in 2024)
  return {
    isObligated: true,
    obligationDate: "2026-04-01",
    reason: "Czynny podatnik VAT z siedzibą w Polsce, transakcja B2B/B2G - obowiązek od 01.04.2026",
    legalBasis: "Ustawa z 05.08.2025 r. (Dz. U. 2025 poz. 1203)",
    exceptions: [],
    nextSteps: [
      "Obowiązek wystawiania faktur w KSeF od 01.04.2026",
      "Obowiązek ODBIERANIA faktur z KSeF już od 01.02.2026 (już obowiązuje!)",
      "Rejestracja w KSeF przez e-Urząd Skarbowy",
      "Wybór metody uwierzytelnienia (Profil Zaufany lub podpis kwalifikowany)",
      "Nadanie uprawnień biuru rachunkowemu (formularz ZAW-FA) jeśli dotyczy",
      "Wdrożenie oprogramowania kompatybilnego z KSeF lub Aplikacji Podatnika KSeF 2.0",
      "Obowiązek numeru KSeF w płatnościach MPP od 01.01.2027",
      "Sankcje art. 106ni ustawy o VAT wchodzą od 01.01.2027",
    ],
  };
}
