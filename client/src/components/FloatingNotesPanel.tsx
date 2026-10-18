import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import AccountAccess from "@/components/AccountAccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit3,
  Loader2,
  Plus,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Note = {
  id: number;
  title: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type LegacyNote = {
  title?: string;
  content?: string;
};

type FloatingNotesPanelProps = {
  onNoteSelect?: (note: Note) => void;
};

const LEGACY_NOTES_KEY = "stefan_notes";

function readLegacyNotes(): LegacyNote[] {
  try {
    const raw = localStorage.getItem(LEGACY_NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(
          (note): note is LegacyNote =>
            typeof note?.content === "string" && note.content.trim().length > 0
        )
      : [];
  } catch {
    return [];
  }
}

/**
 * Podręczne notatki są źródłem pracy, a nie cachem przeglądarki.
 * Od teraz są trwale wiązane z zalogowanym kontem OAuth. Starsze lokalne
 * notatki można jawnie przenieść jednym kliknięciem.
 */
export default function FloatingNotesPanel({ onNoteSelect }: FloatingNotesPanelProps) {
  const { user, loading } = useAuth();
  const [location] = useLocation();
  const utils = trpc.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [legacyNotes, setLegacyNotes] = useState<LegacyNote[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const { data: notes = [], isLoading } = trpc.notes.getAll.useQuery(undefined, {
    enabled: !!user && location !== "/chat",
  });

  useEffect(() => {
    setLegacyNotes(readLegacyNotes());
  }, []);

  const createMutation = trpc.notes.create.useMutation();
  const updateTitleMutation = trpc.notes.updateTitle.useMutation();
  const updateContentMutation = trpc.notes.updateContent.useMutation();
  const deleteMutation = trpc.notes.delete.useMutation();

  const resetEditor = () => {
    setSelectedNote(null);
    setTitle("");
    setContent("");
    setIsEditorOpen(false);
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    setTitle("");
    setContent("");
    setIsEditorOpen(true);
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsEditorOpen(true);
    onNoteSelect?.(note);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Zaloguj się, aby zapisywać notatki.");
      return;
    }
    if (!content.trim()) {
      toast.error("Wpisz treść notatki.");
      return;
    }

    const effectiveTitle = title.trim() || "Notatka robocza";
    try {
      if (selectedNote) {
        await Promise.all([
          updateTitleMutation.mutateAsync({ noteId: selectedNote.id, title: effectiveTitle }),
          updateContentMutation.mutateAsync({ noteId: selectedNote.id, content: content.trim() }),
        ]);
        toast.success("Notatka została zaktualizowana.");
      } else {
        await createMutation.mutateAsync({
          title: effectiveTitle,
          content: content.trim(),
          category: "inne",
        });
        toast.success("Notatka została zapisana w trwałej bazie.");
      }
      await utils.notes.getAll.invalidate();
      resetEditor();
    } catch (error) {
      toast.error("Nie udało się zapisać notatki.", {
        description: error instanceof Error ? error.message : "Spróbuj ponownie.",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedNote) return;
    try {
      await deleteMutation.mutateAsync({ noteId: selectedNote.id });
      await utils.notes.getAll.invalidate();
      resetEditor();
      toast.success("Notatka została usunięta.");
    } catch (error) {
      toast.error("Nie udało się usunąć notatki.", {
        description: error instanceof Error ? error.message : "Spróbuj ponownie.",
      });
    }
  };

  const handleCopy = async () => {
    if (!selectedNote) return;
    try {
      await navigator.clipboard.writeText(`${selectedNote.title}\n\n${selectedNote.content}`);
      toast.success("Skopiowano do schowka.");
    } catch {
      toast.error("Przeglądarka nie pozwoliła skopiować notatki.");
    }
  };

  const handleImportLegacyNotes = async () => {
    if (!user || legacyNotes.length === 0) return;
    setIsImporting(true);
    try {
      await Promise.all(
        legacyNotes.map(note =>
          createMutation.mutateAsync({
            title: note.title?.trim() || "Notatka przeniesiona z przeglądarki",
            content: note.content!.trim(),
            category: "inne",
          })
        )
      );
      localStorage.removeItem(LEGACY_NOTES_KEY);
      setLegacyNotes([]);
      await utils.notes.getAll.invalidate();
      toast.success("Przeniesiono lokalne notatki do konta.");
    } catch (error) {
      toast.error("Nie udało się przenieść wszystkich lokalnych notatek.", {
        description: error instanceof Error ? error.message : "Lokalna kopia została zachowana.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const isSaving =
    createMutation.isPending ||
    updateTitleMutation.isPending ||
    updateContentMutation.isPending;

  // W widoku rozmowy pełny panel notatek jest częścią przestrzeni sprawy.
  // Poza czatem zachowujemy podręczny dostęp globalny.
  if (location === "/chat") return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        title="Moje notatki"
        aria-label="Otwórz moje notatki"
      >
        <StickyNote className="size-6" />
        {user && notes.length > 0 && (
          <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
            {notes.length > 9 ? "9+" : notes.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-xl border bg-card shadow-2xl sm:right-6">
          <Card className="max-h-[min(42rem,calc(100vh-8rem))] border-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-3">
              <div className="flex items-center gap-2">
                <StickyNote className="size-5 text-primary" />
                <CardTitle className="font-office text-lg">Moje notatki</CardTitle>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => setIsMinimized(value => !value)} aria-label="Zwiń notatki">
                  {isMinimized ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setIsOpen(false)} aria-label="Zamknij notatki">
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>

            {!isMinimized && (
              <CardContent className="flex max-h-[34rem] flex-col p-0">
                {loading ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">Sprawdzanie konta…</div>
                ) : !user ? (
                  <div className="space-y-3 p-5 text-center">
                    <p className="text-sm text-muted-foreground">Zaloguj się, aby notatki były zapisywane trwale i dostępne na każdym urządzeniu.</p>
                    <AccountAccess variant="inline" />
                  </div>
                ) : (
                  <>
                    {legacyNotes.length > 0 && (
                      <div className="m-3 rounded-lg border border-primary/20 bg-primary/[0.04] p-3 text-sm">
                        <p className="font-medium">Wykryto {legacyNotes.length} lokalne notatki.</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">Przenieś je do trwałej bazy tego konta. Lokalna kopia zostanie usunięta dopiero po pomyślnym imporcie.</p>
                        <Button className="mt-3" size="sm" onClick={() => void handleImportLegacyNotes()} disabled={isImporting}>
                          {isImporting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                          Przenieś do konta
                        </Button>
                      </div>
                    )}

                    <ScrollArea className="max-h-48 border-b">
                      <div className="space-y-2 p-3">
                        {isLoading ? (
                          <div className="flex justify-center py-5"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>
                        ) : notes.length === 0 ? (
                          <p className="py-5 text-center text-sm text-muted-foreground">Brak zapisanych notatek.</p>
                        ) : (
                          notes.map(note => (
                            <button
                              type="button"
                              key={note.id}
                              onClick={() => handleSelectNote(note)}
                              className={`w-full rounded-lg p-2.5 text-left text-sm transition-colors ${selectedNote?.id === note.id ? "border border-primary/30 bg-primary/[0.07]" : "bg-muted/40 hover:bg-muted"}`}
                            >
                              <span className="block truncate font-medium">{note.title}</span>
                              <span className="mt-1 block text-xs text-muted-foreground">{formatDate(note.updatedAt)}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </ScrollArea>

                    {isEditorOpen ? (
                      <div className="space-y-3 border-b p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{selectedNote ? "Edytujesz notatkę" : "Nowa notatka"}</p>
                          <Button variant="ghost" size="sm" onClick={resetEditor}>Anuluj</Button>
                        </div>
                        <Input value={title} onChange={event => setTitle(event.target.value)} placeholder="Tytuł notatki" />
                        <Textarea value={content} onChange={event => setContent(event.target.value)} placeholder="Treść notatki, ustalenie, kontakt lub termin…" className="min-h-24 resize-y" />
                        <div className="flex gap-2">
                          <Button className="flex-1" size="sm" onClick={() => void handleSave()} disabled={isSaving}>
                            {isSaving && <Loader2 className="size-4 animate-spin" />}
                            Zapisz
                          </Button>
                          {selectedNote && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => void handleCopy()}><Copy className="size-4" /></Button>
                              <Button variant="destructive" size="sm" onClick={() => void handleDelete()} disabled={deleteMutation.isPending}><Trash2 className="size-4" /></Button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="border-b p-3 text-sm text-muted-foreground">Wybierz notatkę, aby ją otworzyć, lub utwórz nową.</div>
                    )}

                    <div className="p-3">
                      <Button onClick={handleNewNote} size="sm" className="w-full">
                        <Plus className="size-4" /> Nowa notatka
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
