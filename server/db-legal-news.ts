/**
 * Database helpers for legal news (RSS feed cache)
 */

import { getDb } from "./db";
import {
  legalNews,
  type LegalNews,
  type InsertLegalNews,
} from "../drizzle/schema";
import { desc, like, sql } from "drizzle-orm";

/**
 * Pobiera wszystkie nowelizacje z bazy danych
 */
export async function getAllLegalNews(): Promise<LegalNews[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(legalNews)
    .orderBy(desc(legalNews.createdAt))
    .limit(10);
}

/**
 * Pobiera najnowsze nowelizacje (< 24h)
 */
export async function getRecentLegalNews(): Promise<LegalNews[]> {
  const db = await getDb();
  if (!db) return [];

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  return db
    .select()
    .from(legalNews)
    .where(sql`${legalNews.createdAt} >= ${oneDayAgo}`)
    .orderBy(desc(legalNews.createdAt))
    .limit(10);
}

/**
 * Dodaje nowelizację do bazy danych
 */
export async function insertLegalNews(news: InsertLegalNews): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db
    .insert(legalNews)
    .values(news)
    .onDuplicateKeyUpdate({
      set: {
        title: news.title,
        date: news.date,
        source: news.source,
        excerpt: news.excerpt,
        url: news.url,
        fullText: news.fullText,
        category: news.category,
        updatedAt: new Date(),
      },
    });
}

/**
 * Dodaje wiele nowelizacji naraz
 */
export async function insertManyLegalNews(
  newsItems: InsertLegalNews[]
): Promise<void> {
  if (newsItems.length === 0) return;

  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db
    .insert(legalNews)
    .values(newsItems)
    .onDuplicateKeyUpdate({
      set: {
        title: sql`VALUES(${legalNews.title})`,
        date: sql`VALUES(${legalNews.date})`,
        source: sql`VALUES(${legalNews.source})`,
        excerpt: sql`VALUES(${legalNews.excerpt})`,
        url: sql`VALUES(${legalNews.url})`,
        fullText: sql`VALUES(${legalNews.fullText})`,
        category: sql`VALUES(${legalNews.category})`,
        updatedAt: new Date(),
      },
    });
}

/**
 * Usuwa stare nowelizacje (> 30 dni)
 */
export async function cleanOldLegalNews(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await db
    .delete(legalNews)
    .where(sql`${legalNews.createdAt} < ${thirtyDaysAgo}`);

  // Return 0 as we can't get rowsAffected from drizzle delete
  return 0;
}

/** Removes legacy placeholder rows only after official records were persisted. */
export async function removeLegacyFallbackNews(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .delete(legalNews)
    .where(like(legalNews.id, "fallback-%"));
  return Number(result[0]?.affectedRows ?? 0);
}

/**
 * Sprawdza czy baza danych ma świeże nowelizacje (< 24h)
 */
export async function hasRecentNews(): Promise<boolean> {
  const recent = await getRecentLegalNews();
  return recent.length > 0;
}
