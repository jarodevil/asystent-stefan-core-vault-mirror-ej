import { getDb } from "./db";
import { generatedDocuments } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export interface SaveDocumentInput {
  userId: number;
  clientCardId?: number | null;
  templateId: string;
  templateTitle: string;
  category: string;
  content: string;
  fieldValues?: Record<string, unknown>;
  legalBasis?: string;
  clientName?: string;
  clientNip?: string;
}

/** Zapisuje wygenerowany dokument do bazy danych. */
export async function saveGeneratedDocument(input: SaveDocumentInput) {
  const db = await getDb();
  if (!db) throw new Error("Baza danych niedostępna");
  const [result] = await db.insert(generatedDocuments).values({
    userId: input.userId,
    clientCardId: input.clientCardId ?? null,
    templateId: input.templateId,
    templateTitle: input.templateTitle,
    category: input.category,
    content: input.content,
    fieldValues: input.fieldValues ? JSON.stringify(input.fieldValues) : null,
    legalBasis: input.legalBasis ?? null,
    clientName: input.clientName ?? null,
    clientNip: input.clientNip ?? null,
    status: "draft",
  });
  return Number((result as { insertId?: number | bigint }).insertId ?? 0);
}

/** Pobiera wszystkie dokumenty użytkownika (najnowsze pierwsze). */
export async function getUserDocuments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(generatedDocuments)
    .where(eq(generatedDocuments.userId, userId))
    .orderBy(desc(generatedDocuments.createdAt))
    .limit(100);
}

/** Pobiera dokumenty powiązane z konkretną kartą klienta. */
export async function getClientDocuments(userId: number, clientCardId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(generatedDocuments)
    .where(
      and(
        eq(generatedDocuments.userId, userId),
        eq(generatedDocuments.clientCardId, clientCardId)
      )
    )
    .orderBy(desc(generatedDocuments.createdAt));
}

/** Pobiera pojedynczy dokument po ID (sprawdza właściciela). */
export async function getDocumentById(userId: number, docId: number) {
  const db = await getDb();
  if (!db) return null;
  const [doc] = await db
    .select()
    .from(generatedDocuments)
    .where(
      and(
        eq(generatedDocuments.id, docId),
        eq(generatedDocuments.userId, userId)
      )
    )
    .limit(1);
  return doc ?? null;
}

/** Aktualizuje notatki do dokumentu. */
export async function updateDocumentNotes(userId: number, docId: number, notes: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(generatedDocuments)
    .set({ notes })
    .where(
      and(
        eq(generatedDocuments.id, docId),
        eq(generatedDocuments.userId, userId)
      )
    );
}

/** Zmienia status dokumentu. */
export async function updateDocumentStatus(
  userId: number,
  docId: number,
  status: "draft" | "final" | "archived"
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(generatedDocuments)
    .set({ status })
    .where(
      and(
        eq(generatedDocuments.id, docId),
        eq(generatedDocuments.userId, userId)
      )
    );
}

/** Usuwa dokument (tylko właściciel). */
export async function deleteDocument(userId: number, docId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(generatedDocuments)
    .where(
      and(
        eq(generatedDocuments.id, docId),
        eq(generatedDocuments.userId, userId)
      )
    );
}

/** Przypisuje dokument do karty klienta. */
export async function assignDocumentToClient(
  userId: number,
  docId: number,
  clientCardId: number,
  clientName: string,
  clientNip: string
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(generatedDocuments)
    .set({ clientCardId, clientName, clientNip })
    .where(
      and(
        eq(generatedDocuments.id, docId),
        eq(generatedDocuments.userId, userId)
      )
    );
}
