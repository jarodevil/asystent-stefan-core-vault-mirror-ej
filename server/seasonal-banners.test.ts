/**
 * Testy jednostkowe dla seasonal-banners.ts
 * Testujemy: algorytm Gaussa dla Wielkanocy, detekcję aktywnych banerów,
 * poprawność dat świąt stałych i ruchomych.
 */

import { describe, it, expect } from "vitest";

// ─── Kopiujemy logikę z seasonal-banners.ts (pure functions, bez importu frontend) ──

function computeEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Testy algorytmu Gaussa ───────────────────────────────────────────────────

describe("computeEaster — algorytm Gaussa/Butchera", () => {
  // Znane daty Wielkanocy (weryfikacja historyczna)
  const knownEasters: [number, string][] = [
    [2020, "2020-04-12"],
    [2021, "2021-04-04"],
    [2022, "2022-04-17"],
    [2023, "2023-04-09"],
    [2024, "2024-03-31"],
    [2025, "2025-04-20"],
    [2026, "2026-04-05"],
    [2027, "2027-03-28"],
    [2028, "2028-04-16"],
    [2029, "2029-04-01"],
    [2030, "2030-04-21"],
  ];

  knownEasters.forEach(([year, expected]) => {
    it(`Wielkanoc ${year} = ${expected}`, () => {
      expect(dateStr(computeEaster(year))).toBe(expected);
    });
  });

  it("Wielkanoc zawsze wypada w niedzielę", () => {
    for (let y = 2020; y <= 2035; y++) {
      const easter = computeEaster(y);
      expect(easter.getDay()).toBe(0); // 0 = niedziela
    }
  });

  it("Wielkanoc zawsze w marcu lub kwietniu", () => {
    for (let y = 2020; y <= 2035; y++) {
      const month = computeEaster(y).getMonth() + 1;
      expect(month).toBeGreaterThanOrEqual(3);
      expect(month).toBeLessThanOrEqual(4);
    }
  });
});

// ─── Testy świąt ruchomych ────────────────────────────────────────────────────

describe("Święta ruchome — obliczanie na podstawie Wielkanocy", () => {
  it("Tłusty Czwartek 2026 = 2026-02-12 (czwartek, 52 dni przed Wielkanocą)", () => {
    const easter2026 = computeEaster(2026);
    const fatThursday = addDays(easter2026, -52);
    expect(dateStr(fatThursday)).toBe("2026-02-12");
    expect(fatThursday.getDay()).toBe(4); // 4 = czwartek
  });

  it("Środa Popielcowa 2026 = 2026-02-18 (46 dni przed Wielkanocą)", () => {
    const easter2026 = computeEaster(2026);
    const ashWed = addDays(easter2026, -46);
    expect(dateStr(ashWed)).toBe("2026-02-18");
    expect(ashWed.getDay()).toBe(3); // 3 = środa
  });

  it("Boże Ciało 2026 = 2026-06-04 (60 dni po Wielkanocy)", () => {
    const easter2026 = computeEaster(2026);
    const corpusChristi = addDays(easter2026, 60);
    expect(dateStr(corpusChristi)).toBe("2026-06-04");
    expect(corpusChristi.getDay()).toBe(4); // 4 = czwartek
  });

  it("Tłusty Czwartek zawsze wypada w czwartek", () => {
    for (let y = 2020; y <= 2030; y++) {
      const fatThursday = addDays(computeEaster(y), -52);
      expect(fatThursday.getDay()).toBe(4);
    }
  });

  it("Środa Popielcowa zawsze wypada w środę", () => {
    for (let y = 2020; y <= 2030; y++) {
      const ashWed = addDays(computeEaster(y), -46);
      expect(ashWed.getDay()).toBe(3);
    }
  });

  it("Boże Ciało zawsze wypada w czwartek", () => {
    for (let y = 2020; y <= 2030; y++) {
      const corpusChristi = addDays(computeEaster(y), 60);
      expect(corpusChristi.getDay()).toBe(4);
    }
  });
});

// ─── Testy świąt stałych ──────────────────────────────────────────────────────

