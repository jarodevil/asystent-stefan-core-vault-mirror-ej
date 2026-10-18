import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { trpcClient } from "@/lib/trpcClient";
import {
  Loader2,
  Send,
  Scale,
  User,
  Download,
  Archive,
  Zap,
  AlertTriangle,
  BookOpen,
  Plus,
  Bookmark,
  Check,
  History,
  Square,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import StefanLayout from "@/components/StefanLayout";
import ChatWorkspacePanel from "@/components/ChatWorkspacePanel";
import {
  countTotalTokens,
  getContextWarningLevel,
  getContextUsagePercent,
  CRITICAL_THRESHOLD,
  CONTEXT_LIMIT,
} from "@/lib/tokenCounter";
import { useAuth } from "@/_core/hooks/useAuth";

interface Message {
  role: "user" | "assistant";
  content: string;
  isDeepResearch?: boolean;
}

const LEGACY_CHAT_HISTORY_KEY = "stefan_chat_history";

function readLegacyChatHistory(): Message[] {
  try {
    const raw = localStorage.getItem(LEGACY_CHAT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is Message =>
          (item?.role === "user" || item?.role === "assistant") &&
          typeof item?.content === "string" &&
          item.content.trim().length > 0
      )
      .slice(-500)
      .map(item => ({ role: item.role, content: item.content.trim() }));
  } catch {
    return [];
  }
}

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatMode, setChatMode] = useState<"standard" | "deep-research">(
    "standard"
  );
  const [tokenCount, setTokenCount] = useState(0);
  const [showContextWarning, setShowContextWarning] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [legacyMessages, setLegacyMessages] = useState<Message[]>([]);
  const [isImportingLegacyHistory, setIsImportingLegacyHistory] =
    useState(false);
  const [savedNoteIdx, setSavedNoteIdx] = useState<Set<number>>(new Set());
  const [savingNoteIdx, setSavingNoteIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const pendingMessageRef = useRef<string | null>(null);
  const utils = trpc.useUtils();

  useEffect(() => {
    setLegacyMessages(readLegacyChatHistory());
  }, []);

  // Załaduj lub utwórz sesję przy starcie (tylko dla zalogowanych)
  const getOrCreateLastMutation = trpc.sessions.getOrCreateLast.useMutation({
    onSuccess: data => {
      if (data.session) {
        setCurrentSessionId(data.session.id);
        if (data.messages && data.messages.length > 0) {
          const loaded: Message[] = data.messages
            .filter(m => m.role === "user" || m.role === "assistant")
            .map(m => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            }));
          setMessages(loaded);
          const tokens = countTotalTokens(loaded);
          setTokenCount(tokens);
          if (!data.isNew) {
            toast.info(`Wznowiono sesję: ${data.session.title}`, {
              duration: 2000,
            });
          }
        }
      }
      setIsLoadingSession(false);
    },
    onError: () => {
      setIsLoadingSession(false);
    },
  });

  const createSessionMutation = trpc.sessions.create.useMutation({
    onSuccess: data => {
      setCurrentSessionId(data.sessionId);
      utils.sessions.getActive.invalidate();
    },
  });

  const createNoteMutation = trpc.notes.create.useMutation({
    onSuccess: (data, variables, context) => {
      toast.success(`Notatka zapisana: "${data.title}"`, {
        description: "Dostępna w zakładce Moje Notatki",
        duration: 3000,
      });
    },
    onError: e =>
      toast.error("Błąd zapisu notatki", { description: e.message }),
  });

  const handleSaveNote = (content: string, idx: number) => {
    if (!user) {
      toast.error("Zaloguj się, aby zapisywać notatki");
      return;
    }
    setSavingNoteIdx(idx);
    createNoteMutation.mutate(
      { content, sessionId: currentSessionId ?? undefined },
      {
        onSettled: () => setSavingNoteIdx(null),
        onSuccess: () => setSavedNoteIdx(prev => new Set(prev).add(idx)),
      }
    );
  };

  const archiveSessionMutation = trpc.sessions.archive.useMutation({
    onSuccess: () => {
      setCurrentSessionId(null);
      setMessages([]);
      setTokenCount(0);
      setShowContextWarning(false);
      toast.success(
        "Sesja zarchiwizowana. Możesz ją znaleźć w Zarządzaniu Sesjami."
      );
      utils.sessions.getActive.invalidate();
    },
  });

  const restoreSessionMutation = trpc.sessions.restore.useMutation({
    onSuccess: () => {
      utils.sessions.getActive.invalidate();
      utils.sessions.getArchived.invalidate();
    },
  });

  // Załaduj sesję przy starcie
  useEffect(() => {
    if (user) {
      setIsLoadingSession(true);
      getOrCreateLastMutation.mutate();
    }
  }, [user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const applyAssistantMessage = (content: string, isDeepResearch: boolean) => {
    const assistantMsg = {
      role: "assistant" as const,
      content,
      isDeepResearch,
    };
    setMessages(prev => {
      const newMessages = [...prev, assistantMsg];
      const tokens = countTotalTokens(newMessages);
      setTokenCount(tokens);
      const warningLevel = getContextWarningLevel(tokens);
      if (warningLevel === "warning" && !showContextWarning) {
        setShowContextWarning(true);
        toast.warning("Kontekst wypełniony w 80%", {
          description:
            "Rozważ rozpoczęcie nowego wątku aby uniknąć halucynacji.",
          duration: 5000,
        });
      } else if (warningLevel === "critical") {
        setShowContextWarning(true);
        toast.error("Limit kontekstu osiągnięty", {
          description:
            "Rozpocznij nowy wątek klikając „Nowy wątek”, aby uniknąć halucynacji.",
          duration: 10000,
        });
      }
      return newMessages;
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    if (tokenCount >= CRITICAL_THRESHOLD) {
      toast.error("Limit kontekstu osiągnięty", {
        description:
          "Rozpocznij nowy wątek klikając 'Nowy wątek' aby uniknąć halucynacji.",
        duration: 5000,
      });
      return;
    }

    const userMessage = input.trim();
    setInput("");
    const userMsg = { role: "user" as const, content: userMessage };
    const validHistory = messages.filter(
      msg =>
        msg.role &&
        msg.content &&
        (msg.role === "user" || msg.role === "assistant")
    );
    const requestedMode = chatMode;
    let optimisticMessageAdded = false;

    try {
      let sessionId = currentSessionId;
      if (user && !sessionId) {
        const created = await createSessionMutation.mutateAsync({
          title:
            userMessage.length > 50
              ? `${userMessage.slice(0, 47)}...`
              : userMessage,
        });
        sessionId = created.sessionId;
        setCurrentSessionId(sessionId);
      }

      setMessages(prev => [...prev, userMsg]);
      optimisticMessageAdded = true;
      pendingMessageRef.current = userMessage;
      const controller = new AbortController();
      requestControllerRef.current = controller;
      setIsSending(true);

      const data = await trpcClient.chat.sendMessage.mutate(
        {
          message: userMessage,
          history: validHistory,
          sessionId: sessionId ?? undefined,
        },
        { signal: controller.signal }
      );

      if (controller.signal.aborted) return;
      if (data.success) {
        applyAssistantMessage(data.message, requestedMode === "deep-research");
        if (sessionId) utils.sessions.getActive.invalidate();
      } else {
        if (optimisticMessageAdded) setMessages(prev => prev.slice(0, -1));
        setInput(userMessage);
        toast.error("Błąd", { description: data.message });
      }
    } catch (error) {
      if (requestControllerRef.current?.signal.aborted) return;
      if (optimisticMessageAdded) setMessages(prev => prev.slice(0, -1));
      setInput(userMessage);
      toast.error("Błąd połączenia", {
        description:
          error instanceof Error
            ? error.message
            : "Nie udało się wysłać pytania.",
      });
    } finally {
      requestControllerRef.current = null;
      pendingMessageRef.current = null;
      setIsSending(false);
    }
  };

  const handleStop = () => {
    const controller = requestControllerRef.current;
    if (!controller || controller.signal.aborted) return;

    controller.abort();
    setMessages(prev => prev.slice(0, -1));
    setInput(pendingMessageRef.current ?? "");
    toast.info("Zatrzymano odpowiedź. Pytanie wróciło do pola edycji.");
  };

  const handleNewThread = () => {
    if (isSending) return;
    setCurrentSessionId(null);
    setMessages([]);
    setTokenCount(0);
    setShowContextWarning(false);
    toast.success(
      "Nowy wątek jest gotowy. Sesja zostanie utworzona dopiero po wysłaniu pytania."
    );
  };

  const handleArchive = () => {
    if (currentSessionId && user) {
      archiveSessionMutation.mutate({ sessionId: currentSessionId });
    } else {
      setMessages([]);
      setTokenCount(0);
      setShowContextWarning(false);
      toast.success("Wątek wyczyszczony.");
    }
  };

  const handleOpenSession = async (sessionId: number, isArchived: boolean) => {
    if (!user || isSending) return;
    setIsLoadingSession(true);
    try {
      if (isArchived) {
        await restoreSessionMutation.mutateAsync({ sessionId });
      }
      const loaded = await trpcClient.sessions.getMessages.query({
        sessionId,
        limit: 100,
      });
      const restoredMessages: Message[] = loaded
        .filter(
          message => message.role === "user" || message.role === "assistant"
        )
        .map(message => ({
          role: message.role as "user" | "assistant",
          content: message.content,
        }));
      setMessages(restoredMessages);
      setCurrentSessionId(sessionId);
      setTokenCount(countTotalTokens(restoredMessages));
      setShowContextWarning(
        getContextWarningLevel(countTotalTokens(restoredMessages)) !== "safe"
      );
      setIsWorkspaceOpen(false);
      toast.success("Wczytano historię sprawy bez ponownej analizy modelu.");
    } catch (error) {
      toast.error("Nie udało się wczytać sprawy", {
        description:
          error instanceof Error
            ? error.message
            : "Spróbuj ponownie za chwilę.",
      });
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleUseNote = (content: string) => {
    setInput(content);
    setIsWorkspaceOpen(false);
    toast.info(
      "Treść notatki wstawiono do pola pytania — nie została jeszcze wysłana."
    );
  };

  const handleImportLegacyHistory = async () => {
    if (!user || legacyMessages.length === 0) return;
    setIsImportingLegacyHistory(true);
    try {
      const firstQuestion = legacyMessages.find(
        message => message.role === "user"
      )?.content;
      const title = firstQuestion
        ? firstQuestion.length > 50
          ? `${firstQuestion.slice(0, 47)}...`
          : firstQuestion
        : "Historia przeniesiona z przeglądarki";
      const result = await trpcClient.sessions.importLocalHistory.mutate({
        title,
        messages: legacyMessages.map(({ role, content }) => ({
          role,
          content,
        })),
      });
      localStorage.removeItem(LEGACY_CHAT_HISTORY_KEY);
      setLegacyMessages([]);
      await utils.sessions.getActive.invalidate();
      toast.success(
        `Przeniesiono ${result.messageCount} wiadomości do trwałej sprawy.`
      );
    } catch (error) {
      toast.error("Nie udało się przenieść lokalnej historii.", {
        description:
          error instanceof Error
            ? error.message
            : "Lokalna kopia pozostała bez zmian.",
      });
    } finally {
      setIsImportingLegacyHistory(false);
    }
  };

  const handleExport = () => {
    // Eksport lokalny jako JSON
    const archive = {
      version: "5.4",
      exportDate: new Date().toISOString(),
      sessionId: currentSessionId,
      messages,
      messageCount: messages.length,
    };
    const blob = new Blob([JSON.stringify(archive, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stefan-sesja-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Eksportowano historię sesji");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <StefanLayout>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="p-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Chat z Ekspertem</h1>
              <p className="text-sm text-muted-foreground">
                {isLoadingSession
                  ? "Ładowanie historii sesji..."
                  : currentSessionId
                    ? `Sesja #${currentSessionId} — historia zapisywana w bazie danych`
                    : chatMode === "standard"
                      ? "Zadaj pytanie prawne i otrzymaj natychmiastową odpowiedź"
                      : "Głębokie badanie - szczegółowa analiza problemu"}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWorkspaceOpen(true)}
                >
                  <History className="w-4 h-4 mr-2" />
                  Sprawy i notatki
                </Button>
                {messages.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Eksportuj
                  </Button>
                )}
                {messages.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleArchive}>
                    <Archive className="w-4 h-4 mr-2" />
                    Archiwizuj
                  </Button>
                )}
                {isSending && (
                  <Button variant="destructive" size="sm" onClick={handleStop}>
                    <Square className="w-3.5 h-3.5 mr-2 fill-current" />
                    STOP
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleNewThread}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nowy wątek
                </Button>
              </div>
              {messages.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 mb-1">
                    {getContextWarningLevel(tokenCount) === "critical" && (
                      <AlertTriangle className="w-3 h-3 text-destructive" />
                    )}
                    {getContextWarningLevel(tokenCount) === "warning" && (
                      <AlertTriangle className="w-3 h-3 text-yellow-500" />
                    )}
                    <span>
                      Kontekst: {tokenCount.toLocaleString()} /{" "}
                      {CONTEXT_LIMIT.toLocaleString()} tokenów (
                      {getContextUsagePercent(tokenCount)}%)
                    </span>
                  </div>
                  <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        getContextWarningLevel(tokenCount) === "critical"
                          ? "bg-destructive"
                          : getContextWarningLevel(tokenCount) === "warning"
                            ? "bg-yellow-500"
                            : "bg-primary"
                      }`}
                      style={{
                        width: `${getContextUsagePercent(tokenCount)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <ChatWorkspacePanel
            open={isWorkspaceOpen}
            onOpenChange={setIsWorkspaceOpen}
            currentSessionId={currentSessionId}
            legacyMessages={legacyMessages}
            isImportingLegacyHistory={isImportingLegacyHistory}
            onImportLegacyHistory={handleImportLegacyHistory}
            onOpenSession={handleOpenSession}
            onUseNote={handleUseNote}
          />
          {/* Mode Tabs */}
          <div className="flex border-t px-4">
            <button
              onClick={() => setChatMode("standard")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                chatMode === "standard"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Standardowy
            </button>
            <button
              onClick={() => setChatMode("deep-research")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                chatMode === "deep-research"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              🔬 Deep Research
            </button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 bg-muted/20" ref={scrollRef}>
          <div className="max-w-4xl mx-auto space-y-6">
            {isLoadingSession && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Ładowanie historii rozmów...</span>
                </div>
              </div>
            )}

            {!isLoadingSession && messages.length === 0 && (
              <Card className="bg-card border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-primary" />
                    Witaj w Czacie z Ekspertem!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>
                    Jestem Stefan, Twój osobisty asystent prawny. Mogę pomóc Ci
                    w:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Wyjaśnianiu przepisów prawnych</li>
                    <li>Interpretacji dokumentów</li>
                    <li>
                      Udzielaniu porad w sprawach cywilnych i gospodarczych
                    </li>
                    <li>Odpowiadaniu na pytania dotyczące prawa pracy</li>
                  </ul>
                  {user && (
                    <p className="text-xs pt-2 text-primary/70 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      Historia rozmów jest zapisywana w bazie danych i dostępna
                      po ponownym zalogowaniu.
                    </p>
                  )}
                  <p className="text-sm pt-2 font-semibold text-foreground">
                    Pamiętaj: Moje odpowiedzi nie zastępują profesjonalnej
                    porady prawnej.
                  </p>
                </CardContent>
              </Card>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <Avatar className="w-8 h-8 mt-1 flex-shrink-0">
                    <AvatarFallback
                      className={`${msg.isDeepResearch ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"}`}
                    >
                      {msg.isDeepResearch ? (
                        <Zap className="w-4 h-4" />
                      ) : (
                        <Scale className="w-4 h-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary/90 text-primary-foreground shadow-sm"
                      : "bg-card border shadow-sm"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-primary">
                        Stefan
                      </p>
                      <button
                        onClick={() => handleSaveNote(msg.content, idx)}
                        disabled={savingNoteIdx === idx}
                        title={
                          savedNoteIdx.has(idx)
                            ? "Zapisano jako notatkę"
                            : "Zapisz jako notatkę"
                        }
                        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors ${
                          savedNoteIdx.has(idx)
                            ? "text-green-600 bg-green-50 dark:bg-green-950/30"
                            : "text-muted-foreground hover:text-primary hover:bg-muted"
                        }`}
                      >
                        {savingNoteIdx === idx ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : savedNoteIdx.has(idx) ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Bookmark className="w-3 h-3" />
                        )}
                        {savedNoteIdx.has(idx) ? "Zapisano" : "Notatka"}
                      </button>
                    </div>
                  )}
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <Streamdown>{msg.content}</Streamdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </p>
                  )}
                </div>

                {msg.role === "user" && (
                  <Avatar className="w-8 h-8 mt-1 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex gap-3 justify-start">
                <Avatar className="w-8 h-8 mt-1 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Scale className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-card border shadow-sm rounded-2xl px-4 py-3">
                  <p className="text-xs font-semibold text-primary mb-2">
                    Stefan
                  </p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Piszę odpowiedź...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4 bg-card">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Input
              placeholder="Wpisz swoje pytanie prawne..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending || isLoadingSession}
              className="flex-1"
            />
            {isSending && (
              <Button
                variant="destructive"
                onClick={handleStop}
                size="lg"
                aria-label="Zatrzymaj odpowiedź Stefana"
                title="Zatrzymaj odpowiedź"
              >
                <Square className="w-4 h-4 fill-current" />
              </Button>
            )}
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isSending || isLoadingSession}
              size="lg"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </StefanLayout>
  );
}
