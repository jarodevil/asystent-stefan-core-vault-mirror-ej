import type { InsertLegalNews } from "../../drizzle/schema";
import {
  cleanOldLegalNews,
  insertManyLegalNews,
  removeLegacyFallbackNews,
} from "../db-legal-news";
import { fetchAllLegalNews } from "./rss-fetcher";
import { markSeederRun, shouldRunSeeder } from "./system-cache";

export type LegalNewsRefreshResult = {
  executed: boolean;
  reason: string;
  count: number;
  cleanedCount: number;
  removedFallbackCount: number;
};

function toInsertValues(
  news: Awaited<ReturnType<typeof fetchAllLegalNews>>
): InsertLegalNews[] {
  return news.map(item => ({
    id: item.id,
    title: item.title,
    date: item.date,
    source: item.source,
    excerpt: item.excerpt,
    url: item.url,
    fullText: item.fullText,
    category: item.category,
    createdAt: item.createdAt,
    updatedAt: new Date(),
  }));
}

/**
 * Refreshes legal news from official sources only. The freshness marker is
 * advanced only after a non-empty, successfully persisted official response.
 */
export async function refreshLegalNews(
  options: { force?: boolean } = {}
): Promise<LegalNewsRefreshResult> {
  if (!options.force) {
    const freshness = await shouldRunSeeder("rss_refresh_last_run", 24);
    if (!freshness.shouldRun) {
      return {
        executed: false,
        reason: freshness.reason,
        count: 0,
        cleanedCount: 0,
        removedFallbackCount: 0,
      };
    }
  }

  const news = await fetchAllLegalNews();
  if (news.length === 0) {
    throw new Error(
      "Official legal source returned no records; freshness was not advanced."
    );
  }

  await insertManyLegalNews(toInsertValues(news));
  const removedFallbackCount = await removeLegacyFallbackNews();
  const cleanedCount = await cleanOldLegalNews();
  await markSeederRun("rss_refresh_last_run", { count: news.length });

  return {
    executed: true,
    reason: `Pobrano ${news.length} pozycji z oficjalnych źródeł.`,
    count: news.length,
    cleanedCount,
    removedFallbackCount,
  };
}
