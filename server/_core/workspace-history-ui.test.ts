import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const chat = readFileSync("client/src/pages/Chat.tsx", "utf8");
const notes = readFileSync(
  "client/src/components/FloatingNotesPanel.tsx",
  "utf8"
);
const workspace = readFileSync(
  "client/src/components/ChatWorkspacePanel.tsx",
  "utf8"
);
const sessions = readFileSync("server/db-sessions.ts", "utf8");
const router = readFileSync("server/routers.ts", "utf8");

describe("trwała przestrzeń pracy", () => {
  it("udostępnia w czacie historię spraw, notatki i STOP", () => {
    expect(chat).toContain("ChatWorkspacePanel");
    expect(chat).toContain("handleOpenSession");
    expect(chat).toContain("handleUseNote");
    expect(chat).toContain("handleStop");
    expect(chat).toContain("signal: controller.signal");
    expect(chat).toContain("trpcClient.sessions.getMessages.query");
    expect(workspace).toContain("Przenieś historię do konta");
  });

  it("pozostawia wejście do przestrzeni sprawy widoczne także przed logowaniem", () => {
    const buttonIndex = chat.indexOf("Sprawy i notatki");
    expect(buttonIndex).toBeGreaterThan(-1);
    expect(chat.slice(Math.max(0, buttonIndex - 300), buttonIndex)).not.toContain("{user &&");
  });

  it("łączy historię i trwałe notatki w jednym panelu czatu", () => {
    expect(workspace).toContain("Przestrzeń sprawy");
    expect(workspace).toContain('value="matters"');
    expect(workspace).toContain('value="notes"');
    expect(workspace).toContain("onOpenSession");
    expect(workspace).toContain("onUseNote");
    expect(workspace).toContain("trpc.notes.create.useMutation");
    expect(workspace).toContain("trpc.notes.updateContent.useMutation");
    expect(workspace).toContain("trpc.notes.delete.useMutation");
  });

  it("odczytuje historię wyłącznie po weryfikacji właściciela sesji", () => {
    expect(sessions).toContain("getSessionMessagesForUser");
    expect(router).toContain("getMessages: protectedProcedure");
    expect(router).toContain("saveMessagePairForUser");
    expect(router).toContain("importLocalHistory: protectedProcedure");
  });

  it("przenosi podręczne notatki z localStorage do trwałej bazy konta", () => {
    expect(notes).toContain("trpc.notes.getAll.useQuery");
    expect(notes).toContain("Przenieś do konta");
    expect(notes).toContain("localStorage.removeItem(LEGACY_NOTES_KEY)");
    expect(notes).toContain('if (location === "/chat") return null');
  });
});
