/**
 * DB Helpers — Chat Sessions & Messages
 *
 * Stefan zapamiętuje całą historię rozmów w bazie danych.
 * localStorage jest tylko buforem tymczasowym — DB jest źródłem prawdy.
 *
 * Archiwizacja: sesje nieaktywne > 30 dni → archived = true (nie usuwane)
 * Limit: 50 wiadomości per sesja w kontekście LLM (reszta w DB do wglądu)
 */

import { getDb } from "./db";
import {
  chatSessions,
  chatMessages,
  type ChatSession,
  type ChatMessage,
  type InsertChatSession,
  type InsertChatMessage,
} from "../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// Sessions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pobiera wszystkie aktywne sesje użytkownika (nie zarchiwizowane)
 */
export async function getUserSessions(userId: number): Promise<ChatSession[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(chatSessions)
    .where(
      and(eq(chatSessions.userId, userId), eq(chatSessions.archived, false))
    )
    .orderBy(desc(chatSessions.updatedAt))
    .limit(50);
}

/**
 * Pobiera zarchiwizowane sesje użytkownika
 */
export async function getArchivedSessions(
  userId: number
): Promise<ChatSession[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(chatSessions)
    .where(
      and(eq(chatSessions.userId, userId), eq(chatSessions.archived, true))
    )
    .orderBy(desc(chatSessions.archivedAt))
    .limit(100);
}

/**
 * Tworzy nową sesję czatu
 */
export async function createSession(
  userId: number,
  title: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(chatSessions).values({
    userId,
    title,
    archived: false,
  });
  return Number(result[0].insertId);
}

/**
 * Aktualizuje tytuł sesji
 */
export async function updateSessionTitle(
  sessionId: number,
  userId: number,
  title: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(chatSessions)
    .set({ title, updatedAt: new Date() })
    .where(
      and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))
    );
}

/**
 * Aktualizuje timestamp updatedAt sesji (po każdej wiadomości)
 */
export async function touchSession(sessionId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(chatSessions)
    .set({ updatedAt: new Date() })
    .where(eq(chatSessions.id, sessionId));
}

/**
 * Archiwizuje sesję (nie usuwa — zachowuje historię)
 */
export async function archiveSession(
  sessionId: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(chatSessions)
    .set({ archived: true, archivedAt: new Date(), updatedAt: new Date() })
    .where(
      and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))
    );
}

/**
 * Przywraca sesję z archiwum
 */
export async function restoreSession(
  sessionId: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(chatSessions)
    .set({ archived: false, archivedAt: null, updatedAt: new Date() })
    .where(
      and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))
    );
}

/**
 * Usuwa sesję i wszystkie jej wiadomości (cascade)
 */
export async function deleteSession(
  sessionId: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Sprawdź czy sesja należy do użytkownika
  const session = await db
    .select({ id: chatSessions.id })
    .from(chatSessions)
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
    .limit(1);
  if (session.length === 0)
    throw new Error("Session not found or unauthorized");
  await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));
}

/**
 * Automatyczna archiwizacja sesji nieaktywnych > 30 dni
 * Uruchamiana przez cron
 */
export async function autoArchiveInactiveSessions(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable for session archival");
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const result = await db
    .update(chatSessions)
    .set({ archived: true, archivedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(chatSessions.archived, false),
        sql`${chatSessions.updatedAt} < ${thirtyDaysAgo}`
      )
    );
  return Number(result[0]?.affectedRows ?? 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pobiera wiadomości sesji (ostatnie N — do kontekstu LLM)
 */
export async function getSessionMessages(
  sessionId: number,
  limit: number = 100
): Promise<ChatMessage[]> {
  const db = await getDb();
  if (!db) return [];
  // Pobierz ostatnie `limit` wiadomości, posortowane chronologicznie
  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
  return rows.reverse(); // chronologicznie
}

/**
 * Pobiera historię wyłącznie wtedy, gdy sesja należy do wskazanego użytkownika.
 * Sam adresowalny sessionId nie może otwierać danych innego konta Manus OAuth.
 */
export async function getSessionMessagesForUser(
  sessionId: number,
  userId: number,
  limit: number = 100
): Promise<ChatMessage[]> {
  const db = await getDb();
  if (!db) return [];

  const session = await db
    .select({ id: chatSessions.id })
    .from(chatSessions)
    .where(
      and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))
    )
    .limit(1);

  if (session.length === 0) return [];
  return getSessionMessages(sessionId, limit);
}

/**
 * Zapisuje wiadomość do sesji
 */
export async function saveSessionMessage(
  sessionId: number,
  role: "user" | "assistant" | "system",
  content: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db
    .insert(chatMessages)
    .values({ sessionId, role, content });
  await touchSession(sessionId);
  return Number(result[0].insertId);
}

/**
 * Zapisuje parę wiadomości (user + assistant) atomowo
 */
export async function saveMessagePair(
  sessionId: number,
  userContent: string,
  assistantContent: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(chatMessages).values([
    { sessionId, role: "user", content: userContent },
    { sessionId, role: "assistant", content: assistantContent },
  ]);
  await touchSession(sessionId);
}

/** Zapisuje parę wiadomości wyłącznie do sesji należącej do użytkownika. */
export async function saveMessagePairForUser(
  sessionId: number,
  userId: number,
  userContent: string,
  assistantContent: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const session = await db
    .select({ id: chatSessions.id })
    .from(chatSessions)
    .where(
      and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))
    )
    .limit(1);

  if (session.length === 0) {
    throw new Error("Session not found or unauthorized");
  }

  await saveMessagePair(sessionId, userContent, assistantContent);
}

/**
 * Pobiera liczbę wiadomości w sesji
 */
export async function getSessionMessageCount(
  sessionId: number
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId));
  return Number(result[0]?.count ?? 0);
}

/**
 * Pobiera ostatnią sesję użytkownika (lub null jeśli brak)
 */
export async function getLastSession(
  userId: number
): Promise<ChatSession | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(chatSessions)
    .where(
      and(eq(chatSessions.userId, userId), eq(chatSessions.archived, false))
    )
    .orderBy(desc(chatSessions.updatedAt))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Generuje tytuł sesji na podstawie pierwszej wiadomości użytkownika
 */
export function generateSessionTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim();
  if (trimmed.length <= 50) return trimmed;
  return trimmed.substring(0, 47) + "...";
}
