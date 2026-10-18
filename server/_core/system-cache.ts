/**
 * System Cache — trwały cache bazy danych Stefana
 *
 * Zastępuje budowanie danych od nowa przy każdym uruchomieniu.
 * Dane są AKTUALIZOWANE (upsert), nie kasowane i tworzone od nowa.
 *
 * Klucze cache:
 *   'ksef_alerts_context'   — skompilowany kontekst alertów KSeF dla system prompt (TTL: 6h)
 *   'rss_news_context'      — skompilowany kontekst nowelizacji RSS dla system prompt (TTL: 24h)
 *   'seeder_last_run'       — timestamp ostatniego uruchomienia seedera historycznego (TTL: brak)
 *   'ksef_refresh_last_run' — timestamp ostatniego odświeżenia alertów KSeF (TTL: brak)
 *   'rss_refresh_last_run'  — timestamp ostatniego odświeżenia RSS (TTL: brak)
 *   'db_stats'              — statystyki bazy danych (TTL: 1h)
 */

import { getDb } from "../db";
import { systemCache } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface CacheEntry {
  value: string;
  metadata?: Record<string, unknown>;
  isExpired: boolean;
  age: number; // wiek w sekundach
}

/**
 * Pobiera wartość z cache.
 * Zwraca null jeśli klucz nie istnieje lub TTL wygasł.
 */
export async function cacheGet(key: string): Promise<CacheEntry | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const rows = await db
      .select()
      .from(systemCache)
      .where(eq(systemCache.cacheKey, key))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    const ageMs = Date.now() - new Date(row.updatedAt).getTime();
    const ageSeconds = Math.floor(ageMs / 1000);

    const isExpired = row.ttlSeconds !== null && ageSeconds > row.ttlSeconds;

    let metadata: Record<string, unknown> = {};
    if (row.metadata) {
      try { metadata = JSON.parse(row.metadata); } catch {}
    }

    return {
      value: row.value,
      metadata,
      isExpired,
      age: ageSeconds,
    };
  } catch (err: any) {
    console.warn(`[SystemCache] cacheGet(${key}) failed:`, err.message);
    return null;
  }
}

/**
 * Zapisuje wartość do cache (upsert — nigdy nie kasuje, tylko aktualizuje).
 * ttlSeconds: null = brak wygaśnięcia
 */
export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds: number | null = null,
  metadata?: Record<string, unknown>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .insert(systemCache)
      .values({
        cacheKey: key,
        value,
        ttlSeconds,
        metadata: metadata ? JSON.stringify(metadata) : null,
      })
      .onDuplicateKeyUpdate({
        set: {
          value,
          ttlSeconds,
          metadata: metadata ? JSON.stringify(metadata) : null,
          updatedAt: new Date(),
        },
      });
  } catch (err: any) {
    console.warn(`[SystemCache] cacheSet(${key}) failed:`, err.message);
  }
}

/**
 * Pobiera wartość z cache lub wywołuje factory function jeśli cache jest pusty/wygasły.
 * Wzorzec "stale-while-revalidate": zwraca stare dane i odświeża w tle.
 */
export async function cacheGetOrSet<T>(
  key: string,
  factory: () => Promise<string>,
  ttlSeconds: number,
  metadata?: Record<string, unknown>
): Promise<string> {
  const cached = await cacheGet(key);

  if (cached && !cached.isExpired) {
    console.log(`[SystemCache] HIT: ${key} (wiek: ${cached.age}s, TTL: ${ttlSeconds}s)`);
    return cached.value;
  }

  if (cached && cached.isExpired) {
    // Stale-while-revalidate: zwróć stare dane, odśwież w tle
    console.log(`[SystemCache] STALE: ${key} (wiek: ${cached.age}s > TTL: ${ttlSeconds}s) — odświeżam w tle`);
    factory().then(newValue => {
      cacheSet(key, newValue, ttlSeconds, metadata).catch(() => {});
    }).catch(() => {});
    return cached.value;
  }

  // Cache miss — zbuduj dane i zapisz
  console.log(`[SystemCache] MISS: ${key} — buduję dane...`);
  const value = await factory();
  await cacheSet(key, value, ttlSeconds, metadata);
  return value;
}

/**
 * Sprawdza czy seeder powinien się uruchomić.
 * Zwraca true jeśli: nigdy nie był uruchomiony LUB baza jest pusta LUB dane starsze niż minAgeHours.
 */
export async function shouldRunSeeder(
  seederKey: string,
  minAgeHours: number = 24
): Promise<{ shouldRun: boolean; reason: string }> {
  const cached = await cacheGet(seederKey);

  if (!cached) {
    return { shouldRun: true, reason: "Seeder nigdy nie był uruchomiony" };
  }

  const ageHours = cached.age / 3600;
  if (ageHours > minAgeHours) {
    return {
      shouldRun: true,
      reason: `Dane starsze niż ${minAgeHours}h (wiek: ${ageHours.toFixed(1)}h)`,
    };
  }

  return {
    shouldRun: false,
    reason: `Dane świeże (wiek: ${ageHours.toFixed(1)}h < ${minAgeHours}h)`,
  };
}

/**
 * Zapisuje timestamp uruchomienia seedera.
 */
export async function markSeederRun(seederKey: string, details?: Record<string, unknown>): Promise<void> {
  await cacheSet(
    seederKey,
    new Date().toISOString(),
    null, // brak TTL — timestamp jest zawsze aktualny
    { runAt: new Date().toISOString(), ...details }
  );
}

/**
 * Pobiera statystyki cache (ile kluczy, ile wygasłych).
 */
export async function getCacheStats(): Promise<{
  totalKeys: number;
  keys: Array<{ key: string; age: number; isExpired: boolean; ttl: number | null }>;
}> {
  const db = await getDb();
  if (!db) return { totalKeys: 0, keys: [] };

  try {
    const rows = await db.select().from(systemCache);
    const now = Date.now();

    const keys = rows.map(row => {
      const ageSeconds = Math.floor((now - new Date(row.updatedAt).getTime()) / 1000);
      const isExpired = row.ttlSeconds !== null && ageSeconds > row.ttlSeconds;
      return {
        key: row.cacheKey,
        age: ageSeconds,
        isExpired,
        ttl: row.ttlSeconds,
      };
    });

    return { totalKeys: rows.length, keys };
  } catch {
    return { totalKeys: 0, keys: [] };
  }
}
