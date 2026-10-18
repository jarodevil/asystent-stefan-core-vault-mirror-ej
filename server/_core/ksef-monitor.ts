/**
 * KSeF Monitor — Monitoring zmian w przepisach KSeF
 *
 * Źródła (wyłącznie oficjalne, rządowe):
 * 1. ksef.podatki.gov.pl/aktualnosci — aktualności portalu KSeF (scraping HTTP)
 * 2. ELI API (api.sejm.gov.pl) — akty prawne z Dziennika Ustaw filtrowane po KSeF/e-Faktur
 * 3. gov.pl/finanse — komunikaty MF dotyczące KSeF (scraping HTTP)
 *
 * Zasada: ZERO nieoficjalnych źródeł (blogi, portale branżowe).
 * Każdy alert musi mieć URL do oficjalnego dokumentu.
 */

import axios from "axios";
import * as cheerio from "cheerio";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheerioElement = any;
import crypto from "crypto";
import { getDb } from "../db";
import { ksefAlerts, type InsertKsefAlert } from "../../drizzle/schema";
import { notifyOwner } from "./notification";
import { desc, eq, and, sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface KsefAlertItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  alertType: "przepis" | "aktualnosc" | "interpretacja" | "komunikat" | "orzeczenie";
  priority: "wysoki" | "sredni" | "niski";
  publishedAt: Date;
  legalBasis?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// KSeF keyword detection
// ─────────────────────────────────────────────────────────────────────────────

const KSEF_KEYWORDS = [
  "ksef", "k-sef", "krajowy system e-faktur", "e-faktura", "e-faktury",
  "e-faktur", "efaktura", "efaktury", "faktura ustrukturyzowana", "faktury ustrukturyzowane",
  "106na", "106nb", "106nc", "106nd", "106ne", "106nf", "106ng", "106nh",
  "106ni", "zaw-fa", "zaw fa", "tryb offline", "offline24", "tryb awaryjny",
  "numer ksef", "identyfikator ksef",
];

export function isKsefRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return KSEF_KEYWORDS.some((kw) => lower.includes(kw));
}

export function detectPriority(title: string, summary: string): "wysoki" | "sredni" | "niski" {
  const text = (title + " " + summary).toLowerCase();
  // Wysoki: zmiany w terminach, sankcjach, nowe obowiązki
  if (
    text.includes("obowiązkow") ||
    text.includes("sankcj") ||
    text.includes("kara") ||
    text.includes("termin") ||
    text.includes("wejście w życie") ||
    text.includes("wchodzi w życie") ||
    text.includes("wchodzą w życie") ||
    text.includes("nowelizacja") ||
    text.includes("zmiana ustawy") ||
    text.includes("rozporządzenie")
  ) {
    return "wysoki";
  }
  // Niski: komunikaty techniczne, FAQ, poradniki
  if (
    text.includes("faq") ||
    text.includes("poradnik") ||
    text.includes("pytania i odpowiedzi") ||
    text.includes("webinar") ||
    text.includes("szkolenie")
  ) {
    return "niski";
  }
  return "sredni";
}

