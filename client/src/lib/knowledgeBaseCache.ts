interface CachedLaw {
  id: string;
  title: string;
  shortTitle: string;
  year: number;
  number: number;
  content: string;
  lastUpdated: number;
  source: string; // "ISAP" or "custom"
}

interface KBCache {
  laws: CachedLaw[];
  lastSync: number;
  version: number;
}

const KB_CACHE_KEY = "stefan_kb_cache";
const KB_SYNC_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days
const CACHE_VERSION = 1;

/**
 * Initialize knowledge base cache from localStorage
 */
export function initializeKBCache(): KBCache {
  const cached = localStorage.getItem(KB_CACHE_KEY);
  if (cached) {
    try {
      const data = JSON.parse(cached) as KBCache;
      // Validate cache version
      if (data.version === CACHE_VERSION) {
        return data;
      }
    } catch (e) {
      console.error("Failed to parse KB cache:", e);
    }
  }

  return {
    laws: [],
    lastSync: 0,
    version: CACHE_VERSION,
  };
}

/**
 * Save KB cache to localStorage
 */
export function saveKBCache(cache: KBCache): void {
  try {
    localStorage.setItem(KB_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error("Failed to save KB cache:", e);
  }
}

/**
 * Add or update a law in the cache
 */
export function addLawToCache(law: Omit<CachedLaw, "lastUpdated">): void {
  const cache = initializeKBCache();
  const existingIndex = cache.laws.findIndex(l => l.id === law.id);

  const cachedLaw: CachedLaw = {
    ...law,
    lastUpdated: Date.now(),
  };

  if (existingIndex >= 0) {
    cache.laws[existingIndex] = cachedLaw;
  } else {
    cache.laws.push(cachedLaw);
  }

  saveKBCache(cache);
}

/**
 * Search laws in cache
 */
export function searchLawsInCache(query: string): CachedLaw[] {
  const cache = initializeKBCache();
  const lowerQuery = query.toLowerCase();

  return cache.laws.filter(law =>
    law.title.toLowerCase().includes(lowerQuery) ||
    law.shortTitle.toLowerCase().includes(lowerQuery) ||
    law.content.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get a specific law from cache
 */
export function getLawFromCache(id: string): CachedLaw | null {
  const cache = initializeKBCache();
  return cache.laws.find(l => l.id === id) || null;
}

/**
 * Check if cache needs update (older than 30 days)
 */
export function needsKBUpdate(): boolean {
  const cache = initializeKBCache();
  return Date.now() - cache.lastSync > KB_SYNC_INTERVAL;
}

/**
 * Mark cache as synced
 */
export function markKBSynced(): void {
  const cache = initializeKBCache();
  cache.lastSync = Date.now();
  saveKBCache(cache);
}

/**
 * Get cache statistics
 */
export function getKBCacheStats() {
  const cache = initializeKBCache();
  return {
    totalLaws: cache.laws.length,
    lastSync: new Date(cache.lastSync),
    needsUpdate: needsKBUpdate(),
    cacheSize: new Blob([JSON.stringify(cache)]).size,
  };
}

/**
 * Clear entire cache
 */
export function clearKBCache(): void {
  localStorage.removeItem(KB_CACHE_KEY);
}

/**
 * Get all cached laws
 */
export function getAllCachedLaws(): CachedLaw[] {
  const cache = initializeKBCache();
  return cache.laws;
}

/**
 * Get laws by year
 */
export function getLawsByYear(year: number): CachedLaw[] {
  const cache = initializeKBCache();
  return cache.laws.filter(l => l.year === year);
}

/**
 * Get most recently updated laws
 */
export function getRecentLaws(limit: number = 10): CachedLaw[] {
  const cache = initializeKBCache();
  return cache.laws
    .sort((a, b) => b.lastUpdated - a.lastUpdated)
    .slice(0, limit);
}
