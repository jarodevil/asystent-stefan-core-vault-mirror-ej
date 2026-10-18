/**
 * RSS Fetcher - Pobieranie nowelizacji prawnych z oficjalnych źródeł
 *
 * Źródła:
 * 1. ISAP (Internetowy System Aktów Prawnych) - sejm.gov.pl
 * 2. Monitor Polski - monitorpolski.gov.pl
 * 3. Dziennik Ustaw - dziennikustaw.gov.pl
 *
 * Automatyczne odświeżanie co 24h
 * Cache w bazie danych (tabela legal_news)
 */

export interface LegalNews {
  id: string;
  title: string;
  date: string;
  source: string;
  excerpt: string;
  url: string;
  fullText?: string | null;
  category: "ustawa" | "rozporządzenie" | "orzeczenie" | "nowelizacja";
  createdAt: Date;
}

/** Keeps legal publication dates machine-readable and timezone-independent. */
export function toOfficialPublicationDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Główna funkcja pobierająca wszystkie nowelizacje z ELI API
 */
export async function fetchAllLegalNews(): Promise<LegalNews[]> {
  console.log("[RSS] Fetching legal news from ELI API...");

  try {
    // Importuj ELI API client
    const { getAllRecentActs } = await import("./eli-api-client.js");

    // Pobierz najnowsze akty z Dziennika Ustaw i Monitora Polskiego.
    // Brak wiarygodnego wyniku jest błędem — nigdy nie zastępujemy go przykładową treścią.
    // 50 pozycji z każdego dziennika daje bufor dla okresów z wieloma
    // publikacjami, bez sięgania po treści zewnętrzne lub przykładowe.
    const acts = await getAllRecentActs(50);

    if (acts.length === 0) {
      throw new Error("ELI API returned no official legal records");
    }

    // Konwertuj format ELI do LegalNews
    const news: LegalNews[] = acts.map(act => ({
      id: act.id,
      title: act.title,
      date: toOfficialPublicationDate(act.date),
      source: act.source,
      excerpt: act.excerpt,
      url: act.url,
      fullText: act.fullText,
      category:
        act.category.includes("VAT") ||
        act.category.includes("PIT") ||
        act.category.includes("CIT")
          ? "ustawa"
          : ("nowelizacja" as any),
      createdAt: act.createdAt,
    }));

    console.log(`[RSS] Fetched ${news.length} acts from ELI API`);
    return news;
  } catch (error: any) {
    console.error("[RSS] Failed to fetch official legal news:", error.message);
    throw error;
  }
}

/**
 * Sprawdza czy nowelizacje są aktualne (< 24h)
 */
export function isNewsCurrent(lastFetch: Date): boolean {
  const now = new Date();
  const diff = now.getTime() - lastFetch.getTime();
  const hours = diff / (1000 * 60 * 60);
  return hours < 24;
}

/**
 * Formatuje nowelizacje do system prompt
 */
export function formatNewsForPrompt(news: LegalNews[]): string {
  if (news.length === 0) {
    return "Brak najnowszych nowelizacji prawnych.";
  }

  const formatted = news
    .map((item, idx) => {
      return `${idx + 1}. **${item.title}** (${item.date}, ${item.source})
   ${item.excerpt}
   🔗 ${item.url}`;
    })
    .join("\n\n");

  return `## NAJNOWSZE NOWELIZACJE PRAWNE (ostatnie 24h):\n\n${formatted}\n\n⚠️ UWAGA: Przy odpowiadaniu na pytania dotyczące tych nowelizacji, ZAWSZE weryfikuj w systemie ISAP!`;
}