function generateId(source: string, title: string, date: Date): string {
  const hash = crypto
    .createHash("sha256")
    .update(`${source}::${title}::${date.toISOString().slice(0, 10)}`)
    .digest("hex")
    .slice(0, 16);
  return `ksef-${hash}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Source 1: ksef.podatki.gov.pl/aktualnosci (HTTP scraping)
// ─────────────────────────────────────────────────────────────────────────────

export async function scrapeKsefPortalNews(): Promise<KsefAlertItem[]> {
  const SOURCE = "ksef.podatki.gov.pl";
  const BASE_URL = "https://ksef.podatki.gov.pl";
  const NEWS_URL = `${BASE_URL}/aktualnosci/`;

  try {
    console.log("[KSeF Monitor] Scraping ksef.podatki.gov.pl/aktualnosci...");
    const response = await axios.get(NEWS_URL, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; StefanLegalBot/1.0; +https://kancelaria-mefa9ha9.manus.space)",
        "Accept-Language": "pl-PL,pl;q=0.9",
      },
    });

    const $ = cheerio.load(response.data);
    const items: KsefAlertItem[] = [];

    // Typowa struktura portalu gov.pl — artykuły w .article-list lub .news-list
    const selectors = [
      ".article-list .article-item",
      ".news-list .news-item",
      "article.news",
      ".content-list li",
      ".views-row",
      "article",
    ];

    let found = false;
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((_: number, el: CheerioElement) => { // eslint-disable-line
          const titleEl = $(el).find("h2, h3, .title, .article-title, a").first();
          const title = titleEl.text().trim();
          if (!title || title.length < 10) return;

          const linkEl = $(el).find("a").first();
          const href = linkEl.attr("href") || "";
          const url = href.startsWith("http") ? href : `${BASE_URL}${href}`;

          const summaryEl = $(el).find("p, .summary, .lead, .description").first();
          const summary = summaryEl.text().trim() || title;

          const dateEl = $(el).find("time, .date, .published").first();
          const dateStr = dateEl.attr("datetime") || dateEl.text().trim();
          const publishedAt = dateStr ? new Date(dateStr) : new Date();
          const validDate = isNaN(publishedAt.getTime()) ? new Date() : publishedAt;

          const id = generateId(SOURCE, title, validDate);
          const priority = detectPriority(title, summary);

          items.push({
            id,
            title,
            summary: summary.slice(0, 500),
            url,
            source: SOURCE,
            alertType: "aktualnosc",
            priority,
            publishedAt: validDate,
          });
        });
        if (items.length > 0) {
          found = true;
          break;
        }
      }
    }

    if (!found || items.length === 0) {
      // Fallback: pobierz wszystkie linki z treści strony
      $('a[href]').each((_idx: number, el: CheerioElement) => {
        const href = $(el).attr("href") || "";
        const title = $(el).text().trim();
        if (
          title.length > 20 &&
          (href.includes("/aktualnosci/") || href.includes("/news/") || href.includes("/komunikat/")) &&
          isKsefRelated(title)
        ) {
          const url = href.startsWith("http") ? href : `${BASE_URL}${href}`;
          const id = generateId(SOURCE, title, new Date());
          items.push({
            id,
            title,
            summary: title,
            url,
            source: SOURCE,
            alertType: "aktualnosc",
            priority: detectPriority(title, ""),
            publishedAt: new Date(),
          });
        }
      });
    }

    console.log(`[KSeF Monitor] Scraped ${items.length} items from ksef.podatki.gov.pl`);
    return items.slice(0, 20);
  } catch (error: any) {
    console.error("[KSeF Monitor] Failed to scrape ksef.podatki.gov.pl:", error.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Source 2: ELI API — filtrowanie aktów KSeF z Dziennika Ustaw
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchKsefActsFromELI(): Promise<KsefAlertItem[]> {
  const SOURCE = "isap.sejm.gov.pl";

  try {
    console.log("[KSeF Monitor] Fetching KSeF-related acts from ELI API...");
    const { getAllRecentActs } = await import("./eli-api-client.js");
    const acts = await getAllRecentActs(50); // pobierz więcej, żeby przefiltrować

    const ksefActs = acts.filter(
      (act) => isKsefRelated(act.title) || isKsefRelated(act.excerpt)
    );

    const items: KsefAlertItem[] = ksefActs.map((act) => {
      const id = generateId(SOURCE, act.title, act.date);
      const priority = detectPriority(act.title, act.excerpt);
      const alertType: KsefAlertItem["alertType"] =
        act.title.toLowerCase().includes("rozporządzenie") ? "przepis" :
        act.title.toLowerCase().includes("ustawa") ? "przepis" :
        act.title.toLowerCase().includes("interpretacja") ? "interpretacja" :
        "przepis";

      return {
        id,
        title: act.title,
        summary: act.excerpt.slice(0, 500),
        url: act.url,
        source: SOURCE,
        alertType,
        priority,
        publishedAt: act.date,
        legalBasis: act.excerpt.includes("Dz. U.") ? act.excerpt.slice(0, 100) : undefined,
      };
    });

    console.log(`[KSeF Monitor] Found ${items.length} KSeF-related acts in ELI API`);
    return items;
  } catch (error: any) {
    console.error("[KSeF Monitor] Failed to fetch from ELI API:", error.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Source 3: gov.pl/finanse — komunikaty MF o KSeF
// ─────────────────────────────────────────────────────────────────────────────

export async function scrapeGovFinanseKsef(): Promise<KsefAlertItem[]> {
  const SOURCE = "gov.pl/finanse";
  const SEARCH_URL = "https://www.gov.pl/web/finanse/ksef";

  try {
    console.log("[KSeF Monitor] Scraping gov.pl/finanse/ksef...");
    const response = await axios.get(SEARCH_URL, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; StefanLegalBot/1.0)",
        "Accept-Language": "pl-PL,pl;q=0.9",
      },
    });

    const $ = cheerio.load(response.data);
    const items: KsefAlertItem[] = [];

    // gov.pl używa struktury .article-list lub .news-list
    $('article, .article-list-item, .news-item, .content-item').each((_idx: number, el: CheerioElement) => {
      const titleEl = $(el).find("h2, h3, .title, a").first();
      const title = titleEl.text().trim();
      if (!title || title.length < 10) return;

      const linkEl = $(el).find("a").first();
      const href = linkEl.attr("href") || "";
      const url = href.startsWith("http") ? href : `https://www.gov.pl${href}`;

      const summaryEl = $(el).find("p, .summary, .lead").first();
      const summary = summaryEl.text().trim() || title;

      const dateEl = $(el).find("time, .date, .published").first();
      const dateStr = dateEl.attr("datetime") || dateEl.text().trim();
      const publishedAt = dateStr ? new Date(dateStr) : new Date();
      const validDate = isNaN(publishedAt.getTime()) ? new Date() : publishedAt;

      if (!isKsefRelated(title) && !isKsefRelated(summary)) return;

      const id = generateId(SOURCE, title, validDate);
      items.push({
        id,
        title,
        summary: summary.slice(0, 500),
        url,
        source: SOURCE,
        alertType: "komunikat",
        priority: detectPriority(title, summary),
        publishedAt: validDate,
      });
    });

    console.log(`[KSeF Monitor] Scraped ${items.length} items from gov.pl/finanse`);
    return items.slice(0, 15);
  } catch (error: any) {
    console.error("[KSeF Monitor] Failed to scrape gov.pl/finanse:", error.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Database helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function saveKsefAlerts(items: KsefAlertItem[]): Promise<{ saved: number; newItems: number }> {
  if (items.length === 0) return { saved: 0, newItems: 0 };

  const db = await getDb();
  if (!db) return { saved: 0, newItems: 0 };

  let newItems = 0;

  for (const item of items) {
    try {
      // Sprawdź czy alert już istnieje
      const existing = await db
        .select({ id: ksefAlerts.id })
        .from(ksefAlerts)
        .where(eq(ksefAlerts.id, item.id))
        .limit(1);

      if (existing.length === 0) {
        // Nowy alert — zapisz i oznacz jako nowy
        const insertData: InsertKsefAlert = {
          id: item.id,
          title: item.title,
          summary: item.summary,
          url: item.url,
          source: item.source,
          alertType: item.alertType,
          priority: item.priority,
          publishedAt: item.publishedAt,
          isNew: true,
          isRead: false,
          notified: false,
          legalBasis: item.legalBasis || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db.insert(ksefAlerts).values(insertData);
        newItems++;
      }
    } catch (error: any) {
      console.error(`[KSeF Monitor] Failed to save alert ${item.id}:`, error.message);
    }
  }

  return { saved: items.length, newItems };
}

export async function getKsefAlerts(options: {
  limit?: number;
  onlyNew?: boolean;
  onlyUnread?: boolean;
  source?: string;
  priority?: "wysoki" | "sredni" | "niski";
} = {}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(ksefAlerts);

  const conditions = [];
  if (options.onlyNew) conditions.push(eq(ksefAlerts.isNew, true));
  if (options.onlyUnread) conditions.push(eq(ksefAlerts.isRead, false));
  if (options.source) conditions.push(eq(ksefAlerts.source, options.source));
  if (options.priority) conditions.push(eq(ksefAlerts.priority, options.priority));

  const result = await (conditions.length > 0
    ? db.select().from(ksefAlerts).where(and(...conditions)).orderBy(desc(ksefAlerts.publishedAt)).limit(options.limit ?? 50)
    : db.select().from(ksefAlerts).orderBy(desc(ksefAlerts.publishedAt)).limit(options.limit ?? 50)
  );

  return result;
}

export async function markKsefAlertRead(id: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(ksefAlerts).set({ isRead: true, isNew: false, updatedAt: new Date() }).where(eq(ksefAlerts.id, id));
}

export async function markAllKsefAlertsRead(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(ksefAlerts).set({ isRead: true, isNew: false, updatedAt: new Date() });
}

export async function getKsefAlertStats() {
  const db = await getDb();
  if (!db) return { total: 0, unread: 0, newToday: 0, highPriority: 0 };

  const [total, unread, highPriority] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(ksefAlerts),
    db.select({ count: sql<number>`count(*)` }).from(ksefAlerts).where(eq(ksefAlerts.isRead, false)),
    db.select({ count: sql<number>`count(*)` }).from(ksefAlerts).where(and(eq(ksefAlerts.priority, "wysoki"), eq(ksefAlerts.isRead, false))),
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const newToday = await db
    .select({ count: sql<number>`count(*)` })
    .from(ksefAlerts)
    .where(sql`${ksefAlerts.createdAt} >= ${todayStart}`);

  return {
    total: Number(total[0]?.count ?? 0),
    unread: Number(unread[0]?.count ?? 0),
    newToday: Number(newToday[0]?.count ?? 0),
    highPriority: Number(highPriority[0]?.count ?? 0),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main refresh function — pobiera ze wszystkich źródeł i wysyła powiadomienia
// ─────────────────────────────────────────────────────────────────────────────

export async function refreshKsefAlerts(): Promise<{
  success: boolean;
  totalFetched: number;
  newAlerts: number;
  notificationSent: boolean;
}> {
  console.log("[KSeF Monitor] Starting KSeF alerts refresh...");
  const startTime = Date.now();

  try {
    // Pobierz ze wszystkich źródeł równolegle
    const [portalItems, eliItems, govItems] = await Promise.allSettled([
      scrapeKsefPortalNews(),
      fetchKsefActsFromELI(),
      scrapeGovFinanseKsef(),
    ]);

    const allItems: KsefAlertItem[] = [
      ...(portalItems.status === "fulfilled" ? portalItems.value : []),
      ...(eliItems.status === "fulfilled" ? eliItems.value : []),
      ...(govItems.status === "fulfilled" ? govItems.value : []),
    ];

    // Deduplikacja po ID
    const unique = new Map<string, KsefAlertItem>();
    for (const item of allItems) {
      if (!unique.has(item.id)) unique.set(item.id, item);
    }
    const deduped = Array.from(unique.values());

    console.log(`[KSeF Monitor] Total unique items: ${deduped.length}`);

    // Zapisz do bazy
    const { newItems: newAlerts } = await saveKsefAlerts(deduped);

    // Wyślij powiadomienie do właściciela jeśli są nowe alerty
    let notificationSent = false;
    if (newAlerts > 0) {
      const highPriorityNew = deduped
        .filter((i) => i.priority === "wysoki")
        .slice(0, 3)
        .map((i) => `• ${i.title} (${i.source})`)
        .join("\n");

      const content = `Wykryto ${newAlerts} nowych zmian w przepisach KSeF.\n\n` +
        (highPriorityNew ? `Wysoki priorytet:\n${highPriorityNew}\n\n` : "") +
        `Sprawdź panel alertów KSeF w Stefanie: /ksef → zakładka Alerty`;

      notificationSent = await notifyOwner({
        title: `🔔 KSeF Alert: ${newAlerts} nowych zmian w przepisach`,
        content,
      });

      // Oznacz jako notified
      const db = await getDb();
      if (db) {
        await db
          .update(ksefAlerts)
          .set({ notified: true, updatedAt: new Date() })
          .where(and(eq(ksefAlerts.isNew, true), eq(ksefAlerts.notified, false)));
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[KSeF Monitor] Refresh completed in ${duration}ms. New alerts: ${newAlerts}`);

    return {
      success: true,
      totalFetched: deduped.length,
      newAlerts,
      notificationSent,
    };
  } catch (error: any) {
    console.error("[KSeF Monitor] Refresh failed:", error.message);
    return { success: false, totalFetched: 0, newAlerts: 0, notificationSent: false };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Historical seeder — seeds last 90 days of KSeF-related acts from ELI API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seeder historyczny — pobiera akty KSeF z ostatnich 90 dni z ELI API
 * i zapisuje je do bazy danych. Uruchamiany jednorazowo przy starcie serwera.
 */
export async function seedHistoricalKsefAlerts(): Promise<{
  success: boolean;
  totalFetched: number;
  newItems: number;
  message: string;
}> {
  console.log("[KSeF Seeder] Starting historical KSeF data seeding (last 90 days)...");
  const startTime = Date.now();

  try {
    const { getActsInDateRange } = await import("./eli-api-client.js");

    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 90);

    console.log(`[KSeF Seeder] Date range: ${fromDate.toISOString().slice(0, 10)} → ${toDate.toISOString().slice(0, 10)}`);

    // Pobierz akty z Dziennika Ustaw za ostatnie 90 dni
    const duActs = await getActsInDateRange("DU", fromDate, toDate);
    console.log(`[KSeF Seeder] DU acts in range: ${duActs.length}`);

    // Filtruj tylko KSeF-related
    const ksefActs = duActs.filter(
      (act) => isKsefRelated(act.title) || isKsefRelated(act.excerpt)
    );
    console.log(`[KSeF Seeder] KSeF-related acts: ${ksefActs.length}`);

    // Konwertuj do KsefAlertItem
    const SOURCE = "isap.sejm.gov.pl";
    const items: KsefAlertItem[] = ksefActs.map((act) => {
      const id = generateId(SOURCE, act.title, act.date);
      const priority = detectPriority(act.title, act.excerpt);
      const alertType: KsefAlertItem["alertType"] =
        act.title.toLowerCase().includes("rozporządzenie") ? "przepis" :
        act.title.toLowerCase().includes("ustawa") ? "przepis" :
        act.title.toLowerCase().includes("obwieszczenie") ? "komunikat" :
        "przepis";

      // Wyciągnij legalBasis z excerpt (Dz. U. reference)
      const legalBasisMatch = act.excerpt.match(/\(([^)]*(?:DU|Dz\. ?U\.|poz\.)[^)]*)\)/i);
      const legalBasis = legalBasisMatch
        ? legalBasisMatch[1]
        : act.excerpt.slice(0, 120);

      return {
        id,
        title: act.title,
        summary: act.excerpt.slice(0, 500),
        url: act.url,
        source: SOURCE,
        alertType,
        priority,
        publishedAt: act.date,
        legalBasis,
      };
    });

    // Zapisz do bazy (saveKsefAlerts obsługuje deduplikację)
    const { newItems } = await saveKsefAlerts(items);

    const duration = Date.now() - startTime;
    const message = `Seeder zakończony w ${duration}ms. Znaleziono ${ksefActs.length} aktów KSeF, dodano ${newItems} nowych do bazy.`;
    console.log(`[KSeF Seeder] ${message}`);

    return {
      success: true,
      totalFetched: ksefActs.length,
      newItems,
      message,
    };
  } catch (error: any) {
    const message = `Seeder błąd: ${error.message}`;
    console.error(`[KSeF Seeder] ${message}`);
    return { success: false, totalFetched: 0, newItems: 0, message };
  }
}
