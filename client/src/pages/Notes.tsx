import StefanLayout from "@/components/StefanLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AccountAccess from "@/components/AccountAccess";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Bookmark, Pin, PinOff, Trash2, Pencil, Check, X,
  Search, Download, Loader2, Plus, Save, StickyNote, Tag
} from "lucide-react";
import { Streamdown } from "streamdown";

type Category = "ksef" | "klient" | "sprawa" | "preferencja" | "inne";

const CATEGORY_LABELS: Record<Category, string> = {
  ksef: "KSeF",
  klient: "Klient",
  sprawa: "Sprawa",
  preferencja: "Preferencja",
  inne: "Inne",
};

const CATEGORY_COLORS: Record<Category, string> = {
  ksef: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  klient: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  sprawa: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  preferencja: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  inne: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

// ─────────────────────────────────────────────────────────────────────────────
// Główny komponent
// ─────────────────────────────────────────────────────────────────────────────

export default function Notes() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"stefan" | "manual">("stefan");

  return (
    <StefanLayout>
      <div className="container max-w-4xl py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bookmark className="w-7 h-7 text-primary" />
            Moje Notatki
          </h1>
          <p className="text-muted-foreground mt-1">
            Notatki z odpowiedzi Stefana oraz własne notatki robocze.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "stefan" | "manual")}>
          <TabsList>
            <TabsTrigger value="stefan">
              <Bookmark className="w-4 h-4 mr-2" />
              Zapisane od Stefana
            </TabsTrigger>
            <TabsTrigger value="manual">
              <StickyNote className="w-4 h-4 mr-2" />
              Notatki własne
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stefan" className="mt-4">
            <StefanNotesPanel user={user} />
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <ManualNotesPanel />
          </TabsContent>
        </Tabs>
      </div>
    </StefanLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel: Notatki z odpowiedzi Stefana (DB)
// ─────────────────────────────────────────────────────────────────────────────

