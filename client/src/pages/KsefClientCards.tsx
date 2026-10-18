import { useState, useMemo } from "react";
import StefanLayout from "@/components/StefanLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { loadJaroDevilSignatureDataUrl } from "@/lib/brandSignature";
import { Plus, Search, FileText, Printer, Pencil, Trash2, Building2, CheckCircle2, Clock, AlertCircle, XCircle, Download } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ImplementationStatus = "not_started" | "in_progress" | "completed" | "issues";
type ObligationType = "mandatory_large" | "mandatory_standard" | "voluntary" | "exempt";
type AuthMethod = "token" | "qualified_sig" | "trusted_sig" | "not_set";

interface ChecklistState {
  systemIntegrated: boolean;
  testsDone: boolean;
  staffTrained: boolean;
  backupProcedure: boolean;
  offlineConfigured: boolean;
  firstInvoiceSent: boolean;
}

const DEFAULT_CHECKLIST: ChecklistState = {
  systemIntegrated: false,
  testsDone: false,
  staffTrained: false,
  backupProcedure: false,
  offlineConfigured: false,
  firstInvoiceSent: false,
};

const STATUS_CONFIG: Record<ImplementationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  not_started: { label: "Nie rozpoczęto", color: "bg-gray-100 text-gray-700 border-gray-200", icon: <XCircle className="w-3 h-3" /> },
  in_progress:  { label: "W trakcie",     color: "bg-blue-100 text-blue-700 border-blue-200",  icon: <Clock className="w-3 h-3" /> },
  completed:    { label: "Zakończone",    color: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle2 className="w-3 h-3" /> },
  issues:       { label: "Problemy",      color: "bg-red-100 text-red-700 border-red-200",      icon: <AlertCircle className="w-3 h-3" /> },
};

const OBLIGATION_LABELS: Record<ObligationType, string> = {
  mandatory_large:    "Duży podatnik (> 200 mln PLN) — od 01.02.2026",
  mandatory_standard: "Standardowy — od 01.04.2026",
  voluntary:          "Dobrowolny",
  exempt:             "Zwolniony z KSeF",
};

const AUTH_LABELS: Record<AuthMethod, string> = {
  token:         "Token KSeF",
  qualified_sig: "Podpis kwalifikowany",
  trusted_sig:   "Podpis zaufany (ePUAP)",
  not_set:       "Nie ustalono",
};

const CHECKLIST_LABELS: Record<keyof ChecklistState, string> = {
  systemIntegrated:  "System ERP/FK zintegrowany z KSeF",
  testsDone:         "Testy wystawienia faktur w środowisku testowym",
  staffTrained:      "Pracownicy przeszkoleni z obsługi KSeF",
  backupProcedure:   "Procedura awaryjnego wystawiania faktur (offline24)",
  offlineConfigured: "Skonfigurowany tryb offline w systemie",
  firstInvoiceSent:  "Pierwsza faktura produkcyjna wysłana przez KSeF",
};

