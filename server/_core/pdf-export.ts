/**
 * PDF Export - Exports chat history to PDF format
 * 
 * Uses jsPDF to generate PDF from chat messages
 */

import { jsPDF } from "jspdf";
import { getDb } from "../db.js";
import { chatSessions, chatMessages } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { storageGet } from "../storage.js";

const JARODEVIL_SIGNATURE_STORAGE_KEY = "jarodevil-signature-2026_1a872b38.png";

export interface ChatHistoryPDF {
  sessionId: number;
  title: string;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fetches chat history for a session
 * @param sessionId - Chat session ID
 * @param userId - User ID (for authorization)
 * @returns Chat history or null if not found/unauthorized
 */
export async function getChatHistory(
  sessionId: number,
  userId: number
): Promise<ChatHistoryPDF | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[PDF EXPORT] Database not available");
      return null;
    }

    // Fetch session
    const sessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1);

    if (sessions.length === 0) {
      console.warn(`[PDF EXPORT] Session ${sessionId} not found`);
      return null;
    }

    const session = sessions[0];

    // Authorization check
    if (session.userId !== userId) {
      console.warn(`[PDF EXPORT] User ${userId} not authorized for session ${sessionId}`);
      return null;
    }

    // Fetch messages
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);

    return {
      sessionId: session.id,
      title: session.title,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      })),
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  } catch (error: any) {
    console.error("[PDF EXPORT] Failed to fetch chat history:", error.message);
    return null;
  }
}

/**
 * Generates PDF from chat history
 * @param history - Chat history data
 * @returns PDF buffer
 */
export async function generateChatPDF(history: ChatHistoryPDF): Promise<Buffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let y = margin;

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Historia Czatu - System Stefan", margin, y);
  y += 10;

  // Session info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Tytuł: ${history.title}`, margin, y);
  y += 6;
  doc.text(`Data utworzenia: ${history.createdAt.toLocaleString("pl-PL")}`, margin, y);
  y += 6;
  doc.text(`Ostatnia aktualizacja: ${history.updatedAt.toLocaleString("pl-PL")}`, margin, y);
  y += 10;

  // Separator
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Messages
  for (const msg of history.messages) {
    // Check if we need a new page
    if (y > pageHeight - 40) {
      doc.addPage();
      y = margin;
    }

    // Role header
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const roleLabel =
      msg.role === "user"
        ? "Użytkownik"
        : msg.role === "assistant"
        ? "Stefan"
        : "System";
    const timestamp = msg.createdAt.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.text(`${roleLabel} (${timestamp}):`, margin, y);
    y += 6;

    // Message content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(msg.content, maxWidth);
    
    for (const line of lines) {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 5;
    }

    y += 5; // Space between messages
  }

  let signatureBytes: Uint8Array | null = null;
  try {
    const { url } = await storageGet(JARODEVIL_SIGNATURE_STORAGE_KEY);
    const response = await fetch(url);
    if (response.ok) signatureBytes = new Uint8Array(await response.arrayBuffer());
  } catch (error) {
    console.warn("[PDF EXPORT] Jaro'Devil signature unavailable", error);
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (signatureBytes) {
      doc.addImage(signatureBytes, "PNG", margin, pageHeight - 17, 22, 10);
    }
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Strona ${i} z ${totalPages} - Jaro'Devil | Wygenerowano przez System Stefan`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Exports chat history to PDF
 * @param sessionId - Chat session ID
 * @param userId - User ID (for authorization)
 * @returns PDF buffer or null if failed
 */
export async function exportChatToPDF(
  sessionId: number,
  userId: number
): Promise<Buffer | null> {
  try {
    console.log(`[PDF EXPORT] Exporting session ${sessionId} for user ${userId}`);
    
    const history = await getChatHistory(sessionId, userId);
    if (!history) {
      return null;
    }

    const pdfBuffer = await generateChatPDF(history);
    console.log(`[PDF EXPORT] Successfully generated PDF for session ${sessionId}`);
    
    return pdfBuffer;
  } catch (error: any) {
    console.error("[PDF EXPORT] Failed to export chat to PDF:", error.message);
    return null;
  }
}
