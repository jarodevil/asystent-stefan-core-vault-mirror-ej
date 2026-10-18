import { getDb } from "./db";
import { devSettings, errorLogs, qualityMetrics, sourceWhitelist } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Dev Settings - Owner-only configuration
 */
export async function getAllDevSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(devSettings).orderBy(devSettings.key);
}

export async function getDevSetting(key: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(devSettings).where(eq(devSettings.key, key)).limit(1);
  return rows[0] || null;
}

export async function updateDevSetting(key: string, value: string, updatedBy: number) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getDevSetting(key);
  if (existing) {
    await db.update(devSettings).set({ value, updatedBy, updatedAt: new Date() }).where(eq(devSettings.key, key));
  } else {
    await db.insert(devSettings).values({ key, value, updatedBy });
  }
  return getDevSetting(key);
}

/**
 * Error Logs - Automatic logging
 */
export async function insertErrorLog(log: {
  errorType: "falsification" | "source_mismatch" | "system_error" | "llm_error";
  message: string;
  stackTrace?: string;
  context?: string;
  userId?: number;
  sessionId?: number;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(errorLogs).values(log);
}

export async function getErrorLogs(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(errorLogs).orderBy(desc(errorLogs.createdAt)).limit(limit).offset(offset);
}

export async function getUnresolvedErrorLogs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(errorLogs).where(eq(errorLogs.resolved, false)).orderBy(desc(errorLogs.createdAt));
}

export async function resolveErrorLog(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(errorLogs).set({ resolved: true }).where(eq(errorLogs.id, id));
}

/**
 * Quality Metrics - Monitoring
 */
export async function insertQualityMetric(metric: {
  sessionId?: number;
  messageId?: number;
  falsificationDetected: boolean;
  sourceMismatch: boolean;
  confidenceScore?: string;
  sourceUrl?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(qualityMetrics).values(metric);
}

export async function getQualityMetrics(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(qualityMetrics).orderBy(desc(qualityMetrics.createdAt)).limit(limit).offset(offset);
}

export async function getQualityMetricsBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(qualityMetrics).where(eq(qualityMetrics.sessionId, sessionId)).orderBy(desc(qualityMetrics.createdAt));
}

/**
 * Source Whitelist - Approved sources
 */
export async function getAllSourceWhitelist() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sourceWhitelist).orderBy(sourceWhitelist.domain);
}

export async function getActiveSourceWhitelist() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sourceWhitelist).where(eq(sourceWhitelist.active, true)).orderBy(sourceWhitelist.domain);
}

export async function addSourceWhitelist(domain: string, description: string, addedBy: number) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(sourceWhitelist).values({ domain, description, addedBy });
  return getSourceWhitelistByDomain(domain);
}

export async function updateSourceWhitelist(id: number, active: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(sourceWhitelist).set({ active, updatedAt: new Date() }).where(eq(sourceWhitelist.id, id));
}

export async function getSourceWhitelistByDomain(domain: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(sourceWhitelist).where(eq(sourceWhitelist.domain, domain)).limit(1);
  return rows[0] || null;
}

/**
 * Utility: Check if domain is whitelisted
 */
export async function isDomainWhitelisted(url: string): Promise<boolean> {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    const whitelist = await getActiveSourceWhitelist();
    
    // Check exact match
    if (whitelist.some((w: any) => w.domain === domain)) {
      return true;
    }
    
    // Check wildcard match (e.g., gov.pl matches wszystkie.gov.pl)
    return whitelist.some((w: any) => {
      if (w.domain.startsWith('.')) {
        return domain.endsWith(w.domain);
      }
      return domain.endsWith('.' + w.domain);
    });
  } catch {
    return false;
  }
}
