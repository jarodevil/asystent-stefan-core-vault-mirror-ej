import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { JARODEVIL_SIGNATURE_URL } from "@/lib/brandSignature";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Printer, Download, Save, X, FileText, User, CheckCircle2,
  Loader2, BookOpen, AlertTriangle, Archive
} from "lucide-react";

export interface DocumentPreviewData {
  templateId: string;
  templateTitle: string;
  category: string;
  content: string;
  legalBasis?: string;
  fieldValues?: Record<string, unknown>;
}

interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  document: DocumentPreviewData | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Główny modal
// ─────────────────────────────────────────────────────────────────────────────

export default function DocumentPreviewModal({
  open,
  onClose,
  document,
}: DocumentPreviewModalProps) {
  const { user } = useAuth();
  const [savedDocId, setSavedDocId] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  const utils = trpc.useUtils();

  // Pobierz karty klientów do przypisania
  const { data: clientCards = [] } = trpc.ksef.getClientCards.useQuery(undefined, {
    enabled: !!user && open,
  });

  const saveMutation = trpc.documents.save.useMutation({
    onSuccess: (result) => {
      setSavedDocId(result.id);
      setIsSaved(true);
      utils.documents.getAll.invalidate();
      toast.success("Dokument zapisany w bazie danych");
    },
    onError: (e) => toast.error("Błąd zapisu", { description: e.message }),
  });

  const assignMutation = trpc.documents.assignToClient.useMutation({
    onSuccess: () => {
      utils.documents.getAll.invalidate();
      if (selectedClientId) {
        utils.documents.getByClient.invalidate({ clientCardId: Number(selectedClientId) });
      }
      toast.success("Dokument przypisany do klienta");
      setIsAssigning(false);
    },
    onError: (e) => {
      toast.error("Błąd przypisania", { description: e.message });
      setIsAssigning(false);
    },
  });

  if (!document) return null;

  // ── Druk ──────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) { toast.error("Zablokowano otwarcie okna druku"); return; }

    const now = new Date().toLocaleString("pl-PL");
    const html = buildPrintHtml(document, now, JARODEVIL_SIGNATURE_URL);
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
    toast.success("Otwarto okno druku");
  };

  // ── Pobierz TXT ───────────────────────────────────────────────────────────
  const handleDownloadTxt = () => {
    const blob = new Blob([document.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${document.templateId}-${new Date().toISOString().split("T")[0]}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Pobrano plik TXT");
  };

  // ── Zapisz do DB ──────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!user) { toast.error("Zaloguj się, aby zapisać dokument"); return; }
    saveMutation.mutate({
      templateId: document.templateId,
      templateTitle: document.templateTitle,
      category: document.category,
      content: document.content,
      fieldValues: document.fieldValues,
      legalBasis: document.legalBasis,
    });
  };

  // ── Przypisz do klienta ───────────────────────────────────────────────────
  const handleAssignToClient = () => {
    if (!selectedClientId || !savedDocId) return;
    const card = clientCards.find((c: any) => c.id.toString() === selectedClientId);
    if (!card) return;
    setIsAssigning(true);
    assignMutation.mutate({
      docId: savedDocId,
      clientCardId: card.id,
      clientName: card.clientName,
      clientNip: card.nip,
    });
  };

  // ── Zamknij ───────────────────────────────────────────────────────────────
  const handleClose = () => {
    setSavedDocId(null);
    setIsSaved(false);
    setNotes("");
    setSelectedClientId("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Nagłówek */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <DialogTitle className="text-base font-semibold leading-tight">
                  {document.templateTitle}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{document.category}</Badge>
                  {document.legalBasis && (
                    <span className="text-xs font-mono text-muted-foreground">{document.legalBasis}</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 mt-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        {/* Treść dokumentu — scrollowalna */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {/* Nota prawna — nagłówek dokumentu */}
          <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Dokument wygenerowany przez System Stefan</strong> na podstawie aktualnych przepisów prawa.
                Przed użyciem zweryfikuj zgodność z najnowszymi zmianami legislacyjnymi.
                Wygenerowano: {new Date().toLocaleString("pl-PL")}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-blue-200/70 pt-2 dark:border-blue-800/70">
              <img src={JARODEVIL_SIGNATURE_URL} alt="Sygnatura Jaro'Devil" className="h-7 w-auto object-contain" />
              <span className="text-xs text-blue-800 dark:text-blue-200">Sygnatura dokumentu: Jaro&apos;Devil — Pasternak Jarek</span>
            </div>
          </div>

          {/* Treść dokumentu */}
          <div
            className="bg-white dark:bg-gray-950 border border-border rounded-lg p-6 shadow-sm"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-gray-100 font-sans">
              {document.content}
            </pre>
          </div>

          {/* Stopka prawna */}
          <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Zastrzeżenie prawne:</strong> Niniejszy dokument ma charakter wzorcowy i informacyjny.
                Nie stanowi porady prawnej ani podatkowej w rozumieniu ustawy z dnia 5 lipca 2002 r.
                o świadczeniu usług drogą elektroniczną. Przed złożeniem do urzędu skonsultuj z
                doradcą podatkowym lub radcą prawnym.
              </p>
            </div>
          </div>

          {/* Sekcja zapisu do klienta — widoczna po zapisaniu */}
          {isSaved && savedDocId && clientCards.length > 0 && (
            <div className="mt-4 p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Dokument zapisany — przypisz do klienta (opcjonalnie)
                </p>
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">Wybierz kartę klienta</Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger className="h-8 text-sm">
                      <User className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Wybierz klienta..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clientCards.map((c: any) => (
                        <SelectItem key={c.id} value={c.id.toString()} className="text-sm">
                          {c.clientName} — {c.nip}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  onClick={handleAssignToClient}
                  disabled={!selectedClientId || isAssigning}
                  className="h-8"
                >
                  {isAssigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <User className="w-3.5 h-3.5" />}
                  <span className="ml-1.5">Przypisz</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Pasek akcji — stały na dole */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-muted/30">
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <div className="flex gap-2 flex-wrap">
              {/* Druk / PDF */}
              <Button onClick={handlePrint} variant="default" size="sm" className="gap-1.5">
                <Printer className="w-4 h-4" />
                Drukuj / PDF
              </Button>
              {/* Pobierz TXT */}
              <Button onClick={handleDownloadTxt} variant="outline" size="sm" className="gap-1.5">
                <Download className="w-4 h-4" />
                Pobierz TXT
              </Button>
              {/* Zapisz do bazy */}
              {!isSaved ? (
                <Button
                  onClick={handleSave}
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={saveMutation.isPending || !user}
                >
                  {saveMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Save className="w-4 h-4" />
                  }
                  {user ? "Zapisz w bazie" : "Zaloguj się, aby zapisać"}
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="gap-1.5 text-green-600 border-green-300" disabled>
                  <CheckCircle2 className="w-4 h-4" />
                  Zapisano
                </Button>
              )}
            </div>
            <Button onClick={handleClose} variant="ghost" size="sm">
              Zamknij
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: buduje HTML do druku
// ─────────────────────────────────────────────────────────────────────────────

function buildPrintHtml(doc: DocumentPreviewData, generatedAt: string, signatureUrl: string): string {
  const escaped = doc.content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<title>${doc.templateTitle}</title>
<style>
  @page { margin: 2.5cm 2cm; size: A4; }
  body {
    font-family: Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #000;
    margin: 0;
    padding: 0;
  }
  .header {
    border-bottom: 2px solid #1a3a5c;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  .header-title {
    font-size: 14pt;
    font-weight: bold;
    color: #1a3a5c;
    margin: 0 0 4px 0;
  }
  .header-meta {
    font-size: 9pt;
    color: #555;
  }
  .content {
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 11pt;
    line-height: 1.7;
  }
  .footer {
    margin-top: 30px;
    padding-top: 12px;
    border-top: 1px solid #ccc;
    font-size: 8pt;
    color: #777;
  }
  .signature {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    color: #555;
  }
  .signature img { max-height: 26px; max-width: 120px; object-fit: contain; }
  .legal-note {
    margin-top: 20px;
    padding: 10px;
    border: 1px solid #e0a800;
    background: #fffbea;
    font-size: 8.5pt;
    color: #555;
  }
  @media print {
    .no-print { display: none; }
  }
</style>
</head>
<body>
<div class="header">
  <p class="header-title">${doc.templateTitle}</p>
  <p class="header-meta">
    Kategoria: ${doc.category}
    ${doc.legalBasis ? ` | Podstawa prawna: ${doc.legalBasis}` : ""}
    | Wygenerowano: ${generatedAt}
    | System Stefan — KancelariaAI
  </p>
</div>

<div class="content">${escaped}</div>

<div class="legal-note">
  <strong>Zastrzeżenie prawne:</strong> Niniejszy dokument ma charakter wzorcowy i informacyjny.
  Nie stanowi porady prawnej ani podatkowej. Przed złożeniem do urzędu skonsultuj z doradcą podatkowym lub radcą prawnym.
</div>

<div class="footer">
  <div class="signature"><img src="${signatureUrl}" alt="Sygnatura Jaro'Devil" /> <span>Jaro&apos;Devil — Pasternak Jarek</span></div>
  KancelariaAI — System Stefan v5.8 | © ${new Date().getFullYear()} | Wygenerowano: ${generatedAt}
</div>
</body>
</html>`;
}
