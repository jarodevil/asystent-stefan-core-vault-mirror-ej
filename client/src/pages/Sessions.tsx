import StefanLayout from "@/components/StefanLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Archive, RotateCcw, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import AccountAccess from "@/components/AccountAccess";

export default function Sessions() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  const utils = trpc.useUtils();

  const { data: activeSessions = [], isLoading: loadingActive } = trpc.sessions.getActive.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: archivedSessions = [], isLoading: loadingArchived } = trpc.sessions.getArchived.useQuery(undefined, {
    enabled: !!user && activeTab === "archived",
  });

  const archiveMutation = trpc.sessions.archive.useMutation({
    onSuccess: () => {
      toast.success("Sesja zarchiwizowana");
      utils.sessions.getActive.invalidate();
      utils.sessions.getArchived.invalidate();
    },
    onError: (e) => toast.error("Błąd archiwizacji", { description: e.message }),
  });

  const restoreMutation = trpc.sessions.restore.useMutation({
    onSuccess: () => {
      toast.success("Sesja przywrócona");
      utils.sessions.getActive.invalidate();
      utils.sessions.getArchived.invalidate();
    },
    onError: (e) => toast.error("Błąd przywracania", { description: e.message }),
  });

  const deleteMutation = trpc.sessions.delete.useMutation({
    onSuccess: () => {
      toast.success("Sesja usunięta");
      utils.sessions.getActive.invalidate();
      utils.sessions.getArchived.invalidate();
    },
    onError: (e) => toast.error("Błąd usuwania", { description: e.message }),
  });

  const handleDownloadPDF = async (sessionId: number, title: string) => {
    toast.info(`Pobieranie historii sesji: ${title}`);
    // TODO: eksport PDF przez trpc.sessions.exportPDF
  };

  const handleArchive = (sessionId: number) => {
    archiveMutation.mutate({ sessionId });
  };

  const handleRestore = (sessionId: number) => {
    restoreMutation.mutate({ sessionId });
  };

  const handleDelete = (sessionId: number, title: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć sesję "${title}"? Ta operacja jest nieodwracalna.`)) return;
    deleteMutation.mutate({ sessionId });
  };

  const formatDate = (d: Date | string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pl-PL", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (!user) {
    return (
      <StefanLayout>
        <div className="container max-w-6xl py-12">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>Zaloguj się, aby zobaczyć historię sesji.</p>
              <AccountAccess variant="inline" />
            </CardContent>
          </Card>
        </div>
      </StefanLayout>
    );
  }

  return (
    <StefanLayout>
      <div className="container max-w-6xl py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Zarządzanie Sesjami</h1>
          <p className="text-muted-foreground">
            Historia rozmów z Stefanem — zapisywana trwale w bazie danych. Sesje nieaktywne przez 30 dni są automatycznie archiwizowane.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="active">
              Aktywne ({activeSessions.length})
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archiwum ({archivedSessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {loadingActive ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : activeSessions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Brak aktywnych sesji. Rozpocznij rozmowę z Stefanem w zakładce Chat.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activeSessions.map((session) => (
                  <Card key={session.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{session.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <MessageSquare className="w-3 h-3" />
                            {session.messageCount} wiadomości
                            <span>·</span>
                            Ostatnia aktywność: {formatDate(session.updatedAt)}
                            <span>·</span>
                            Utworzono: {formatDate(session.createdAt)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPDF(session.id, session.title)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleArchive(session.id)}
                            disabled={archiveMutation.isPending}
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(session.id, session.title)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived">
            {loadingArchived ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : archivedSessions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Brak zarchiwizowanych sesji.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {archivedSessions.map((session) => (
                  <Card key={session.id} className="opacity-80 hover:opacity-100 transition-opacity">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{session.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <MessageSquare className="w-3 h-3" />
                            {session.messageCount} wiadomości
                            <span>·</span>
                            Zarchiwizowano: {formatDate(session.archivedAt)}
                            <span>·</span>
                            Utworzono: {formatDate(session.createdAt)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(session.id)}
                            disabled={restoreMutation.isPending}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Przywróć
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(session.id, session.title)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </StefanLayout>
  );
}
