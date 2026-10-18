/**
 * seasonal-banners.ts
 * Sezonowy system banerów świątecznych dla Systemu Stefan
 * Autor: Pasternak Jarek (Jaro'Devil)
 *
 * Algorytm Gaussa/Butchera do obliczania daty Wielkanocy (Niedziela Zmartwychwstania)
 * Wszystkie daty świąt polskich z automatycznym obliczaniem na bieżący rok.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type BannerVariant = "info" | "success" | "warning" | "festive" | "winter";

export interface SeasonalBanner {
  id: string;
  title: string;
  message: string;
  variant: BannerVariant;
  /** Funkcja zwracająca [startDate, endDate] dla danego roku */
  getRange: (year: number) => [Date, Date];
  /** Priorytet — wyższy = ważniejszy (wyświetlany gdy kilka aktywnych) */
  priority: number;
}

// ─── Algorytm Gaussa / Butchera — data Wielkanocy ────────────────────────────

/**
 * Oblicza datę Niedzieli Wielkanocnej dla danego roku.
 * Algorytm anonimowy (Gaussa/Butchera), dokładny dla lat 1900–2099.
 */
export function computeEaster(year: number): Date {
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
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=marzec, 4=kwiecień
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Dodaje dni do daty */
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Tworzy datę dla bieżącego roku */
function date(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

// ─── Konfiguracja Banerów ─────────────────────────────────────────────────────

export const SEASONAL_BANNERS: SeasonalBanner[] = [
  // ── Nowy Rok ──────────────────────────────────────────────────────────────
  {
    id: "new_year",
    title: "Szczęśliwego Nowego Roku!",
    message:
      "Stefan składa p. Agnieszce i całemu Zespołowi Kancelarii serdeczne życzenia pomyślności, zdrowia i sukcesów zawodowych w Nowym Roku. Niech każda sprawa kończy się wygraną!",
    variant: "festive",
    priority: 10,
    getRange: (y) => [date(y, 12, 31), date(y + 1, 1, 3)],
  },

  // ── Trzech Króli ──────────────────────────────────────────────────────────
  {
    id: "epiphany",
    title: "Święto Trzech Króli",
    message:
      "Stefan życzy p. Agnieszce i Zespołowi Kancelarii błogosławionego Święta Objawienia Pańskiego. Niech mądrość Trzech Króli towarzyszy w każdej sprawie sądowej!",
    variant: "info",
    priority: 5,
    getRange: (y) => [date(y, 1, 5), date(y, 1, 7)],
  },

  // ── Walentynki ────────────────────────────────────────────────────────────
  {
    id: "valentines",
    title: "Dzień Świętego Walentego 💙",
    message:
      "Stefan przesyła serdeczne pozdrowienia z okazji Dnia Zakochanych. Niech praca w kancelarii przynosi tyle satysfakcji, co miłość!",
    variant: "info",
    priority: 3,
    getRange: (y) => [date(y, 2, 13), date(y, 2, 15)],
  },

  // ── Tłusty Czwartek ───────────────────────────────────────────────────────
  {
    id: "fat_thursday",
    title: "Tłusty Czwartek!",
    message:
      "Stefan przypomina: dziś oficjalnie wolno zjeść pączka (lub kilka). Kodeks pracy nie przewiduje sankcji za nadmierną konsumpcję wyrobów cukierniczych w Tłusty Czwartek.",
    variant: "success",
    priority: 4,
    getRange: (y) => {
      // Tłusty Czwartek = 52 dni przed Wielkanocą (czwartek przed Środą Popielcową)
      const easter = computeEaster(y);
      const fatThursday = addDays(easter, -52);
      return [fatThursday, addDays(fatThursday, 1)];
    },
  },

  // ── Dzień Kobiet ──────────────────────────────────────────────────────────
  {
    id: "womens_day",
    title: "Dzień Kobiet",
    message:
      "Stefan składa p. Agnieszce i wszystkim Paniom z Kancelarii najserdeczniejsze życzenia z okazji Dnia Kobiet. Wasza praca, wiedza i zaangażowanie są fundamentem tej kancelarii!",
    variant: "festive",
    priority: 8,
    getRange: (y) => [date(y, 3, 7), date(y, 3, 9)],
  },

  // ── Środa Popielcowa ──────────────────────────────────────────────────────
  {
    id: "ash_wednesday",
    title: "Środa Popielcowa",
    message:
      "Rozpoczął się Wielki Post. Stefan życzy spokojnego i refleksyjnego czasu przygotowania do Świąt Wielkanocnych.",
    variant: "info",
    priority: 4,
    getRange: (y) => {
      const easter = computeEaster(y);
      const ashWed = addDays(easter, -46);
      return [ashWed, addDays(ashWed, 1)];
    },
  },

  // ── Wielkanoc ─────────────────────────────────────────────────────────────
  {
    id: "easter",
    title: "Wesołych Świąt Wielkanocnych!",
    message:
      "Stefan składa p. Agnieszce i całemu Zespołowi Kancelarii serdeczne życzenia zdrowych, spokojnych i radosnych Świąt Wielkanocnych. Niech ten czas przyniesie odpoczynek, refleksję i siłę do dalszej pracy.",
    variant: "success",
    priority: 10,
    getRange: (y) => {
      const easter = computeEaster(y);
      // Baner od Wielkiej Soboty (−1) do Wtorku Wielkanocnego (+2)
      return [addDays(easter, -1), addDays(easter, 3)];
    },
  },

  // ── Majówka ───────────────────────────────────────────────────────────────
  {
    id: "may_holidays",
    title: "Majówka — Święto Pracy i Konstytucji 3 Maja",
    message:
      "Stefan życzy udanej majówki! Konstytucja 3 Maja 1791 r. — pierwsza w Europie, druga na świecie. Niech pamięć o niej inspiruje do obrony praworządności na co dzień.",
    variant: "info",
    priority: 6,
    getRange: (y) => [date(y, 4, 30), date(y, 5, 4)],
  },

  // ── Boże Ciało ────────────────────────────────────────────────────────────
  {
    id: "corpus_christi",
    title: "Boże Ciało",
    message:
      "Stefan życzy błogosławionego Święta Bożego Ciała p. Agnieszce i całemu Zespołowi Kancelarii.",
    variant: "info",
    priority: 5,
    getRange: (y) => {
      const easter = computeEaster(y);
      const corpusChristi = addDays(easter, 60);
      return [corpusChristi, addDays(corpusChristi, 1)];
    },
  },

  // ── Dzień Dziecka ─────────────────────────────────────────────────────────
  {
    id: "childrens_day",
    title: "Dzień Dziecka",
    message:
      "Stefan przypomina: każdy dorosły był kiedyś dzieckiem. Niech 1 czerwca będzie dniem radości — dla dzieci klientów kancelarii i dla wszystkich, którzy zachowali w sobie odrobinę dziecięcej ciekawości świata.",
    variant: "info",
    priority: 3,
    getRange: (y) => [date(y, 5, 31), date(y, 6, 2)],
  },

  // ── Wakacje ───────────────────────────────────────────────────────────────
  {
    id: "summer",
    title: "Sezon Urlopowy",
    message:
      "Stefan życzy udanego wypoczynku urlopowego! Pamiętaj: zgodnie z art. 152 Kodeksu pracy pracownik ma prawo do nieprzerwanego urlopu wypoczynkowego. Kancelaria działa — Stefan czuwa.",
    variant: "info",
    priority: 2,
    getRange: (y) => [date(y, 7, 1), date(y, 8, 31)],
  },

  // ── Wniebowzięcie NMP / Wojsko Polskie ────────────────────────────────────
  {
    id: "assumption",
    title: "Wniebowzięcie NMP i Święto Wojska Polskiego",
    message:
      "Stefan składa życzenia z okazji 15 sierpnia — Wniebowzięcia Najświętszej Maryi Panny i Święta Wojska Polskiego, upamiętniającego Bitwę Warszawską 1920 r.",
    variant: "info",
    priority: 5,
    getRange: (y) => [date(y, 8, 14), date(y, 8, 16)],
  },

  // ── Dzień Edukacji Narodowej ──────────────────────────────────────────────
  {
    id: "education_day",
    title: "Dzień Edukacji Narodowej",
    message:
      "Stefan składa podziękowania wszystkim nauczycielom i prawnikom, którzy dzielą się wiedzą. Edukacja prawna to fundament świadomego społeczeństwa.",
    variant: "info",
    priority: 3,
    getRange: (y) => [date(y, 10, 13), date(y, 10, 15)],
  },

  // ── Wszystkich Świętych ───────────────────────────────────────────────────
  {
    id: "all_saints",
    title: "Uroczystość Wszystkich Świętych",
    message:
      "Stefan życzy spokojnego czasu refleksji i zadumy w Uroczystość Wszystkich Świętych. Niech pamięć o bliskich nam towarzyszą w codziennej pracy.",
    variant: "info",
    priority: 6,
    getRange: (y) => [date(y, 10, 31), date(y, 11, 2)],
  },

  // ── Dzień Niepodległości ──────────────────────────────────────────────────
  {
    id: "independence_day",
    title: "Święto Niepodległości — 11 Listopada",
    message:
      "Stefan składa hołd wszystkim, którzy walczyli o wolną Polskę. 11 listopada 1918 r. — 106 lat niepodległości. Praworządność i niezawisłość sądów to jej fundament.",
    variant: "festive",
    priority: 8,
    getRange: (y) => [date(y, 11, 10), date(y, 11, 12)],
  },

  // ── Adwent ────────────────────────────────────────────────────────────────
  {
    id: "advent",
    title: "Czas Adwentu",
    message:
      "Rozpoczął się Adwent — czas oczekiwania i przygotowania. Stefan życzy spokojnego i refleksyjnego czasu przed Świętami Bożego Narodzenia.",
    variant: "winter",
    priority: 3,
    getRange: (y) => {
      // Adwent zaczyna się w niedzielę 4 tygodnie przed Bożym Narodzeniem
      const christmas = date(y, 12, 25);
      const christmasDay = christmas.getDay(); // 0=niedziela
      const daysToSunday = christmasDay === 0 ? 28 : 21 + christmasDay;
      const adventStart = addDays(christmas, -daysToSunday);
      return [adventStart, date(y, 12, 24)];
    },
  },

  // ── Wigilia ───────────────────────────────────────────────────────────────
  {
    id: "christmas_eve",
    title: "Wesołych Świąt Bożego Narodzenia!",
    message:
      "Stefan składa p. Agnieszce i całemu Zespołowi Kancelarii najserdeczniejsze życzenia zdrowych, spokojnych i rodzinnych Świąt Bożego Narodzenia. Niech ten wyjątkowy czas przyniesie odpoczynek i radość.",
    variant: "winter",
    priority: 10,
    getRange: (y) => [date(y, 12, 24), date(y, 12, 27)],
  },

  // ── Sylwester ─────────────────────────────────────────────────────────────
  {
    id: "new_year_eve",
    title: "Szczęśliwego Nowego Roku!",
    message:
      "Stefan żegna stary rok i wita nowy! Dziękuje za zaufanie i wspólną pracę. Niech Nowy Rok przyniesie kancelarii same sukcesy, a każdej sprawie — sprawiedliwy wyrok.",
    variant: "festive",
    priority: 9,
    getRange: (y) => [date(y, 12, 30), date(y, 12, 31)],
  },
];

// ─── Główna Funkcja ───────────────────────────────────────────────────────────

/**
 * Zwraca aktywny baner dla podanej daty (domyślnie dzisiaj).
 * Jeśli kilka banerów jest aktywnych, zwraca ten z najwyższym priorytetem.
 */
export function getActiveBanner(now: Date = new Date()): SeasonalBanner | null {
  const year = now.getFullYear();

  const active = SEASONAL_BANNERS.filter((banner) => {
    // Sprawdź baner dla bieżącego roku
    const [start, end] = banner.getRange(year);
    if (now >= start && now <= end) return true;

    // Sprawdź baner z poprzedniego roku (np. Nowy Rok — zakres 31.12 → 03.01)
    const [startPrev, endPrev] = banner.getRange(year - 1);
    if (now >= startPrev && now <= endPrev) return true;

    return false;
  });

  if (active.length === 0) return null;

  // Zwróć baner z najwyższym priorytetem
  return active.reduce((best, curr) => (curr.priority > best.priority ? curr : best));
}

/**
 * Zwraca wszystkie aktywne banery posortowane malejąco według priorytetu.
 */
export function getAllActiveBanners(now: Date = new Date()): SeasonalBanner[] {
  const year = now.getFullYear();

  return SEASONAL_BANNERS.filter((banner) => {
    const [start, end] = banner.getRange(year);
    if (now >= start && now <= end) return true;
    const [startPrev, endPrev] = banner.getRange(year - 1);
    return now >= startPrev && now <= endPrev;
  }).sort((a, b) => b.priority - a.priority);
}

/**
 * Zwraca nadchodzące banery (w ciągu najbliższych `daysAhead` dni).
 * Przydatne do podglądu w panelu deweloperskim.
 */
export function getUpcomingBanners(daysAhead = 30, now: Date = new Date()): Array<{
  banner: SeasonalBanner;
  start: Date;
  end: Date;
  daysUntil: number;
}> {
  const year = now.getFullYear();
  const results: Array<{ banner: SeasonalBanner; start: Date; end: Date; daysUntil: number }> = [];

  for (const banner of SEASONAL_BANNERS) {
    for (const y of [year, year + 1]) {
      const [start, end] = banner.getRange(y);
      const daysUntil = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil > 0 && daysUntil <= daysAhead) {
        results.push({ banner, start, end, daysUntil });
      }
    }
  }

  return results.sort((a, b) => a.daysUntil - b.daysUntil);
}

// ─── Kolory wariantów ─────────────────────────────────────────────────────────

export const BANNER_VARIANT_STYLES: Record<BannerVariant, {
  container: string;
  icon: string;
  title: string;
  text: string;
  border: string;
}> = {
  info: {
    container: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-500",
    title: "text-blue-800 dark:text-blue-200",
    text: "text-blue-700 dark:text-blue-300",
  },
  success: {
    container: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-500",
    title: "text-green-800 dark:text-green-200",
    text: "text-green-700 dark:text-green-300",
  },
  warning: {
    container: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-500",
    title: "text-amber-800 dark:text-amber-200",
    text: "text-amber-700 dark:text-amber-300",
  },
  festive: {
    container: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800",
    icon: "text-purple-500",
    title: "text-purple-800 dark:text-purple-200",
    text: "text-purple-700 dark:text-purple-300",
  },
  winter: {
    container: "bg-sky-50 dark:bg-sky-950/30",
    border: "border-sky-200 dark:border-sky-800",
    icon: "text-sky-500",
    title: "text-sky-800 dark:text-sky-200",
    text: "text-sky-700 dark:text-sky-300",
  },
};

// ─── Ikony wariantów (emoji) ──────────────────────────────────────────────────

export const BANNER_VARIANT_ICONS: Record<BannerVariant, string> = {
  info:    "ℹ️",
  success: "🌸",
  warning: "⚠️",
  festive: "🎉",
  winter:  "❄️",
};