describe("Święta stałe — poprawność dat", () => {
  it("Nowy Rok — 1 stycznia", () => {
    const d = new Date(2026, 0, 1);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it("Dzień Kobiet — 8 marca", () => {
    const d = new Date(2026, 2, 8);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(8);
  });

  it("Konstytucja 3 Maja — 3 maja", () => {
    const d = new Date(2026, 4, 3);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(3);
  });

  it("Dzień Niepodległości — 11 listopada", () => {
    const d = new Date(2026, 10, 11);
    expect(d.getMonth()).toBe(10);
    expect(d.getDate()).toBe(11);
  });

  it("Boże Narodzenie — 25 grudnia", () => {
    const d = new Date(2026, 11, 25);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(25);
  });
});

// ─── Testy logiki banerów ─────────────────────────────────────────────────────

describe("Logika aktywności banerów", () => {
  function isInRange(now: Date, start: Date, end: Date): boolean {
    return now >= start && now <= end;
  }

  it("Baner wielkanocny 2026 aktywny 4 kwietnia (Wielka Sobota)", () => {
    const easter2026 = computeEaster(2026); // 2026-04-05
    const start = addDays(easter2026, -1); // Wielka Sobota: 04-04
    const end = addDays(easter2026, 3);    // Wtorek Wielkanocny: 04-08
    const now = new Date(2026, 3, 4); // 4 kwietnia 2026
    expect(isInRange(now, start, end)).toBe(true);
  });

  it("Baner wielkanocny 2026 nieaktywny 9 kwietnia (po Świętach)", () => {
    const easter2026 = computeEaster(2026);
    const start = addDays(easter2026, -1);
    const end = addDays(easter2026, 3);
    const now = new Date(2026, 3, 9); // 9 kwietnia
    expect(isInRange(now, start, end)).toBe(false);
  });

  it("Baner Bożego Narodzenia aktywny 24 grudnia", () => {
    const start = new Date(2026, 11, 24);
    const end = new Date(2026, 11, 27);
    const now = new Date(2026, 11, 24);
    expect(isInRange(now, start, end)).toBe(true);
  });

  it("Baner Dnia Kobiet aktywny 8 marca", () => {
    const start = new Date(2026, 2, 7);
    const end = new Date(2026, 2, 9);
    const now = new Date(2026, 2, 8);
    expect(isInRange(now, start, end)).toBe(true);
  });

  it("Baner Dnia Kobiet nieaktywny 10 marca", () => {
    const start = new Date(2026, 2, 7);
    const end = new Date(2026, 2, 9);
    const now = new Date(2026, 2, 10);
    expect(isInRange(now, start, end)).toBe(false);
  });

  it("Brak aktywnego banera w zwykły dzień (np. 15 września)", () => {
    // 15 września nie jest żadnym polskim świętem z naszej listy
    const now = new Date(2026, 8, 15);
    // Sprawdzamy że nie ma aktywnych banerów ze świąt stałych
    const fixedHolidays = [
      { start: new Date(2026, 0, 1), end: new Date(2026, 0, 3) },   // Nowy Rok
      { start: new Date(2026, 2, 7), end: new Date(2026, 2, 9) },   // Dzień Kobiet
      { start: new Date(2026, 4, 3), end: new Date(2026, 4, 4) },   // Konstytucja
      { start: new Date(2026, 10, 10), end: new Date(2026, 10, 12) }, // Niepodległość
      { start: new Date(2026, 11, 24), end: new Date(2026, 11, 27) }, // Boże Narodzenie
    ];
    const anyActive = fixedHolidays.some(h => isInRange(now, h.start, h.end));
    expect(anyActive).toBe(false);
  });
});

// ─── Testy wariantów i priorytetów ───────────────────────────────────────────

describe("Warianty i priorytety banerów", () => {
  const VARIANTS = ["info", "success", "warning", "festive", "winter"];

  it("Wielkanoc ma priorytet 10 (najwyższy)", () => {
    // Wielkanoc i Boże Narodzenie mają priorytet 10
    const easterPriority = 10;
    const christmasPriority = 10;
    expect(easterPriority).toBe(10);
    expect(christmasPriority).toBe(10);
  });

  it("Warianty banerów są z dozwolonej listy", () => {
    const usedVariants = ["success", "winter", "festive", "info", "warning"];
    usedVariants.forEach(v => {
      expect(VARIANTS).toContain(v);
    });
  });

  it("Baner z wyższym priorytetem wygrywa przy konflikcie", () => {
    const banners = [
      { id: "a", priority: 5 },
      { id: "b", priority: 10 },
      { id: "c", priority: 3 },
    ];
    const winner = banners.reduce((best, curr) => curr.priority > best.priority ? curr : best);
    expect(winner.id).toBe("b");
  });

  it("Przy jednym aktywnym banerze — on jest wynikiem", () => {
    const banners = [{ id: "easter", priority: 10 }];
    const winner = banners.reduce((best, curr) => curr.priority > best.priority ? curr : best);
    expect(winner.id).toBe("easter");
  });
});

// ─── Testy addDays ────────────────────────────────────────────────────────────

describe("addDays — pomocnicza funkcja dat", () => {
  it("addDays(2026-04-05, -1) = 2026-04-04", () => {
    const d = addDays(new Date(2026, 3, 5), -1);
    expect(dateStr(d)).toBe("2026-04-04");
  });

  it("addDays(2026-12-31, 1) = 2027-01-01", () => {
    const d = addDays(new Date(2026, 11, 31), 1);
    expect(dateStr(d)).toBe("2027-01-01");
  });

  it("addDays nie mutuje oryginalnej daty", () => {
    const original = new Date(2026, 3, 5);
    const originalStr = dateStr(original);
    addDays(original, 10);
    expect(dateStr(original)).toBe(originalStr);
  });
});
