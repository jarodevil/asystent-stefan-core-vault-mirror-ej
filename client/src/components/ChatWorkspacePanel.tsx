import AccountAccess from "@/components/AccountAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Archive,
  Check,
  Copy,
  FileText,
  FolderOpen,
  History,
  Loader2,
  NotebookPen,
  Plus,
  StickyNote,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type LegacyMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatWorkspacePanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSessionId: number | null;
  legacyMessages: LegacyMessage[];
  isImportingLegacyHistory: boolean;
  onImportLegacyHistory: () => Promise<void> | void;
  onOpenSession: (
    sessionId: number,
    isArchived: boolean
  ) => Promise<void> | void;
  onUseNote: (content: string) => void;
};

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Jedyna przestrzeń robocza rozmowy: historia spraw oraz trwałe notatki.
 * Nie pobiera danych ani nie wykonuje mutacji AI — operuje wyłącznie na danych
 * konta aktywnego użytkownika.
 */
export default function ChatWorkspacePanel({
  open,
  onOpenChange,
  currentSessionId,
  legacyMessages,
  isImportingLegacyHistory,
  onImportLegacyHistory,
  onOpenSession,
  onUseNote,
}: ChatWorkspacePanelProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<"matters" | "notes">("matters");
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: activeSessions = [], isLoading: loadingActiveSessions } =
    trpc.sessions.getActive.useQuery(undefined, { enabled: !!user && open });
  const { data: archivedSessions = [], isLoading: loadingArchivedSessions } =
    trpc.sessions.getArchived.useQuery(undefined, { enabled: !!user && open });
  const { data: savedNotes = [], isLoading: loadingNotes } =
    trpc.notes.getAll.useQuery(undefined, { enabled: !!user && open });

  const createNoteMutation = trpc.notes.create.useMutation();
  const updateTitleMutation = trpc.notes.updateTitle.useMutation();
  const updateContentMutation = trpc.notes.updateContent.useMutation();
  const deleteNoteMutation = trpc.notes.delete.useMutation();

  const selectedNote =
    savedNotes.find(note => note.id === selectedNoteId) ?? null;
  const isSaving =
    createNoteMutation.isPending ||
    updateTitleMutation.isPending ||
    updateContentMutation.isPending;

  const clearEditor = () => {
    setSelectedNoteId(null);
    setTitle("");
    setContent("");
  };

  const selectNote = (note: (typeof savedNotes)[number]) => {
    setSelectedNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  const createNewNote = () => {
    clearEditor();
    setActiveTab("notes");
  };

  const saveNote = async () => {
    if (!user) return;
    if (!content.trim()) {
      toast.error("Wpisz treść notatki.");
      return;
    }

    const effectiveTitle = title.trim() || "Notatka robocza";
    try {
      if (selectedNote) {
        await Promise.all([
          updateTitleMutation.mutateAsync({
            noteId: selectedNote.id,
            title: effectiveTitle,
          }),
          updateContentMutation.mutateAsync({
            noteId: selectedNote.id,
            content: content.trim(),
          }),
        ]);
        toast.success("Notatka została zaktualizowana.");
      } else {
        await createNoteMutation.mutateAsync({
          title: effectiveTitle,
          content: content.trim(),
          category: "inne",
          sessionId: currentSessionId ?? undefined,
        });
        toast.success("Notatka została zapisana w trwałej bazie.");
      }
      await utils.notes.getAll.invalidate();
      clearEditor();
    } catch (error) {
      toast.error("Nie udało się zapisać notatki.", {
        description:
          error instanceof Error ? error.message : "Spróbuj ponownie.",
      });
    }
  };

  const deleteSelectedNote = async () => {
    if (!selectedNote) return;
    try {
      await deleteNoteMutation.mutateAsync({ noteId: selectedNote.id });
      await utils.notes.getAll.invalidate();
      clearEditor();
      toast.success("Notatka została usunięta.");
    } catch (error) {
      toast.error("Nie udało się usunąć notatki.", {
        description:
          error instanceof Error ? error.message : "Spróbuj ponownie.",
      });
    }
  };

  const useSelectedNote = () => {
    if (!selectedNote) return;
    onUseNote(selectedNote.content);
  };

  const openMatter = async (sessionId: number, isArchived: boolean) => {
    await onOpenSession(sessionId, isArchived);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="border-b px-6 py-5 pr-12">
          <SheetTitle className="flex items-center gap-2 font-office text-xl">
            <FolderOpen className="size-5 text-primary" /> Przestrzeń sprawy
          </SheetTitle>
          <SheetDescription>
            Wznów wcześniejszą sprawę lub pracuj na trwałych notatkach bez
            opuszczania konwersacji. Otwarcie sprawy i użycie notatki nie
            uruchamiają modelu.
          </SheetDescription>
        </SheetHeader>

        {!user ? (
          <div className="space-y-4 p-6 text-sm text-muted-foreground">
            <p>
              Historia spraw i notatki są trwale przypisane do zalogowanego
              konta.
            </p>
            <AccountAccess variant="inline" />
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={value => setActiveTab(value as "matters" | "notes")}
            className="min-h-0 flex-1 gap-0"
          >
            <div className="border-b px-6 pt-3">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="matters"
                  className="flex-none rounded-t-md px-4 data-[state=active]:bg-muted"
                >
                  <History className="size-4" /> Sprawy
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="flex-none rounded-t-md px-4 data-[state=active]:bg-muted"
                >
                  <StickyNote className="size-4" /> Notatki
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="matters" className="min-h-0">
              <ScrollArea className="h-[calc(100dvh-13.5rem)]">
                <div className="space-y-7 p-6">
                  {legacyMessages.length > 0 && (
                    <section
                      className="rounded-lg border border-primary/20 bg-primary/[0.04] p-4"
                      aria-labelledby="legacy-history-heading"
                    >
                      <h2
                        id="legacy-history-heading"
                        className="text-sm font-semibold"
                      >
                        Historia znaleziona na tym urządzeniu
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Wykryto {legacyMessages.length} lokalnych wiadomości z
                        wcześniejszej wersji. Możesz przenieść je do konta jako
                        jedną sprawę — bez uruchamiania modelu.
                      </p>
                      <Button
                        className="mt-3"
                        size="sm"
                        onClick={() => void onImportLegacyHistory()}
                        disabled={isImportingLegacyHistory}
                      >
                        {isImportingLegacyHistory ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <History className="size-4" />
                        )}
                        Przenieś historię do konta
                      </Button>
                    </section>
                  )}

                  <section aria-labelledby="current-matters-heading">
                    <div className="mb-3 flex items-center justify-between">
                      <h2
                        id="current-matters-heading"
                        className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                      >
                        Ostatnie sprawy
                      </h2>
                      <span className="text-xs text-muted-foreground">
                        {activeSessions.length}
                      </span>
                    </div>
                    {loadingActiveSessions ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : activeSessions.length === 0 ? (
                      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        Nie ma jeszcze aktywnych spraw. Pierwsza zostanie
                        zapisana po wysłaniu pytania.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {activeSessions.map(session => (
                          <button
                            type="button"
                            key={session.id}
                            onClick={() => void openMatter(session.id, false)}
                            className="w-full rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
                          >
                            <span className="block truncate text-sm font-medium">
                              {session.title}
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {session.messageCount} wiadomości ·{" "}
                              {formatDateTime(session.updatedAt)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>

                  <section aria-labelledby="archive-heading">
                    <div className="mb-3 flex items-center justify-between">
                      <h2
                        id="archive-heading"
                        className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                      >
                        <Archive className="size-4" /> Archiwum
                      </h2>
                      <span className="text-xs text-muted-foreground">
                        {archivedSessions.length}
                      </span>
                    </div>
                    {loadingArchivedSessions ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : archivedSessions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Brak zarchiwizowanych spraw.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {archivedSessions.map(session => (
                          <button
                            type="button"
                            key={session.id}
                            onClick={() => void openMatter(session.id, true)}
                            className="w-full rounded-lg border border-dashed bg-muted/20 p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
                          >
                            <span className="block truncate text-sm font-medium">
                              {session.title}
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {session.messageCount} wiadomości · archiwum od{" "}
                              {formatDateTime(session.archivedAt)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="notes" className="min-h-0">
              <div className="grid h-[calc(100dvh-13.5rem)] min-h-0 grid-rows-[minmax(9rem,0.85fr)_minmax(15rem,1.15fr)] md:grid-cols-[minmax(12rem,0.8fr)_minmax(16rem,1.2fr)] md:grid-rows-1">
                <div className="min-h-0 border-b md:border-r md:border-b-0">
                  <div className="flex items-center justify-between border-b p-3">
                    <p className="text-sm font-semibold">Zapisane notatki</p>
                    <Button variant="outline" size="sm" onClick={createNewNote}>
                      <Plus className="size-4" /> Nowa
                    </Button>
                  </div>
                  <ScrollArea className="h-[calc(100%-3.25rem)]">
                    <div className="space-y-2 p-3">
                      {loadingNotes ? (
                        <div className="flex justify-center py-5">
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : savedNotes.length === 0 ? (
                        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                          Brak zapisanych notatek.
                        </p>
                      ) : (
                        savedNotes.map(note => (
                          <button
                            type="button"
                            key={note.id}
                            onClick={() => selectNote(note)}
                            className={`w-full rounded-lg p-3 text-left transition-colors ${selectedNote?.id === note.id ? "border border-primary/30 bg-primary/[0.07]" : "border bg-card hover:border-primary/40 hover:bg-primary/[0.03]"}`}
                          >
                            <span className="block truncate text-sm font-medium">
                              {note.title}
                            </span>
                            <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted-foreground">
                              {note.content}
                            </span>
                            <span className="mt-1 block text-[0.68rem] text-muted-foreground">
                              {formatDateTime(note.updatedAt)}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <div className="flex min-h-0 flex-col">
                  <div className="flex items-center justify-between border-b p-3">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <NotebookPen className="size-4 text-primary" />{" "}
                      {selectedNote ? "Edycja notatki" : "Nowa notatka"}
                    </p>
                    {selectedNote && (
                      <Button variant="ghost" size="sm" onClick={clearEditor}>
                        Nowa
                      </Button>
                    )}
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
                    <Input
                      value={title}
                      onChange={event => setTitle(event.target.value)}
                      placeholder="Tytuł notatki"
                    />
                    <Textarea
                      value={content}
                      onChange={event => setContent(event.target.value)}
                      placeholder="Ustalenie, kontakt, termin lub fragment do wykorzystania w sprawie…"
                      className="min-h-28 flex-1 resize-none"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => void saveNote()}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Check className="size-4" />
                        )}{" "}
                        Zapisz
                      </Button>
                      {selectedNote && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={useSelectedNote}
                          >
                            <FileText className="size-4" /> Użyj w pytaniu
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigator.clipboard
                                .writeText(
                                  `${selectedNote.title}\n\n${selectedNote.content}`
                                )
                                .then(() =>
                                  toast.success("Skopiowano do schowka.")
                                )
                                .catch(() =>
                                  toast.error(
                                    "Przeglądarka nie pozwoliła skopiować notatki."
                                  )
                                )
                            }
                          >
                            <Copy className="size-4" /> Kopiuj
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => void deleteSelectedNote()}
                            disabled={deleteNoteMutation.isPending}
                          >
                            <Trash2 className="size-4" /> Usuń
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
