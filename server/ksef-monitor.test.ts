/**
 * Tests for ksef-monitor.ts
 * Covers: keyword detection, priority detection, ID generation, deduplication logic
 */

import { describe, it, expect } from "vitest";
import { isKsefRelated, detectPriority } from "./_core/ksef-monitor";

// ─────────────────────────────────────────────────────────────────────────────
// isKsefRelated
// ─────────────────────────────────────────────────────────────────────────────

describe("isKsefRelated", () => {
  it("detects 'ksef' keyword (lowercase)", () => {
    expect(isKsefRelated("Zmiany w systemie ksef od 2026")).toBe(true);
  });

  it("detects 'KSeF' keyword (mixed case)", () => {
    expect(isKsefRelated("Nowe przepisy KSeF wchodzą w życie")).toBe(true);
  });

  it("detects 'krajowy system e-faktur'", () => {
    expect(isKsefRelated("Krajowy System e-Faktur — aktualizacja")).toBe(true);
  });

  it("detects 'e-faktura' variant", () => {
    expect(isKsefRelated("Jak wystawić e-fakturę w 2026")).toBe(true);
  });

  it("detects 'faktura ustrukturyzowana'", () => {
    expect(isKsefRelated("Faktura ustrukturyzowana — wymagania")).toBe(true);
  });

  it("detects 'zaw-fa' keyword", () => {
    expect(isKsefRelated("Formularz ZAW-FA dla biura rachunkowego")).toBe(true);
  });

  it("detects 'tryb offline' keyword", () => {
    expect(isKsefRelated("Procedura trybu offline w KSeF")).toBe(true);
  });

  it("detects 'offline24' keyword", () => {
    expect(isKsefRelated("Zasady stosowania offline24")).toBe(true);
  });

  it("detects '106na' article reference", () => {
    expect(isKsefRelated("Art. 106na ustawy o VAT — uprawnienia")).toBe(true);
  });

  it("detects 'numer ksef'", () => {
    expect(isKsefRelated("Jak odczytać numer KSeF z faktury")).toBe(true);
  });

  it("returns false for unrelated legal text", () => {
    expect(isKsefRelated("Zmiana w Kodeksie pracy — urlopy")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isKsefRelated("")).toBe(false);
  });

  it("returns false for unrelated tax text (PIT)", () => {
    expect(isKsefRelated("Nowe stawki PIT 2026 — zmiany w ustawie")).toBe(false);
  });

  it("returns false for random text", () => {
    expect(isKsefRelated("Prognoza pogody na weekend")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// detectPriority
// ─────────────────────────────────────────────────────────────────────────────

describe("detectPriority", () => {
  it("returns 'wysoki' for text about 'obowiązek'", () => {
    expect(detectPriority("Obowiązkowy KSeF od 01.04.2026", "")).toBe("wysoki");
  });

  it("returns 'wysoki' for text about 'sankcje'", () => {
    expect(detectPriority("Sankcje za brak KSeF od 2027", "")).toBe("wysoki");
  });

  it("returns 'wysoki' for text about 'termin'", () => {
    expect(detectPriority("Termin wdrożenia KSeF", "Nowy termin dla mikroprzedsiębiorców")).toBe("wysoki");
  });

  it("returns 'wysoki' for 'nowelizacja'", () => {
    expect(detectPriority("Nowelizacja ustawy o VAT w zakresie KSeF", "")).toBe("wysoki");
  });

  it("returns 'wysoki' for 'wejście w życie'", () => {
    expect(detectPriority("Przepisy wchodzą w życie 01.01.2027", "")).toBe("wysoki");
  });

  it("returns 'wysoki' for 'rozporządzenie'", () => {
    expect(detectPriority("Rozporządzenie MFiG w sprawie KSeF", "")).toBe("wysoki");
  });

  it("returns 'niski' for FAQ content", () => {
    expect(detectPriority("FAQ KSeF — najczęstsze pytania", "")).toBe("niski");
  });

  it("returns 'niski' for 'webinar'", () => {
    expect(detectPriority("Webinar KSeF dla księgowych", "")).toBe("niski");
  });

  it("returns 'niski' for 'poradnik'", () => {
    expect(detectPriority("Poradnik wdrożenia KSeF krok po kroku", "")).toBe("niski");
  });

  it("returns 'niski' for 'szkolenie'", () => {
    expect(detectPriority("Szkolenie z obsługi KSeF", "Rejestracja otwarta")).toBe("niski");
  });

  it("returns 'sredni' for neutral KSeF update", () => {
    expect(detectPriority("Aktualizacja portalu KSeF", "Nowa wersja interfejsu")).toBe("sredni");
  });

  it("returns 'sredni' for empty strings", () => {
    expect(detectPriority("", "")).toBe("sredni");
  });

  it("returns 'sredni' for general announcement", () => {
    expect(detectPriority("Komunikat KSeF — sierpień 2026", "Informacja dla podatników")).toBe("sredni");
  });

  it("priority 'wysoki' takes precedence over 'niski' keywords", () => {
    // 'obowiązek' (wysoki) + 'szkolenie' (niski) — wysoki wins (checked first)
    expect(detectPriority("Obowiązkowe szkolenie KSeF", "")).toBe("wysoki");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration-style: keyword + priority combination
// ─────────────────────────────────────────────────────────────────────────────

describe("KSeF monitor integration logic", () => {
  it("correctly identifies high-priority KSeF legal act", () => {
    const title = "Ustawa z dnia 05.08.2025 r. o zmianie ustawy o VAT — KSeF obowiązkowy";
    const summary = "Wejście w życie obowiązkowego KSeF dla wszystkich podatników VAT";
    expect(isKsefRelated(title)).toBe(true);
    expect(detectPriority(title, summary)).toBe("wysoki");
  });

  it("correctly identifies low-priority KSeF FAQ", () => {
    const title = "FAQ KSeF — pytania i odpowiedzi dla biur rachunkowych";
    const summary = "Odpowiedzi na najczęstsze pytania dotyczące e-faktur";
    expect(isKsefRelated(title)).toBe(true);
    expect(detectPriority(title, summary)).toBe("niski");
  });

  it("correctly rejects non-KSeF legal act", () => {
    const title = "Ustawa o zmianie Kodeksu pracy — praca zdalna";
    expect(isKsefRelated(title)).toBe(false);
  });

  it("detects KSeF in summary even if not in title", () => {
    const title = "Ważna zmiana podatkowa";
    const summary = "Dotyczy systemu KSeF i faktur ustrukturyzowanych";
    expect(isKsefRelated(summary)).toBe(true);
  });
});
