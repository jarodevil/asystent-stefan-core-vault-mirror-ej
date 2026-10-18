import { modelAuditEvents } from "../drizzle/schema";
import { getDb } from "./db";
import { desc } from "drizzle-orm";

export type ModelAuditEvent = {
  surface: "chat" | "document" | "pdf" | "ksef";
  model: string;
  fallbackUsed: boolean;
  safetyBlocked: boolean;
  validationIssues: number;
  sourceVerified: boolean;
  promptTokens?: number | null;
  completionTokens?: number | null;
  failureKind: string | null;
  configHash: string;
};

/** Persists technical metadata only; never prompt, document, answer, URL, client or session content. */
export async function recordModelAuditEvent(event: ModelAuditEvent): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(modelAuditEvents).values(event);
}

export async function getRecentModelAuditEvents(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(modelAuditEvents)
    .orderBy(desc(modelAuditEvents.createdAt))
    .limit(limit);
}
