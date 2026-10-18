import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import StefanLayout from "@/components/StefanLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Send,
  RotateCcw,
  Info,
  Shield,
  BookOpen,
  Calculator,
  ClipboardList,
  Download,
  Printer,
  ChevronRight,
  ChevronLeft,
  Bell,
  BellOff,
  RefreshCw,
  CheckCheck,
  Rss,
  MessageSquare,
  Gavel,
} from "lucide-react";
import DocumentPreviewModal, { type DocumentPreviewData } from "@/components/DocumentPreviewModal";

// -----------------------------------------------------------------------
// Types mirrored from server/ksef-knowledge.ts (no import across boundary)
// -----------------------------------------------------------------------
interface TimelineEntry {
  date: string;
  description: string;
  legalBasis: string;
  affectedEntities: string;
}

interface ObligationResult {
  isObligated: boolean;
  obligationDate: string | null;
  reason: string;
  legalBasis: string;
  exceptions: string[];
  nextSteps: string[];
}

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isDatePast(iso: string) {
  return new Date(iso) <= new Date();
}

function isDateSoon(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000; // within 90 days
}

// -----------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------

function TimelineSection() {
  const { data: timeline, isLoading } = trpc.ksef.getTimeline.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(timeline || []).map((entry: TimelineEntry, idx: number) => {
        const past = isDatePast(entry.date);
        const soon = isDateSoon(entry.date);
        return (
          <div
            key={idx}
            className={`relative pl-5 border-l-2 pb-4 ${
              past
                ? "border-green-500"
                : soon
                ? "border-amber-500"
                : "border-border"
            }`}
          >
            <div
              className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${
                past
                  ? "bg-green-500 border-green-500"
                  : soon
                  ? "bg-amber-500 border-amber-500"
                  : "bg-background border-muted-foreground"
              }`}
            />
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground">
                {formatDate(entry.date)}
              </span>
              {past && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Obowiązuje
                </Badge>
              )}
              {soon && !past && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  Wkrótce
                </Badge>
              )}
              {!past && !soon && (
                <Badge variant="outline" className="text-xs">
                  Przyszłość
                </Badge>
              )}
            </div>
            <p className="text-sm text-foreground font-medium">{entry.description}</p>
            <p className="text-xs text-muted-foreground mt-1">{entry.affectedEntities}</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono">{entry.legalBasis}</p>
          </div>
        );
      })}
    </div>
  );
}

function ObligationChecker() {
  const { toast } = useToast();
  const [annualSales, setAnnualSales] = useState("");
  const [monthlySales, setMonthlySales] = useState("");
  const [hasPolishSeat, setHasPolishSeat] = useState<"yes" | "no">("yes");
  const [isVatPayer, setIsVatPayer] = useState<"yes" | "no">("yes");
  const [transactionType, setTransactionType] = useState<"b2b" | "b2c" | "b2g">("b2b");
  const [specialProcedure, setSpecialProcedure] = useState<"oss_non_eu" | "ioss" | "sme" | "none">("none");
  const [result, setResult] = useState<ObligationResult | null>(null);

  const checkMutation = trpc.ksef.checkObligation.useQuery(
    {
      annualSalesGross2024: annualSales ? parseFloat(annualSales.replace(/\s/g, "").replace(",", ".")) : undefined,
      monthlySalesInvoiced: monthlySales ? parseFloat(monthlySales.replace(/\s/g, "").replace(",", ".")) : undefined,
      hasPolishSeat: hasPolishSeat === "yes",
      isVatPayer: isVatPayer === "yes",
      transactionType,
      specialProcedure,
    },
    { enabled: false }
  );

  const handleCheck = async () => {
    const res = await checkMutation.refetch();
    if (res.data) {
      setResult(res.data);
    } else {
      toast({ title: "Błąd", description: "Nie udało się sprawdzić obowiązku KSeF.", variant: "destructive" });
    }
  };

  const handleReset = () => {
    setAnnualSales("");
    setMonthlySales("");
    setHasPolishSeat("yes");
    setIsVatPayer("yes");
    setTransactionType("b2b");
    setSpecialProcedure("none");
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="annual-sales">Wartość sprzedaży brutto w 2024 r. (PLN)</Label>
          <Input
            id="annual-sales"
            placeholder="np. 500000 (opcjonalne)"
            value={annualSales}
            onChange={(e) => setAnnualSales(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Próg: 200 000 000 zł (I etap) lub brak (II etap)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthly-sales">Śr. miesięczna sprzedaż fakturowana brutto (PLN)</Label>
          <Input
            id="monthly-sales"
            placeholder="np. 8000 (opcjonalne)"
            value={monthlySales}
            onChange={(e) => setMonthlySales(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Próg zwolnienia mikro: ≤ 10 000 zł/mies. (do 31.12.2026)</p>
        </div>

        <div className="space-y-2">
          <Label>Siedziba / stałe miejsce działalności w Polsce</Label>
          <Select value={hasPolishSeat} onValueChange={(v) => setHasPolishSeat(v as "yes" | "no")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Tak - siedziba lub stałe miejsce w Polsce</SelectItem>
              <SelectItem value="no">Nie - brak siedziby i stałego miejsca w Polsce</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status VAT</Label>
          <Select value={isVatPayer} onValueChange={(v) => setIsVatPayer(v as "yes" | "no")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Czynny podatnik VAT</SelectItem>
              <SelectItem value="no">Zwolniony z VAT (nie jest czynnym podatnikiem)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Typ transakcji</Label>
          <Select value={transactionType} onValueChange={(v) => setTransactionType(v as "b2b" | "b2c" | "b2g")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="b2b">B2B - firma dla firmy</SelectItem>
              <SelectItem value="b2c">B2C - firma dla konsumenta (os. fizyczna)</SelectItem>
              <SelectItem value="b2g">B2G - firma dla instytucji publicznej</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Procedura szczególna (jeśli dotyczy)</Label>
          <Select value={specialProcedure} onValueChange={(v) => setSpecialProcedure(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Brak procedury szczególnej</SelectItem>
              <SelectItem value="oss_non_eu">OSS nieunijna</SelectItem>
              <SelectItem value="ioss">IOSS (import)</SelectItem>
              <SelectItem value="sme">SME (art. 113a ust. 1 ustawy o VAT)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleCheck} disabled={checkMutation.isFetching} className="gap-2">
          <Calculator className="w-4 h-4" />
          Sprawdź obowiązek KSeF
        </Button>
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Resetuj
        </Button>
      </div>

      {result && (
        <Card className={`border-2 ${result.isObligated ? "border-amber-400" : "border-green-400"}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {result.isObligated ? (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              {result.isObligated ? "Obowiązek KSeF dotyczy tego podmiotu" : "Brak obowiązku KSeF (lub zwolnienie)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.obligationDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Data obowiązku:</span>
                <Badge variant={isDatePast(result.obligationDate) ? "secondary" : "outline"}>
                  {formatDate(result.obligationDate)}
                  {isDatePast(result.obligationDate) && " (już obowiązuje!)"}
                </Badge>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-1">Uzasadnienie:</p>
              <p className="text-sm text-muted-foreground">{result.reason}</p>
            </div>

            <div>
              <p className="text-xs font-mono text-muted-foreground/70">Podstawa prawna: {result.legalBasis}</p>
            </div>

            {result.exceptions.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">Wyjątki / wyłączenia:</p>
                <ul className="space-y-1">
                  {result.exceptions.map((exc, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      {exc}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.nextSteps.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Zalecane działania:</p>
                <ol className="space-y-1.5">
                  {result.nextSteps.map((step, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-xs font-bold text-primary mt-0.5 shrink-0 w-4">{i + 1}.</span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <Separator />
            <p className="text-xs text-muted-foreground/70">
              ⚠️ Wynik kalkulatora ma charakter informacyjny. Przed podjęciem decyzji zweryfikuj w{" "}
              <a href="https://ksef.podatki.gov.pl" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                ksef.podatki.gov.pl
              </a>{" "}
              lub skonsultuj z doradcą podatkowym.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KsefAIChat({ initialQuestion }: { initialQuestion?: string }) {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const initialSent = useRef(false);

  const askMutation = trpc.ksef.askQuestion.useMutation();

  useEffect(() => {
    if (initialQuestion && !initialSent.current) {
      initialSent.current = true;
      setQuestion(initialQuestion);
    }
  }, [initialQuestion]);

  const handleSend = async () => {
    if (!question.trim() || isLoading) return;
    const userMsg = question.trim();
    setQuestion("");
    setIsLoading(true);

    const newHistory = [...history, { role: "user" as const, content: userMsg }];
    setHistory(newHistory);

    try {
      const result = await askMutation.mutateAsync({ question: userMsg, history });
      setHistory([...newHistory, { role: "assistant" as const, content: result.answer }]);
    } catch {
      toast({ title: "Błąd połączenia", description: "Spróbuj ponownie.", variant: "destructive" });
      setHistory(history); // rollback
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[520px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {history.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">Zadaj pytanie o KSeF</p>
            <p className="text-xs mt-1 max-w-xs mx-auto">
              Stefan odpowie wyłącznie na podstawie zweryfikowanych faktów z oficjalnych źródeł rządowych.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {[
                "Kiedy muszę zacząć wystawiać faktury w KSeF?",
                "Czy faktury B2C muszą być w KSeF?",
                "Co to jest tryb offline24?",
                "Jakie są sankcje za błędy w KSeF?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuestion(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground border border-border"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted border border-border rounded-lg px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
              Stefan analizuje...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Zadaj pytanie o KSeF (Enter = wyślij, Shift+Enter = nowa linia)..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="resize-none text-sm"
          disabled={isLoading}
        />
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSend}
            disabled={!question.trim() || isLoading}
            size="icon"
            className="h-full"
          >
            <Send className="w-4 h-4" />
          </Button>
          {history.length > 0 && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setHistory([])}
              title="Wyczyść historię"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ExceptionsSection() {
  const { data: exceptions, isLoading } = trpc.ksef.getExceptions.useQuery();

  if (isLoading) {
    return <div className="h-40 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-500" />
          Wyłączenia podmiotowe (można stosować dobrowolnie)
        </h3>
        <div className="space-y-2">
          {(exceptions?.subjectExceptions || []).map((exc: any) => (
            <div key={exc.id} className="p-3 rounded-lg border border-border bg-card">
              <p className="text-sm text-foreground">{exc.description}</p>
              <p className="text-xs font-mono text-muted-foreground/70 mt-1">{exc.legalBasis}</p>
              <Badge variant="outline" className="text-xs mt-1.5 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200">
                Można dobrowolnie w KSeF
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-500" />
          Wyłączenia transakcyjne (NIE można dobrowolnie)
        </h3>
        <div className="space-y-2">
          {(exceptions?.transactionExceptions || []).map((exc: any) => (
            <div key={exc.id} className="p-3 rounded-lg border border-border bg-card">
              <p className="text-sm text-foreground">{exc.description}</p>
              <p className="text-xs font-mono text-muted-foreground/70 mt-1">{exc.legalBasis}</p>
              <Badge variant="outline" className="text-xs mt-1.5 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200">
                Nie można dobrowolnie
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          Dokumenty NIE wysyłane do KSeF
        </h3>
        <div className="flex flex-wrap gap-2">
          {(exceptions?.excludedDocuments || []).map((doc: string, i: number) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {doc}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function TransitionalSection() {
  const { data: transitional, isLoading } = trpc.ksef.getTransitional2026.useQuery();

  if (isLoading) {
    return <div className="h-40 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800 dark:text-amber-200">
          Poniższe uproszczenia obowiązują wyłącznie do 31.12.2026 r. Od 01.01.2027 r. pełny reżim KSeF bez wyjątków.
        </p>
      </div>
      {(transitional || []).map((item: any) => (
        <Card key={item.id} className="border-amber-200 dark:border-amber-800">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                <p className="text-xs font-mono text-muted-foreground/70 mt-1.5">{item.legalBasis}</p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200">
                <Clock className="w-3 h-3 mr-1" />
                do {formatDate(item.validUntil)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------
// KSeF Templates Component
// -----------------------------------------------------------------------

type TemplateField = {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  hint?: string;
};

type KsefTemplateData = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  category: string;
  legalBasis: string;
  fields: TemplateField[];
  notes: string[];
  lastVerified: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  uprawnienia: "Uprawnienia i pełnomocnictwa",
  korekta: "Korekty faktur",
  offline: "Tryb offline i awaryjny",
  wdrozenie: "Wdrożenie KSeF",
  inne: "Inne",
};

function KsefTemplates() {
  const { toast } = useToast();
  const { data: templates, isLoading } = trpc.ksef.getTemplates.useQuery();
  const fillMutation = trpc.ksef.fillTemplate.useMutation();

  const [selectedTemplate, setSelectedTemplate] = useState<KsefTemplateData | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [step, setStep] = useState<"list" | "fill">("list");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDoc, setModalDoc] = useState<DocumentPreviewData | null>(null);

  const categories = templates
    ? ["all", ...Array.from(new Set(templates.map((t: KsefTemplateData) => t.category)))]
    : ["all"];

  const filtered = templates?.filter(
    (t: KsefTemplateData) => filterCategory === "all" || t.category === filterCategory
  ) ?? [];

  function handleSelectTemplate(t: KsefTemplateData) {
    setSelectedTemplate(t);
    setFieldValues({});
    setPreviewContent(null);
    setStep("fill");
  }

  async function handleGenerate() {
    if (!selectedTemplate) return;
    const missing = selectedTemplate.fields
      .filter((f) => f.required && !fieldValues[f.id]?.trim())
      .map((f) => f.label);
    if (missing.length > 0) {
      toast({ title: "Uzupełnij wymagane pola", description: missing.join(", "), variant: "destructive" });
      return;
    }
    try {
      const result = await fillMutation.mutateAsync({
        templateId: selectedTemplate.id,
        values: fieldValues,
      });
      setPreviewContent(result.content);
      setModalDoc({
        templateId: selectedTemplate.id,
        templateTitle: selectedTemplate.title,
        category: selectedTemplate.category,
        content: result.content,
        legalBasis: selectedTemplate.legalBasis,
        fieldValues: fieldValues,
      });
      setModalOpen(true);
    } catch (e: any) {
      toast({ title: "Błąd generowania", description: e.message, variant: "destructive" });
    }
  }

  // handleDownloadTxt i handlePrint przeniesione do DocumentPreviewModal

  if (isLoading) {
    return <div className="h-40 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <>
      {/* Modal podglądu dokumentu */}
      <DocumentPreviewModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setModalDoc(null); }}
        document={modalDoc}
      />

      {/* STEP: LIST */}
      {step === "list" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filterCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {cat === "all" ? "Wszystkie" : CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {filtered.map((t: KsefTemplateData) => (
              <Card
                key={t.id}
                className="hover:shadow-md transition-shadow cursor-pointer border-border"
                onClick={() => handleSelectTemplate(t)}
              >
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        {t.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                      <p className="text-xs font-mono text-muted-foreground/60 mt-1.5">{t.legalBasis}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {CATEGORY_LABELS[t.category] ?? t.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950 text-xs text-amber-800 dark:text-amber-200">
            <strong>Uwaga:</strong> Szablony oparte na oficjalnych przepisach KSeF. Przed użyciem dostosuj dane do konkretnej sytuacji.
            Zweryfikuj aktualne przepisy w <a href="https://isap.sejm.gov.pl" target="_blank" rel="noopener noreferrer" className="underline">isap.sejm.gov.pl</a>.
          </div>
        </div>
      )}

      {/* STEP: FILL */}
      {step === "fill" && selectedTemplate && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep("list")} className="gap-1 text-xs">
              <ChevronLeft className="w-3.5 h-3.5" /> Powrót do listy
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <p className="text-sm font-semibold text-foreground">{selectedTemplate.title}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Podstawa prawna:</span> {selectedTemplate.legalBasis}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {selectedTemplate.fields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <Label htmlFor={field.id} className="text-xs font-medium">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </Label>
                <Input
                  id={field.id}
                  placeholder={field.placeholder}
                  value={fieldValues[field.id] ?? ""}
                  onChange={(e) =>
                    setFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                  }
                  className="text-sm"
                />
                {field.hint && (
                  <p className="text-xs text-muted-foreground">{field.hint}</p>
                )}
              </div>
            ))}
          </div>
          {selectedTemplate.notes.length > 0 && (
            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 space-y-1">
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Ważne informacje:
              </p>
              {selectedTemplate.notes.map((note, i) => (
                <p key={i} className="text-xs text-blue-700 dark:text-blue-300">• {note}</p>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleGenerate} disabled={fillMutation.isPending} className="gap-1.5">
              <ClipboardList className="w-4 h-4" />
              {fillMutation.isPending ? "Generowanie..." : "Generuj dokument"}
            </Button>
            <Button variant="outline" onClick={() => setStep("list")} className="gap-1.5">Anuluj</Button>
          </div>
        </div>
      )}
    </>
  );
}

// -----------------------------------------------------------------------
// KSeF Sanctions Panel
// -----------------------------------------------------------------------
function KsefSanctionsPanel() {
  const { data: sanctions, isLoading } = trpc.ksef.getSanctions.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800 dark:text-amber-200">
          <strong>Ważne:</strong> Sankcje z art. 106ni ustawy o VAT wchodzą w życie od <strong>01.01.2027 r.</strong>
          W 2026 r. obowiązek KSeF bez sankcji (przepisy epizodyczne). Inne przepisy VAT (art. 112b, 112c) nadal obowiązują.
        </p>
      </div>
      {(sanctions || []).map((s: any) => {
        const isActive = new Date(s.activeFrom) <= new Date();
        return (
          <div key={s.id} className={`p-4 rounded-lg border ${
            isActive ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30" : "border-border bg-card"
          }`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Gavel className={`w-4 h-4 shrink-0 ${isActive ? "text-red-600" : "text-muted-foreground"}`} />
                <p className="text-sm font-semibold text-foreground">{s.category}</p>
              </div>
              <Badge variant="outline" className={`text-xs shrink-0 ${
                isActive
                  ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300"
                  : "bg-muted text-muted-foreground"
              }`}>
                {isActive ? "Aktywna" : `Od ${new Date(s.activeFrom).toLocaleDateString("pl-PL")}`}
              </Badge>
            </div>
            <p className="text-sm text-foreground mb-2">{s.description}</p>
            <div className="flex items-start gap-1.5 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs font-semibold text-red-700 dark:text-red-300">{s.penalty}</p>
            </div>
            <p className="text-xs font-mono text-muted-foreground/70">{s.legalBasis}</p>
            {s.note && (
              <p className="text-xs text-muted-foreground mt-1.5 italic">{s.note}</p>
            )}
          </div>
        );
      })}
      <div className="p-2 rounded border border-border bg-muted/20 text-xs text-muted-foreground">
        Źródło: Art. 106ni ustawy o podatku od towarów i usług (Dz. U. 2025 poz. 1203).
        Weryfikacja: <a href="https://isap.sejm.gov.pl" target="_blank" rel="noopener noreferrer" className="text-primary underline">isap.sejm.gov.pl</a>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// KSeF Alerts Panel
// -----------------------------------------------------------------------
function KsefAlertsPanel({ onAskStefan }: { onAskStefan?: (q: string) => void }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: stats, isLoading: statsLoading } = trpc.ksef.getAlertStats.useQuery(undefined, {
    refetchInterval: 60_000, // odświeżaj co minutę
  });

  const { data: alerts, isLoading: alertsLoading } = trpc.ksef.getAlerts.useQuery(
    { limit: 50 },
    { refetchInterval: 60_000 }
  );

  const markReadMutation = trpc.ksef.markRead.useMutation({
    onSuccess: () => {
      utils.ksef.getAlerts.invalidate();
      utils.ksef.getAlertStats.invalidate();
    },
  });

  const markAllReadMutation = trpc.ksef.markAllRead.useMutation({
    onSuccess: () => {
      utils.ksef.getAlerts.invalidate();
      utils.ksef.getAlertStats.invalidate();
      toast({ title: "Wszystkie alerty oznaczone jako przeczytane" });
    },
  });

  const refreshMutation = trpc.ksef.refreshAlerts.useMutation({
    onSuccess: (result) => {
      utils.ksef.getAlerts.invalidate();
      utils.ksef.getAlertStats.invalidate();
      toast({
        title: result.newAlerts > 0
          ? `Znaleziono ${result.newAlerts} nowych alertów KSeF`
          : "Brak nowych alertów KSeF",
        description: `Sprawdzono ${result.totalFetched} źródeł.`,
      });
    },
    onError: () => toast({ title: "Błąd odświeżania", variant: "destructive" }),
  });

  const PRIORITY_COLORS: Record<string, string> = {
    wysoki: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    sredni: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    niski: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  };

  const ALERT_TYPE_LABELS: Record<string, string> = {
    przepis: "Przepis",
    aktualnosc: "Aktualność",
    interpretacja: "Interpretacja",
    komunikat: "Komunikat MF",
    orzeczenie: "Orzeczenie",
  };

  const SOURCE_LABELS: Record<string, string> = {
    "ksef.podatki.gov.pl": "Portal KSeF",
    "isap.sejm.gov.pl": "ISAP / Dz. U.",
    "gov.pl/finanse": "MF / gov.pl",
  };

  // ---- Lokalne filtry / wyszukiwarka (client-side) ----
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState<"all" | "ksef.podatki.gov.pl" | "isap.sejm.gov.pl" | "gov.pl/finanse">("all");
  const [filterPriority, setFilterPriority] = useState<"all" | "wysoki" | "sredni" | "niski">("all");
  const [filterUnread, setFilterUnread] = useState(false);

  const filteredAlerts = (alerts || []).filter((alert: any) => {
    if (filterSource !== "all" && alert.source !== filterSource) return false;
    if (filterPriority !== "all" && alert.priority !== filterPriority) return false;
    if (filterUnread && alert.isRead) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = (alert.title || "").toLowerCase().includes(q);
      const inSummary = (alert.summary || "").toLowerCase().includes(q);
      const inLegal = (alert.legalBasis || "").toLowerCase().includes(q);
      if (!inTitle && !inSummary && !inLegal) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Wszystkich", value: statsLoading ? "—" : stats?.total ?? 0, icon: <Rss className="w-4 h-4" />, color: "text-foreground" },
          { label: "Nieprzeczytanych", value: statsLoading ? "—" : stats?.unread ?? 0, icon: <Bell className="w-4 h-4" />, color: "text-amber-600" },
          { label: "Dzisiaj", value: statsLoading ? "—" : stats?.newToday ?? 0, icon: <Clock className="w-4 h-4" />, color: "text-blue-600" },
          { label: "Wysoki priorytet", value: statsLoading ? "—" : stats?.highPriority ?? 0, icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label} className="border-border">
            <CardContent className="pt-3 pb-3">
              <div className={`flex items-center gap-2 ${s.color}`}>
                {s.icon}
                <span className="text-xl font-bold">{String(s.value)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Input
            placeholder="Szukaj w alertach (tytuł, treść, podstawa prawna)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-sm h-9"
          />
          <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground text-xs px-1"
            >×</button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={filterSource} onValueChange={(v) => setFilterSource(v as typeof filterSource)}>
            <SelectTrigger className="h-7 text-xs w-40">
              <SelectValue placeholder="Źródło" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie źródła</SelectItem>
              <SelectItem value="ksef.podatki.gov.pl">Portal KSeF</SelectItem>
              <SelectItem value="isap.sejm.gov.pl">ISAP / Dz. U.</SelectItem>
              <SelectItem value="gov.pl/finanse">MF / gov.pl</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as typeof filterPriority)}>
            <SelectTrigger className="h-7 text-xs w-36">
              <SelectValue placeholder="Priorytet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="wysoki">Wysoki</SelectItem>
              <SelectItem value="sredni">Średnii</SelectItem>
              <SelectItem value="niski">Niski</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={filterUnread ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setFilterUnread(!filterUnread)}
          >
            <Bell className="w-3 h-3" />
            Nieprzeczytane
          </Button>
          {(searchQuery || filterSource !== "all" || filterPriority !== "all" || filterUnread) && (
            <button
              onClick={() => { setSearchQuery(""); setFilterSource("all"); setFilterPriority("all"); setFilterUnread(false); }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Wyczyść filtry
            </button>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {filteredAlerts.length} / {(alerts || []).length} alertów
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Monitoring: ksef.podatki.gov.pl · ISAP (Dz. U.) · gov.pl/finanse — co 6h
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || !stats?.unread}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Oznacz wszystkie
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
            {refreshMutation.isPending ? "Sprawdzam..." : "Odśwież teraz"}
          </Button>
        </div>
      </div>

      {/* Alert list */}
      {alertsLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : !alerts || (alerts.length === 0 && !searchQuery && filterSource === "all" && filterPriority === "all" && !filterUnread) ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BellOff className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Brak alertów KSeF</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Kliknij &quot;Odśwież teraz&quot; aby sprawdzić nowe zmiany w przepisach</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <BellOff className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Brak wyników dla podanych filtrów</p>
          <button onClick={() => { setSearchQuery(""); setFilterSource("all"); setFilterPriority("all"); setFilterUnread(false); }} className="text-xs text-primary underline mt-1">Wyczyść filtry</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAlerts.map((alert: any) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border transition-colors ${
                !alert.isRead
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {!alert.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                    <Badge
                      variant="outline"
                      className={`text-xs px-1.5 py-0 ${PRIORITY_COLORS[alert.priority] || ""}`}
                    >
                      {alert.priority === "wysoki" && <AlertTriangle className="w-2.5 h-2.5 mr-1" />}
                      {alert.priority.charAt(0).toUpperCase() + alert.priority.slice(1)}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground">
                      {ALERT_TYPE_LABELS[alert.alertType] || alert.alertType}
                    </Badge>
                    <span className="text-xs text-muted-foreground/60">
                      {SOURCE_LABELS[alert.source] || alert.source}
                    </span>
                    <span className="text-xs text-muted-foreground/60 ml-auto">
                      {new Date(alert.publishedAt).toLocaleDateString("pl-PL")}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-snug">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.summary}</p>
                  {alert.legalBasis && (
                    <p className="text-xs font-mono text-muted-foreground/60 mt-1">{alert.legalBasis}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {onAskStefan && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary"
                      title="Zapytaj Stefana o ten alert"
                      onClick={() => {
                        if (!alert.isRead) markReadMutation.mutate({ id: alert.id });
                        onAskStefan(`Wyjaśnij mi szczegółowo ten alert KSeF: "${alert.title}" (${new Date(alert.publishedAt).toLocaleDateString("pl-PL")}, źródło: ${alert.source}). ${alert.summary ? `Treść: ${alert.summary}` : ""} ${alert.legalBasis ? `Podstawa prawna: ${alert.legalBasis}` : ""}`);
                      }}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Stefan
                    </Button>
                  )}
                  <a
                    href={alert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                  {!alert.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => markReadMutation.mutate({ id: alert.id })}
                      title="Oznacz jako przeczytane"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-2 rounded border border-border bg-muted/20 text-xs text-muted-foreground">
        Źródła: wyłącznie oficjalne portale rządowe (ksef.podatki.gov.pl, isap.sejm.gov.pl, gov.pl/finanse).
        Blogi, portale branżowe i media są automatycznie odrzucane.
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Alerts Tab Trigger with unread badge
// -----------------------------------------------------------------------
function AlertsTabTrigger() {
  const { data: stats } = trpc.ksef.getAlertStats.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const unread = stats?.unread ?? 0;

  return (
    <TabsTrigger value="alerts" className="relative min-h-10 gap-1.5 px-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
      <Bell className="w-3.5 h-3.5" />
      Alerty
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </TabsTrigger>
  );
}

// -----------------------------------------------------------------------
// Main Page
// -----------------------------------------------------------------------
export default function KSeF() {
  const [activeTab, setActiveTab] = useState("chat");
  const [chatInitialQuestion, setChatInitialQuestion] = useState<string | undefined>(undefined);

  const handleAskStefan = (question: string) => {
    setChatInitialQuestion(question);
    setActiveTab("chat");
  };

  return (
    <StefanLayout>
      <div className="container max-w-7xl py-8 lg:py-10 space-y-6">
        {/* Header */}
        <section className="office-hero flex flex-col gap-5 rounded-2xl border border-primary/15 px-6 py-7 lg:flex-row lg:items-start lg:justify-between lg:px-8">
          <div className="max-w-3xl">
            <div className="office-eyebrow mb-3"><FileText className="size-4" />Rozliczenia · źródła urzędowe</div>
            <h1 className="font-office text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">KSeF — Krajowy System e-Faktur</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground lg:text-base">
              Moduł informacyjny i roboczy oparty wyłącznie na kanałach rządowych oraz zweryfikowanych podstawach prawnych.
            </p>
          </div>
          <a
            href="https://ksef.podatki.gov.pl"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button variant="outline" size="sm" className="gap-1.5 bg-card text-xs">
              <ExternalLink className="w-3.5 h-3.5" />
              Portal KSeF
            </Button>
          </a>
        </section>

        {/* Status Banner */}
        <Card className="border-emerald-700/25 bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><CheckCircle2 className="size-5" /></div>
              <div className="text-sm">
                <div className="mb-1 flex flex-wrap items-center gap-2"><span className="office-eyebrow text-emerald-700 dark:text-emerald-300">Status obowiązku</span><Badge variant="outline" className="border-emerald-700/25 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">Obowiązuje</Badge></div>
                <p className="font-office text-lg font-semibold text-foreground">
                  Aktualny status: II etap KSeF od 01.04.2026 (obowiązuje)
                </p>
                <p className="mt-1 leading-6 text-muted-foreground">
                  Wszyscy czynni podatnicy VAT (sprzedaż &lt; 200 mln zł w 2024 r.) mają obowiązek wystawiania faktur w KSeF.
                  Wyjątek: mikroprzedsiębiorcy z fakturami ≤ 10 000 zł/mies. — zwolnieni do 31.12.2026.
                  W 2026 r. brak sankcji art. 106ni (sankcje od 01.01.2027).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1 sm:grid-cols-3 lg:grid-cols-7">
            <TabsTrigger value="chat" className="min-h-10 gap-1.5 px-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="w-3.5 h-3.5" />
              Pytaj Stefana
            </TabsTrigger>
            <TabsTrigger value="checker" className="min-h-10 gap-1.5 px-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calculator className="w-3.5 h-3.5" />
              Kalkulator
            </TabsTrigger>
            <TabsTrigger value="timeline" className="min-h-10 gap-1.5 px-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="w-3.5 h-3.5" />
              Harmonogram
            </TabsTrigger>
            <TabsTrigger value="exceptions" className="min-h-10 gap-1.5 px-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="w-3.5 h-3.5" />
              Wyłączenia
            </TabsTrigger>
            <TabsTrigger value="sanctions" className="min-h-10 gap-1.5 px-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Gavel className="w-3.5 h-3.5" />
              Sankcje
            </TabsTrigger>
            <TabsTrigger value="templates" className="min-h-10 gap-1.5 px-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ClipboardList className="w-3.5 h-3.5" />
              Szablony
            </TabsTrigger>
            <AlertsTabTrigger />
          </TabsList>

          <TabsContent value="chat" className="mt-4">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border/80 bg-muted/25 pb-4">
                <CardTitle className="font-office text-lg flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Asystent KSeF — Stefan
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Odpowiedzi wyłącznie na podstawie oficjalnych aktów prawnych + aktualnych alertów z monitoringu. Temperatura LLM: 0.1.
                </p>
              </CardHeader>
              <CardContent>
                <KsefAIChat initialQuestion={chatInitialQuestion} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checker" className="mt-4">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border/80 bg-muted/25 pb-4">
                <CardTitle className="font-office text-lg flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  Kalkulator Obowiązku KSeF
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Sprawdź, od kiedy Twój klient ma obowiązek wystawiania faktur w KSeF.
                </p>
              </CardHeader>
              <CardContent>
                <ObligationChecker />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border/80 bg-muted/25 pb-4">
                <CardTitle className="font-office text-lg flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Harmonogram Wdrożenia KSeF
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Wszystkie daty i etapy zgodne z Ustawą z 05.08.2025 r. (Dz. U. 2025 poz. 1203)
                </p>
              </CardHeader>
              <CardContent>
                <TimelineSection />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border/80 bg-muted/25 pb-4">
                <CardTitle className="font-office text-lg flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  Szablony Pism KSeF
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Gotowe wzory pism: ZAW-FA, wezwanie do korekty, oświadczenie offline24, tryb awaryjny.
                  Wypełnij pola i pobierz gotowy dokument.
                </p>
              </CardHeader>
              <CardContent>
                <KsefTemplates />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sanctions" className="mt-4">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border/80 bg-muted/25 pb-4">
                <CardTitle className="font-office text-lg flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-primary" />
                  Sankcje KSeF — Art. 106ni Ustawy o VAT
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Kary finansowe za naruszenia KSeF. Sankcje art. 106ni wchodzą w życie od 01.01.2027 r.
                </p>
              </CardHeader>
              <CardContent>
                <KsefSanctionsPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="mt-4">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border/80 bg-muted/25 pb-4">
                <CardTitle className="font-office text-lg flex items-center gap-2">
                  <Rss className="w-4 h-4 text-primary" />
                  Alerty KSeF — Monitoring Zmian w Przepisach
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Automatyczny monitoring 3 oficjalnych źródeł rządowych co 6h. Kliknij „Zapytaj Stefana” przy alercie, aby uzyskać interpretację prawną.
                </p>
              </CardHeader>
              <CardContent>
                <KsefAlertsPanel onAskStefan={handleAskStefan} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exceptions" className="mt-4">
            <Tabs defaultValue="exceptions-list">
              <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl border border-border bg-card p-1">
                <TabsTrigger value="exceptions-list" className="min-h-10 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Wyłączenia z KSeF</TabsTrigger>
                <TabsTrigger value="transitional" className="min-h-10 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Uproszczenia 2026</TabsTrigger>
              </TabsList>
              <TabsContent value="exceptions-list" className="mt-4">
                <Card className="border-border shadow-sm">
                  <CardHeader className="border-b border-border/80 bg-muted/25 pb-4">
                    <CardTitle className="font-office text-lg">Wyłączenia z Obowiązku KSeF</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Źródło: Art. 106na ustawy o VAT + Rozporządzenie MFiG z 07.12.2025 r.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ExceptionsSection />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="transitional" className="mt-4">
                <Card className="border-border shadow-sm">
                  <CardHeader className="border-b border-border/80 bg-muted/25 pb-4">
                    <CardTitle className="font-office text-lg">Uproszczenia Przejściowe 2026</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Obowiązują do 31.12.2026 r. — przepisy epizodyczne
                    </p>
                  </CardHeader>
                  <CardContent>
                    <TransitionalSection />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* Legal disclaimer */}
        <div className="rounded-xl border border-primary/15 bg-card p-5 text-xs leading-5 text-muted-foreground">
          <p className="font-semibold text-foreground mb-2">Źródła i weryfikacja</p>
          <div className="flex flex-wrap gap-3">
            <a href="https://ksef.podatki.gov.pl" target="_blank" rel="noopener noreferrer" className="office-link">
              <ExternalLink className="w-3 h-3" /> ksef.podatki.gov.pl
            </a>
            <a href="https://isap.sejm.gov.pl" target="_blank" rel="noopener noreferrer" className="office-link">
              <ExternalLink className="w-3 h-3" /> isap.sejm.gov.pl
            </a>
            <a href="https://www.gov.pl/web/finanse" target="_blank" rel="noopener noreferrer" className="office-link">
              <ExternalLink className="w-3 h-3" /> gov.pl/finanse
            </a>
          </div>
          <p className="mt-2">
            Informacje mają charakter informacyjny i nie stanowią porady prawnej ani podatkowej.
            Przed podjęciem decyzji zweryfikuj aktualne przepisy lub skonsultuj się z doradcą podatkowym.
          </p>
        </div>
      </div>
    </StefanLayout>
  );
}