function ClientDocuments({ clientCardId }: { clientCardId: number }) {
  const { data: documents = [] } = trpc.documents.getByClient.useQuery({ clientCardId });
  if (documents.length === 0) return null;

  return (
    <div className="border-t pt-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Dokumenty klienta ({documents.length})
      </p>
      <div className="space-y-1.5">
        {documents.slice(0, 3).map((document) => (
          <div key={document.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-xs">
            <span className="min-w-0 truncate"><FileText className="mr-1 inline h-3 w-3" />{document.templateTitle}</span>
            <Badge variant="outline" className="shrink-0 text-[10px]">{document.status === "final" ? "finalny" : document.status === "archived" ? "archiwum" : "roboczy"}</Badge>
          </div>
        ))}
      </div>
      {documents.length > 3 && <p className="text-xs text-muted-foreground">+ {documents.length - 3} kolejnych dokumentów</p>}
    </div>
  );
}

// ─── PDF Export ──────────────────────────────────────────────────────────────

async function exportToPdf(card: any, checklist: ChecklistState) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const signatureDataUrl = await loadJaroDevilSignatureDataUrl();

  const margin = 20;
  let y = margin;
  const pageW = 210;
  const contentW = pageW - 2 * margin;

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("KARTA WDROŻENIA KSeF", margin, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Krajowy System e-Faktur — Kancelaria Prawna KancelariAI", margin, 20);
  doc.text(`Wygenerowano: ${new Date().toLocaleDateString("pl-PL")}`, pageW - margin, 20, { align: "right" });

  y = 38;
  doc.setTextColor(0, 0, 0);

  // Section helper
  const section = (title: string) => {
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, contentW, 7, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text(title, margin + 2, y + 5);
    doc.setTextColor(0, 0, 0);
    y += 10;
  };

  const row = (label: string, value: string) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(label + ":", margin, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value || "—", contentW - 55);
    doc.text(lines, margin + 55, y);
    y += Math.max(6, lines.length * 5);
  };

  // 1. Dane klienta
  section("1. DANE IDENTYFIKACYJNE KLIENTA");
  row("Nazwa / Firma", card.clientName);
  row("NIP", card.nip);
  row("Adres", card.address || "—");
  row("Właściwy Naczelnik US", card.taxOffice || "—");
  row("E-mail kontaktowy", card.contactEmail || "—");
  row("Telefon", card.contactPhone || "—");
  y += 2;

  // 2. Status wdrożenia
  section("2. STATUS WDROŻENIA KSeF");
  row("Status", STATUS_CONFIG[card.implementationStatus as ImplementationStatus]?.label || card.implementationStatus);
  row("Typ obowiązku", OBLIGATION_LABELS[card.obligationType as ObligationType] || card.obligationType || "—");
  row("Data obowiązku KSeF", card.obligationDate || "—");
  row("Metoda uwierzytelnienia", AUTH_LABELS[card.authMethod as AuthMethod] || card.authMethod || "—");
  y += 2;

  // 3. Uprawnienia ZAW-FA
  section("3. UPRAWNIENIA BIURA RACHUNKOWEGO (ZAW-FA)");
  row("ZAW-FA złożone", card.zawFaGranted ? "TAK ✓" : "NIE ✗");
  if (card.zawFaGranted && card.zawFaDate) {
    row("Data złożenia ZAW-FA", card.zawFaDate);
  }
  y += 2;

  // 4. Check-lista
  section("4. CHECK-LISTA WDROŻENIA");
  doc.setFontSize(9);
  Object.entries(CHECKLIST_LABELS).forEach(([key, label]) => {
    const done = checklist[key as keyof ChecklistState];
    doc.setFont("helvetica", "normal");
    doc.text(done ? "☑" : "☐", margin + 2, y);
    doc.text(label, margin + 10, y);
    if (done) {
      doc.setTextColor(22, 163, 74);
      doc.text("✓", margin + contentW - 5, y);
      doc.setTextColor(0, 0, 0);
    }
    y += 6;
  });
  y += 2;

  // 5. Notatki
  if (card.notes) {
    section("5. NOTATKI");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(card.notes, contentW - 4);
    doc.text(noteLines, margin + 2, y);
    y += noteLines.length * 5 + 4;
  }

  // Footer
  const footerY = 287;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, footerY - 4, pageW - margin, footerY - 4);
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  if (signatureDataUrl) {
    doc.addImage(signatureDataUrl, "PNG", margin, footerY - 14, 22, 11);
  }
  const signatureOffset = signatureDataUrl ? 25 : 0;
  doc.text("Dokument wygenerowany przez System Stefan v5.8.0 | KancelariaAI | Autor: Pasternak Jarek", margin + signatureOffset, footerY);
  doc.text("Podstawa prawna: art. 106na ustawy o VAT | Weryfikacja: ksef.podatki.gov.pl", margin, footerY + 4);

  doc.save(`KSeF_${card.clientName.replace(/\s+/g, "_")}_${card.nip}.pdf`);
}

// ─── Form Component ───────────────────────────────────────────────────────────