function StefanNotesPanel({ user }: { user: any }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const utils = trpc.useUtils();

  const { data: notes = [], isLoading } = trpc.notes.getAll.useQuery(undefined, {
    enabled: !!user,
  });

  const updateTitleMutation = trpc.notes.updateTitle.useMutation({
    onSuccess: () => {
      utils.notes.getAll.invalidate();
      setEditingId(null);
      toast.success("Tytuł zaktualizowany");
    },
    onError: (e) => toast.error("Błąd", { description: e.message }),
  });

  const updateCategoryMutation = trpc.notes.updateCategory.useMutation({
    onSuccess: () => {
      utils.notes.getAll.invalidate();
    },
    onError: (e) => toast.error("Błąd", { description: e.message }),
  });

  const togglePinMutation = trpc.notes.togglePin.useMutation({
    onSuccess: (data) => {
      utils.notes.getAll.invalidate();
      toast.success(data.isPinned ? "Notatka przypięta" : "Notatka odpięta");
    },
    onError: (e) => toast.error("Błąd", { description: e.message }),
  });

  const deleteMutation = trpc.notes.delete.useMutation({
    onSuccess: () => {
      utils.notes.getAll.invalidate();
      toast.success("Notatka usunięta");
    },
    onError: (e) => toast.error("Błąd", { description: e.message }),
  });

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (filterCategory !== "all") {
      result = result.filter(n => n.category === filterCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }
    return result;
  }, [notes, filterCategory, searchQuery]);

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.isPinned);

  const handleExportTxt = () => {
    if (notes.length === 0) { toast.error("Brak notatek"); return; }
    const lines = [
      "NOTATKI STEFANA",
      `Eksport: ${new Date().toLocaleDateString("pl-PL")}`,
      `Liczba: ${notes.length}`,
      "=".repeat(60),
      "",
      ...notes.flatMap(note => [
        `[${CATEGORY_LABELS[note.category as Category] ?? note.category}] ${note.title}`,
        `Data: ${new Date(note.createdAt).toLocaleDateString("pl-PL")}`,
        note.isPinned ? "📌 PRZYPIĘTA" : "",
        "-".repeat(40),
        note.content,
        "",
      ]).filter(Boolean),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stefan-notatki-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success(`Wyeksportowano ${notes.length} notatek`);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Zaloguj się, aby zobaczyć swoje notatki.</p>
          <AccountAccess variant="inline" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {notes.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj w notatkach..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as Category | "all")}>
            <SelectTrigger className="w-[150px]">
              <Tag className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
                <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportTxt}>
            <Download className="w-4 h-4 mr-2" />
            Eksport TXT
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && notes.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-3">
            <Bookmark className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground font-medium">Brak notatek</p>
            <p className="text-sm text-muted-foreground">
              W zakładce <strong>Chat z Ekspertem</strong> kliknij ikonę{" "}
              <Bookmark className="w-3 h-3 inline" /> przy odpowiedzi Stefana.
            </p>
          </CardContent>
        </Card>
      )}

      {/* No results */}
      {!isLoading && notes.length > 0 && filteredNotes.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Brak notatek pasujących do filtrów.
          </CardContent>
        </Card>
      )}

      {/* Przypięte */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Pin className="w-3 h-3" /> Przypięte
          </p>
          {pinnedNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              editingId={editingId}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              onStartEdit={(id, t) => { setEditingId(id); setEditTitle(t); }}
              onSaveTitle={(id) => updateTitleMutation.mutate({ noteId: id, title: editTitle.trim() })}
              onCancelEdit={() => setEditingId(null)}
              onTogglePin={() => togglePinMutation.mutate({ noteId: note.id })}
              onChangeCategory={(cat) => updateCategoryMutation.mutate({ noteId: note.id, category: cat })}
              onDelete={() => { if (confirm(`Usunąć "${note.title}"?`)) deleteMutation.mutate({ noteId: note.id }); }}
              isSavingTitle={updateTitleMutation.isPending && editingId === note.id}
            />
          ))}
        </div>
      )}

      {/* Pozostałe */}
      {unpinnedNotes.length > 0 && (
        <div className="space-y-3">
          {pinnedNotes.length > 0 && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pozostałe</p>
          )}
          {unpinnedNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              editingId={editingId}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              onStartEdit={(id, t) => { setEditingId(id); setEditTitle(t); }}
              onSaveTitle={(id) => updateTitleMutation.mutate({ noteId: id, title: editTitle.trim() })}
              onCancelEdit={() => setEditingId(null)}
              onTogglePin={() => togglePinMutation.mutate({ noteId: note.id })}
              onChangeCategory={(cat) => updateCategoryMutation.mutate({ noteId: note.id, category: cat })}
              onDelete={() => { if (confirm(`Usunąć "${note.title}"?`)) deleteMutation.mutate({ noteId: note.id }); }}
              isSavingTitle={updateTitleMutation.isPending && editingId === note.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel: Notatki własne (localStorage — zachowany stary edytor)
// ─────────────────────────────────────────────────────────────────────────────

interface ManualNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

function ManualNotesPanel() {
  const [notes, setNotes] = useState<ManualNote[]>(() => {
    try {
      const saved = localStorage.getItem("stefan_notes");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [selectedNote, setSelectedNote] = useState<ManualNote | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const saveToStorage = (updated: ManualNote[]) => {
    setNotes(updated);
    localStorage.setItem("stefan_notes", JSON.stringify(updated));
  };

  const handleNew = () => { setSelectedNote(null); setTitle(""); setContent(""); };

  const handleSave = () => {
    if (!title.trim()) { toast.error("Podaj tytuł notatki"); return; }
    if (selectedNote) {
      const updated = notes.map(n =>
        n.id === selectedNote.id ? { ...n, title, content, updatedAt: new Date().toISOString() } : n
      );
      saveToStorage(updated);
      toast.success("Notatka zaktualizowana");
    } else {
      const newNote: ManualNote = {
        id: Date.now().toString(), title, content,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      saveToStorage([newNote, ...notes]);
      toast.success("Notatka utworzona");
    }
    handleNew();
  };

  const handleDelete = (id: string) => {
    if (!confirm("Usunąć notatkę?")) return;
    saveToStorage(notes.filter(n => n.id !== id));
    if (selectedNote?.id === id) handleNew();
    toast.success("Notatka usunięta");
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pl-PL", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="flex gap-4 min-h-[500px]">
      {/* Lista */}
      <div className="w-64 flex-shrink-0 space-y-2">
        <Button onClick={handleNew} className="w-full" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Nowa notatka
        </Button>
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Brak notatek własnych
          </div>
        ) : (
          notes.map(note => (
            <Card
              key={note.id}
              className={`cursor-pointer transition-colors ${selectedNote?.id === note.id ? "bg-accent" : "hover:bg-muted/50"}`}
              onClick={() => { setSelectedNote(note); setTitle(note.title); setContent(note.content); }}
            >
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium truncate">{note.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{formatDate(note.updatedAt)}</p>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Edytor */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{selectedNote ? "Edytuj notatkę" : "Nowa notatka"}</h2>
          <div className="flex gap-2">
            {selectedNote && (
              <Button variant="outline" size="sm" onClick={() => handleDelete(selectedNote.id)}>
                <Trash2 className="w-4 h-4 mr-1" /> Usuń
              </Button>
            )}
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-1" /> Zapisz
            </Button>
          </div>
        </div>
        <Input
          placeholder="Tytuł notatki..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          placeholder="Treść notatki..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={18}
          className="resize-none"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NoteCard — karta notatki z odpowiedzi Stefana
// ─────────────────────────────────────────────────────────────────────────────

interface NoteCardProps {
  note: {
    id: number;
    title: string;
    content: string;
    category: string;
    isPinned: boolean;
    createdAt: Date | string;
    sessionId?: number | null;
  };
  editingId: number | null;
  editTitle: string;
  setEditTitle: (v: string) => void;
  onStartEdit: (id: number, title: string) => void;
  onSaveTitle: (id: number) => void;
  onCancelEdit: () => void;
  onTogglePin: () => void;
  onChangeCategory: (cat: Category) => void;
  onDelete: () => void;
  isSavingTitle: boolean;
}

function NoteCard({
  note, editingId, editTitle, setEditTitle,
  onStartEdit, onSaveTitle, onCancelEdit,
  onTogglePin, onChangeCategory, onDelete, isSavingTitle,
}: NoteCardProps) {
  const isEditing = editingId === note.id;
  const cat = note.category as Category;
  const formatDate = (d: Date | string) =>
    new Date(d).toLocaleDateString("pl-PL", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <Card className={`transition-shadow hover:shadow-md ${note.isPinned ? "border-primary/30" : ""}`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveTitle(note.id);
                    if (e.key === "Escape") onCancelEdit();
                  }}
                  className="h-7 text-sm font-semibold"
                  autoFocus
                />
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onSaveTitle(note.id)} disabled={isSavingTitle}>
                  {isSavingTitle ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 text-green-600" />}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onCancelEdit}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CardTitle className="text-base leading-tight truncate">{note.title}</CardTitle>
                <button onClick={() => onStartEdit(note.id, note.title)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0" title="Edytuj tytuł">
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={onTogglePin} title={note.isPinned ? "Odepnij" : "Przypnij"} className="text-muted-foreground hover:text-primary transition-colors p-1">
              {note.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>
            <button onClick={onDelete} title="Usuń" className="text-muted-foreground hover:text-destructive transition-colors p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <Select value={cat} onValueChange={(v) => onChangeCategory(v as Category)}>
            <SelectTrigger className="h-5 w-auto border-0 p-0 text-xs gap-1 bg-transparent focus:ring-0 shadow-none">
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.inne}`}>
                {CATEGORY_LABELS[cat] ?? cat}
              </span>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map(c => (
                <SelectItem key={c} value={c} className="text-xs">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[c]}`}>{CATEGORY_LABELS[c]}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</span>
          {note.sessionId && <span className="text-xs text-muted-foreground">· Sesja #{note.sessionId}</span>}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <div className="prose prose-sm max-w-none dark:prose-invert text-sm leading-relaxed max-h-48 overflow-y-auto">
          <Streamdown>{note.content}</Streamdown>
        </div>
      </CardContent>
    </Card>
  );
}
