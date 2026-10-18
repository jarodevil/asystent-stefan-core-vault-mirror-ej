/**
 * ELI API Client - Integracja z api.sejm.gov.pl
 * Pobiera najnowsze akty prawne z Dziennika Ustaw i Monitora Polskiego
 */

interface ELIAct {
  publisher: string; // "DU" lub "MP"
  year: number;
  pos: number;
  title: string;
  announcementDate: string;
  statusDate: string;
  ELI: string;
  text?: {
    html?: string;
    pdf?: string;
  };
}

interface ELIPublisher {
  code: string; // "DU" lub "MP"
  name: string;
  shortName: string;
  actsCount: number;
  years: number[];
}

const ELI_API_BASE = "https://api.sejm.gov.pl";

/**
 * Pobiera listę wydawców (Dziennik Ustaw, Monitor Polski)
 */
export async function getPublishers(): Promise<ELIPublisher[]> {
  try {
    const response = await fetch(`${ELI_API_BASE}/eli/acts/publishers`);
    if (!response.ok) {
      throw new Error(`ELI API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error("[ELI API] Failed to fetch publishers:", error.message);
    return [];
  }
}

/**
 * Pobiera najnowsze akty prawne z danego wydawcy
 * @param publisher - "DU" (Dziennik Ustaw) lub "MP" (Monitor Polski)
 * @param year - rok (domyślnie bieżący)
 * @param limit - maksymalna liczba aktów (domyślnie 20)
 */
export async function getRecentActs(
  publisher: "DU" | "MP",
  year?: number,
  limit: number = 20
): Promise<ELIAct[]> {
  try {
    const currentYear = year || new Date().getFullYear();
    const response = await fetch(
      `${ELI_API_BASE}/eli/acts/${publisher}/${currentYear}`
    );
    
    if (!response.ok) {
      throw new Error(`ELI API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // API zwraca {count: number, items: ELIAct[]}
    const acts: ELIAct[] = data.items || [];
    
    if (acts.length === 0) {
      console.warn(`[ELI API] No acts found for ${publisher}/${currentYear}`);
      return [];
    }
    
    console.log(`[ELI API] Fetched ${acts.length} acts from ${publisher}/${currentYear}`);
    
    // Sortuj po dacie ogłoszenia (najnowsze pierwsze)
    const sorted = acts.sort((a, b) => {
      const dateA = new Date(a.announcementDate).getTime();
      const dateB = new Date(b.announcementDate).getTime();
      return dateB - dateA;
    });
    
    // Zwróć tylko najnowsze akty
    return sorted.slice(0, limit);
  } catch (error: any) {
    console.error(`[ELI API] Failed to fetch acts from ${publisher}:`, error.message);
    return [];
  }
}

/**
 * Pobiera szczegóły aktu prawnego
 * @param eli - identyfikator ELI aktu
 */
export async function getActDetails(eli: string): Promise<ELIAct | null> {
  try {
    const response = await fetch(`${ELI_API_BASE}/eli/acts/${eli}`);
    
    if (!response.ok) {
      throw new Error(`ELI API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error(`[ELI API] Failed to fetch act details for ${eli}:`, error.message);
    return null;
  }
}

/**
 * Kategoryzuje akt prawny na podstawie tytułu
 */
export function categorizeAct(title: string): string {
  const titleLower = title.toLowerCase();
  
  // Podatki
  if (titleLower.includes("vat") || titleLower.includes("podatek od towarów i usług")) {
    return "VAT";
  }
  if (titleLower.includes("pit") || titleLower.includes("podatek dochodowy od osób fizycznych")) {
    return "PIT";
  }
  if (titleLower.includes("cit") || titleLower.includes("podatek dochodowy od osób prawnych")) {
    return "CIT";
  }
  if (titleLower.includes("ordynacja podatkowa")) {
    return "Ordynacja podatkowa";
  }
  
  // Prawo pracy i ubezpieczenia społeczne
  if (titleLower.includes("kodeks pracy") || titleLower.includes("prawo pracy")) {
    return "Prawo pracy";
  }
  if (titleLower.includes("zus") || titleLower.includes("ubezpiecze") || titleLower.includes("emerytur")) {
    return "Ubezpieczenia społeczne";
  }
  
  // Kodeksy
  if (titleLower.includes("kodeks cywilny")) {
    return "Prawo cywilne";
  }
  if (titleLower.includes("kodeks karny")) {
    return "Prawo karne";
  }
  if (titleLower.includes("kodeks postępowania cywilnego")) {
    return "Postępowanie cywilne";
  }
  if (titleLower.includes("kodeks postępowania karnego")) {
    return "Postępowanie karne";
  }
  if (titleLower.includes("kodeks postępowania administracyjnego")) {
    return "Postępowanie administracyjne";
  }
  
  // Prawo gospodarcze
  if (titleLower.includes("prawo bankowe") || titleLower.includes("bank")) {
    return "Prawo bankowe";
  }
  if (titleLower.includes("spółk") || titleLower.includes("handlow")) {
    return "Prawo handlowe";
  }
  if (titleLower.includes("rzemi")) {
    return "Rzemiosto";
  }
  if (titleLower.includes("energetyczne") || titleLower.includes("energia")) {
    return "Prawo energetyczne";
  }
  
  // Prawo administracyjne
  if (titleLower.includes("oświat") || titleLower.includes("edukacj")) {
    return "Prawo oświatowe";
  }
  if (titleLower.includes("zdrow") || titleLower.includes("lekarz") || titleLower.includes("pacjent")) {
    return "Prawo medyczne";
  }
  if (titleLower.includes("transport") || titleLower.includes("drog")) {
    return "Prawo transportowe";
  }
  if (titleLower.includes("mieszkan") || titleLower.includes("budowlan")) {
    return "Prawo budowlane";
  }
  
  // Prawo UE i międzynarodowe
  if (titleLower.includes("rodo") || titleLower.includes("ochrona danych osobowych")) {
    return "RODO";
  }
  if (titleLower.includes("konstytucja")) {
    return "Konstytucja";
  }
  if (titleLower.includes("ratyfikacj") || titleLower.includes("umów międzynarodow")) {
    return "Prawo międzynarodowe";
  }
  
  // Inne
  if (titleLower.includes("pomoc praw") || titleLower.includes("poradnictw")) {
    return "Pomoc prawna";
  }
  if (titleLower.includes("dostęp do informacji") || titleLower.includes("jawność")) {
    return "Dostęp do informacji publicznej";
  }
  
  return "Inne";
}

/**
 * Formatuje akt ELI do struktury legalNews
 */
export function formatELIActToLegalNews(act: ELIAct): {
  id: string;
  title: string;
  date: Date;
  source: string;
  excerpt: string;
  url: string;
  fullText: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
} {
  const sourceMap: Record<string, string> = {
    DU: "Dziennik Ustaw",
    MP: "Monitor Polski",
  };
  
  // Formatuj excerpt z displayAddress i typem aktu
  const displayAddress = (act as any).displayAddress || `${act.publisher} ${act.year} poz. ${act.pos}`;
  const actType = (act as any).type || "Akt prawny";
  const excerpt = `${actType}: ${act.title.substring(0, 150)}${act.title.length > 150 ? "..." : ""} (${displayAddress})`;
  
  // Link do PDF jeśli dostępny
  const pdfAvailable = (act as any).textPDF === true;
  const url = pdfAvailable 
    ? `https://isap.sejm.gov.pl/isap.nsf/download.xsp/WDU${act.year}${String(act.pos).padStart(7, "0")}/O/D${act.year}${String(act.pos).padStart(4, "0")}.pdf`
    : `https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=${act.ELI}`;
  
  return {
    id: act.ELI,
    title: act.title,
    date: new Date(act.announcementDate),
    source: sourceMap[act.publisher] || act.publisher,
    excerpt,
    url,
    fullText: act.title, // Pełny tekst wymaga dodatkowego zapytania
    category: categorizeAct(act.title),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Pobiera najnowsze akty z Dziennika Ustaw i Monitora Polskiego
 * @param limit - maksymalna liczba aktów z każdego źródła
 */
export async function getAllRecentActs(limit: number = 10): Promise<ReturnType<typeof formatELIActToLegalNews>[]> {
  try {
    console.log("[ELI API] Fetching recent acts from Dziennik Ustaw and Monitor Polski...");
    
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;
    
    // Pobierz akty z bieżącego roku i poprzedniego (dla pokrycia ostatnich 90 dni)
    const [duCurrent, mpCurrent, duPrev, mpPrev] = await Promise.all([
      getRecentActs("DU", currentYear, limit * 3),
      getRecentActs("MP", currentYear, limit * 3),
      getRecentActs("DU", prevYear, limit * 2),
      getRecentActs("MP", prevYear, limit * 2),
    ]);
    
    console.log(`[ELI API] Fetched ${duCurrent.length + duPrev.length} acts from Dziennik Ustaw (${currentYear}+${prevYear})`);
    console.log(`[ELI API] Fetched ${mpCurrent.length + mpPrev.length} acts from Monitor Polski (${currentYear}+${prevYear})`);
    
    // Połącz, sformatuj i filtruj do ostatnich 90 dni
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    
    const allActs = [...duCurrent, ...mpCurrent, ...duPrev, ...mpPrev];
    const formatted = allActs
      .map(formatELIActToLegalNews)
      .filter(act => act.date >= cutoff);
    
    // Sortuj po dacie (najnowsze pierwsze)
    formatted.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    console.log(`[ELI API] Acts within last 90 days: ${formatted.length}`);
    return formatted;
  } catch (error: any) {
    console.error("[ELI API] Failed to fetch all recent acts:", error.message);
    return [];
  }
}

/**
 * Pobiera akty prawne z określonego zakresu dat (dla seedera historycznego)
 */
export async function getActsInDateRange(
  publisher: "DU" | "MP",
  fromDate: Date,
  toDate: Date
): Promise<ReturnType<typeof formatELIActToLegalNews>[]> {
  try {
    const y = fromDate.getFullYear();
    const yEnd = toDate.getFullYear();
    const years: number[] = [];
    for (let yr = y; yr <= yEnd; yr++) years.push(yr);
    
    const allActs: ELIAct[] = [];
    for (const year of years) {
      const acts = await getRecentActs(publisher, year, 2000);
      allActs.push(...acts);
    }
    
    return allActs
      .map(formatELIActToLegalNews)
      .filter(act => act.date >= fromDate && act.date <= toDate)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error: any) {
    console.error(`[ELI API] getActsInDateRange failed:`, error.message);
    return [];
  }
}