interface CardFormProps {
  initial?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

function CardForm({ initial, onSave, onCancel, loading }: CardFormProps) {
  const [form, setForm] = useState({
    clientName: initial?.clientName || "",
    nip: initial?.nip || "",
    address: initial?.address || "",
    taxOffice: initial?.taxOffice || "",
    contactEmail: initial?.contactEmail || "",
    contactPhone: initial?.contactPhone || "",
    implementationStatus: (initial?.implementationStatus || "not_started") as ImplementationStatus,
    obligationDate: initial?.obligationDate || "",
    obligationType: (initial?.obligationType || "mandatory_standard") as ObligationType,
    authMethod: (initial?.authMethod || "not_set") as AuthMethod,
    zawFaGranted: initial?.zawFaGranted || false,
    zawFaDate: initial?.zawFaDate || "",
    notes: initial?.notes || "",
  });

  const [checklist, setChecklist] = useState<ChecklistState>(() => {
    try {
      return initial?.checklistJson ? JSON.parse(initial.checklistJson) : { ...DEFAULT_CHECKLIST };
    } catch {
      return { ...DEFAULT_CHECKLIST };
    }
  });

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = () => {
    if (!form.clientName.trim() || !form.nip.trim()) return;
    onSave({ ...form, checklistJson: JSON.stringify(checklist) });
  };

  return (
    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      {/* Dane klienta */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Dane klienta</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="clientName">Nazwa / Firma *</Label>
            <Input id="clientName" value={form.clientName} onChange={e => set("clientName", e.target.value)} placeholder="np. ABC Sp. z o.o." />
          </div>
          <div>
            <Label htmlFor="nip">NIP *</Label>
            <Input id="nip" value={form.nip} onChange={e => set("nip", e.target.value)} placeholder="1234567890" maxLength={13} />
          </div>
          <div>
            <Label htmlFor="contactPhone">Telefon</Label>
            <Input id="contactPhone" value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} placeholder="+48 500 000 000" />
          </div>
          <div className="col-span-2">
            <Label htmlFor="address">Adres</Label>
            <Input id="address" value={form.address} onChange={e => set("address", e.target.value)} placeholder="ul. Przykładowa 1, 00-001 Warszawa" />
          </div>
          <div>
            <Label htmlFor="taxOffice">Właściwy Naczelnik US</Label>
            <Input id="taxOffice" value={form.taxOffice} onChange={e => set("taxOffice", e.target.value)} placeholder="np. US Warszawa-Mokotów" />
          </div>
          <div>
            <Label htmlFor="contactEmail">E-mail kontaktowy</Label>
            <Input id="contactEmail" type="email" value={form.contactEmail} onChange={e => set("contactEmail", e.target.value)} placeholder="biuro@firma.pl" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Status wdrożenia */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Status wdrożenia KSeF</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Status</Label>
            <Select value={form.implementationStatus} onValueChange={v => set("implementationStatus", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                  <SelectItem key={v} value={v}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="obligationDate">Data obowiązku KSeF</Label>
            <Input id="obligationDate" value={form.obligationDate} onChange={e => set("obligationDate", e.target.value)} placeholder="np. 2026-04-01" />
          </div>
          <div className="col-span-2">
            <Label>Typ obowiązku</Label>
            <Select value={form.obligationType} onValueChange={v => set("obligationType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(OBLIGATION_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Metoda uwierzytelnienia w KSeF</Label>
            <Select value={form.authMethod} onValueChange={v => set("authMethod", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(AUTH_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* ZAW-FA */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Uprawnienia biura rachunkowego (ZAW-FA)</h3>
        <div className="flex items-center gap-3 mb-2">
          <Checkbox id="zawFaGranted" checked={form.zawFaGranted} onCheckedChange={v => set("zawFaGranted", !!v)} />
          <Label htmlFor="zawFaGranted" className="cursor-pointer">ZAW-FA złożone (nadano uprawnienia biuru rachunkowemu)</Label>
        </div>
        {form.zawFaGranted && (
          <div>
            <Label htmlFor="zawFaDate">Data złożenia ZAW-FA</Label>
            <Input id="zawFaDate" value={form.zawFaDate} onChange={e => set("zawFaDate", e.target.value)} placeholder="np. 2026-03-15" className="max-w-xs" />
          </div>
        )}
      </div>

      <Separator />

      {/* Check-lista */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Check-lista wdrożenia</h3>
        <div className="space-y-2">
          {(Object.keys(CHECKLIST_LABELS) as (keyof ChecklistState)[]).map(key => (
            <div key={key} className="flex items-center gap-3">
              <Checkbox
                id={`cl_${key}`}
                checked={checklist[key]}
                onCheckedChange={v => setChecklist(c => ({ ...c, [key]: !!v }))}
              />
              <Label htmlFor={`cl_${key}`} className="cursor-pointer text-sm">{CHECKLIST_LABELS[key]}</Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Notatki */}
      <div>
        <Label htmlFor="notes">Notatki</Label>
        <Textarea id="notes" value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Dodatkowe informacje, uwagi, historia kontaktu..." rows={3} />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Anuluj</Button>
        <Button onClick={handleSubmit} disabled={loading || !form.clientName.trim() || !form.nip.trim()}>
          {loading ? "Zapisuję..." : initial ? "Zapisz zmiany" : "Utwórz kartę"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KsefClientCards() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ImplementationStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editCard, setEditCard] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: cards = [], isLoading } = trpc.ksef.getClientCards.useQuery(
    { search: search || undefined, status: filterStatus !== "all" ? filterStatus : undefined },
    { refetchOnWindowFocus: false }
  );

  const createMutation = trpc.ksef.createClientCard.useMutation({
    onSuccess: () => {
      utils.ksef.getClientCards.invalidate();
      setShowForm(false);
      toast({ title: "Karta utworzona", description: "Karta wdrożenia KSeF została zapisana." });
    },
    onError: (e) => toast({ title: "Błąd", description: e.message, variant: "destructive" }),
  });

  const updateMutation = trpc.ksef.updateClientCard.useMutation({
    onSuccess: () => {
      utils.ksef.getClientCards.invalidate();
      setEditCard(null);
      toast({ title: "Zapisano", description: "Karta zaktualizowana." });
    },
    onError: (e) => toast({ title: "Błąd", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = trpc.ksef.deleteClientCard.useMutation({
    onSuccess: () => {
      utils.ksef.getClientCards.invalidate();
      setDeleteId(null);
      toast({ title: "Usunięto", description: "Karta klienta została usunięta." });
    },
    onError: (e) => toast({ title: "Błąd", description: e.message, variant: "destructive" }),
  });

  const handleExportPdf = async (card: any) => {
    try {
      const checklist: ChecklistState = card.checklistJson ? JSON.parse(card.checklistJson) : { ...DEFAULT_CHECKLIST };
      await exportToPdf(card, checklist);
      toast({ title: "PDF wygenerowany", description: `Karta ${card.clientName} pobrana.` });
    } catch (e: any) {
      toast({ title: "Błąd PDF", description: e.message, variant: "destructive" });
    }
  };

  const completionRate = (card: any) => {
    try {
      const cl: ChecklistState = card.checklistJson ? JSON.parse(card.checklistJson) : DEFAULT_CHECKLIST;
      const done = Object.values(cl).filter(Boolean).length;
      return Math.round((done / 6) * 100);
    } catch { return 0; }
  };

  const stats = useMemo(() => ({
    total: cards.length,
    completed: cards.filter(c => c.implementationStatus === "completed").length,
    inProgress: cards.filter(c => c.implementationStatus === "in_progress").length,
    issues: cards.filter(c => c.implementationStatus === "issues").length,
  }), [cards]);

  return (
    <StefanLayout>
      <div className="container max-w-7xl py-8 lg:py-10 space-y-6">

        {/* Header */}
        <section className="office-hero flex flex-col gap-5 rounded-2xl border border-primary/15 px-6 py-7 lg:flex-row lg:items-start lg:justify-between lg:px-8">
          <div className="max-w-3xl">
            <div className="office-eyebrow mb-3"><Building2 className="size-4" />KSeF · obsługa klientów</div>
            <h1 className="font-office text-3xl font-semibold tracking-tight text-foreground">Karty wdrożenia KSeF</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Check-lista wdrożenia KSeF dla klientów kancelarii — z eksportem PDF gotowym do wysłania
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2 self-start">
            <Plus className="w-4 h-4" /> Nowa karta
          </Button>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Wszystkich klientów", value: stats.total, color: "text-foreground" },
            { label: "Wdrożenie zakończone", value: stats.completed, color: "text-green-600" },
            { label: "W trakcie", value: stats.inProgress, color: "text-blue-600" },
            { label: "Problemy", value: stats.issues, color: "text-red-600" },
          ].map(s => (
            <Card key={s.label} className="border-border bg-card p-4 shadow-sm">
              <p className={`font-office text-3xl font-semibold ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Szukaj po nazwie klienta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={v => setFilterStatus(v as any)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie statusy</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                <SelectItem key={v} value={v}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cards list */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Ładowanie kart klientów...</div>
        ) : cards.length === 0 ? (
          <Card className="border-dashed p-12 text-center shadow-none">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-medium">Brak kart klientów</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search || filterStatus !== "all" ? "Brak wyników dla wybranych filtrów." : "Kliknij \"Nowa karta\" aby dodać pierwszego klienta."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {cards.map(card => {
              const status = STATUS_CONFIG[card.implementationStatus as ImplementationStatus];
              const rate = completionRate(card);
              return (
                <Card key={card.id} className="office-resource border-border bg-card shadow-sm">
                  <CardHeader className="border-b border-border/80 bg-muted/25 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="font-office text-lg truncate">{card.clientName}</CardTitle>
                        <p className="text-sm text-muted-foreground font-mono">NIP: {card.nip}</p>
                      </div>
                      <Badge variant="outline" className={`shrink-0 flex items-center gap-1 ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Info row */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {card.obligationDate && (
                        <div><span className="text-muted-foreground">Obowiązek: </span>{card.obligationDate}</div>
                      )}
                      {card.authMethod && card.authMethod !== "not_set" && (
                        <div><span className="text-muted-foreground">Auth: </span>{AUTH_LABELS[card.authMethod as AuthMethod]}</div>
                      )}
                      {card.taxOffice && (
                        <div className="col-span-2 truncate"><span className="text-muted-foreground">US: </span>{card.taxOffice}</div>
                      )}
                    </div>

                    {/* ZAW-FA badge */}
                    {card.zawFaGranted && (
                      <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        ZAW-FA złożone {card.zawFaDate ? `(${card.zawFaDate})` : ""}
                      </div>
                    )}

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Check-lista wdrożenia</span>
                        <span>{rate}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${rate === 100 ? "bg-green-500" : rate > 50 ? "bg-blue-500" : "bg-orange-400"}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>

                    <ClientDocuments clientCardId={card.id} />

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => handleExportPdf(card)}>
                        <Download className="w-3 h-3" /> PDF
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => window.print()}>
                        <Printer className="w-3 h-3" /> Drukuj
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => setEditCard(card)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-red-600 hover:text-red-700" onClick={() => setDeleteId(card.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nowa karta wdrożenia KSeF</DialogTitle>
          </DialogHeader>
          <CardForm
            onSave={(data) => createMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
            loading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editCard} onOpenChange={open => !open && setEditCard(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edytuj kartę: {editCard?.clientName}</DialogTitle>
          </DialogHeader>
          {editCard && (
            <CardForm
              initial={editCard}
              onSave={(data) => updateMutation.mutate({ id: editCard.id, ...data })}
              onCancel={() => setEditCard(null)}
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Usuń kartę klienta</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Czy na pewno chcesz usunąć tę kartę? Operacja jest nieodwracalna.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Anuluj</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Usuwam..." : "Usuń"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StefanLayout>
  );
}
