/**
 * DB Helpers — Stefan Notes
 *
 * Trwałe notatki z odpowiedzi Stefana — zapisywane między sesjami.
 * Użytkownik może zapisać dowolną odpowiedź Stefana jako notatkę,
 * nadać jej tytuł, kategorię i przypiąć do góry listy.
 *
 * Kategorie: ksef | klient | sprawa | preferencja | inne
 */

import { getDb } from "./db";
import { stefanNotes, type StefanNote, type InsertStefanNote } from "../drizzle/schema";
import { eq, desc, and, like, or, sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pobiera wszystkie notatki użytkownika (przypięte pierwsze, potem chronologicznie)
 */
export async function getUserNotes(userId: number): Promise<StefanNote[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(stefanNotes)
    .where(eq(stefanNotes.userId, userId))
    .orderBy(desc(stefanNotes.isPinned), desc(stefanNotes.createdAt));
}

/**
 * Pobiera notatki użytkownika według kategorii
 */
export async function getNotesByCategory(
  userId: number,
  category: "ksef" | "klient" | "sprawa" | "preferencja" | "inne"
): Promise<StefanNote[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(stefanNotes)
    .where(and(eq(stefanNotes.userId, userId), eq(stefanNotes.category, category)))
    .orderBy(desc(stefanNotes.isPinned), desc(stefanNotes.createdAt));
}

/**
 * Pobiera notatki powiązane z sesją
 */
export async function getNotesBySession(sessionId: number): Promise<StefanNote[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(stefanNotes)
    .where(eq(stefanNotes.sessionId, sessionId))
    .orderBy(desc(stefanNotes.createdAt));
}

/**
 * Pobiera pojedynczą notatkę (z weryfikacją właściciela)
 */
export async function getNote(noteId: number, userId: number): Promise<StefanNote | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(stefanNotes)
    .where(and(eq(stefanNotes.id, noteId), eq(stefanNotes.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Wyszukuje notatki po tytule lub treści (case-insensitive LIKE)
 */
export async function searchNotes(userId: number, query: string): Promise<StefanNote[]> {
  const db = await getDb();
  if (!db) return [];
  const pattern = `%${query}%`;
  return db
    .select()
    .from(stefanNotes)
    .where(
      and(
        eq(stefanNotes.userId, userId),
        or(
          like(stefanNotes.title, pattern),
          like(stefanNotes.content, pattern)
        )
      )
    )
    .orderBy(desc(stefanNotes.isPinned), desc(stefanNotes.createdAt))
    .limit(50);
}

/**
 * Liczba notatek użytkownika
 */
export async function getNoteCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(stefanNotes)
    .where(eq(stefanNotes.userId, userId));
  return Number(result[0]?.count ?? 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Write
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tworzy nową notatkę z odpowiedzi Stefana
 */
export async function createNote(
  userId: number,
  title: string,
  content: string,
  category: "ksef" | "klient" | "sprawa" | "preferencja" | "inne" = "inne",
  sessionId?: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(stefanNotes).values({
    userId,
    title,
    content,
    category,
    isPinned: false,
    sessionId: sessionId ?? null,
  });
  return Number(result[0].insertId);
}

/**
 * Aktualizuje tytuł notatki
 */
export async function updateNoteTitle(noteId: number, userId: number, title: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(stefanNotes)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(stefanNotes.id, noteId), eq(stefanNotes.userId, userId)));
}

/**
 * Aktualizuje treść notatki (opcjonalnie przez użytkownika)
 */
export async function updateNoteContent(
  noteId: number,
  userId: number,
  content: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(stefanNotes)
    .set({ content, updatedAt: new Date() })
    .where(and(eq(stefanNotes.id, noteId), eq(stefanNotes.userId, userId)));
}

/**
 * Aktualizuje kategorię notatki
 */
export async function updateNoteCategory(
  noteId: number,
  userId: number,
  category: "ksef" | "klient" | "sprawa" | "preferencja" | "inne"
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(stefanNotes)
    .set({ category, updatedAt: new Date() })
    .where(and(eq(stefanNotes.id, noteId), eq(stefanNotes.userId, userId)));
}

/**
 * Przełącza przypięcie notatki
 */
export async function toggleNotePin(noteId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const note = await getNote(noteId, userId);
  if (!note) throw new Error("Note not found");
  const newPinned = !note.isPinned;
  await db
    .update(stefanNotes)
    .set({ isPinned: newPinned, updatedAt: new Date() })
    .where(and(eq(stefanNotes.id, noteId), eq(stefanNotes.userId, userId)));
  return newPinned;
}

/**
 * Usuwa notatkę
 */
export async function deleteNote(noteId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(stefanNotes)
    .where(and(eq(stefanNotes.id, noteId), eq(stefanNotes.userId, userId)));
}

/**
 * Generuje tytuł notatki na podstawie pierwszych słów treści
 */
export function generateNoteTitle(content: string): string {
  // Usuń markdown, weź pierwsze 60 znaków
  const plain = content
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/\n/g, " ")
    .trim();
  if (plain.length <= 60) return plain;
  // Utnij na granicy słowa
  const cut = plain.substring(0, 57);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 30 ? cut.substring(0, lastSpace) : cut) + "...";
}
