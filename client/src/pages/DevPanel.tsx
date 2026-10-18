import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, RefreshCw, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export default function DevPanel() {
  const [activeTab, setActiveTab] = useState("settings");

  // Queries
  const { data: settings, isLoading: settingsLoading, refetch: refetchSettings } = trpc.dev.getSettings.useQuery();
  const { data: errorLogs, isLoading: errorsLoading } = trpc.dev.getErrorLogs.useQuery({ limit: 50, offset: 0 });
  const { data: unresolvedErrors } = trpc.dev.getUnresolvedErrors.useQuery();
  const { data: qualityMetrics, isLoading: metricsLoading } = trpc.dev.getQualityMetrics.useQuery({ limit: 50, offset: 0 });
  const { data: sourceWhitelist, isLoading: sourcesLoading, refetch: refetchSources } = trpc.dev.getSourceWhitelist.useQuery();

  // Mutations
  const updateSetting = trpc.dev.updateSetting.useMutation({
    onSuccess: () => {
      toast.success("Ustawienie zapisane");
      refetchSettings();
    },
    onError: (error) => {
      toast.error(`Błąd: ${error.message}`);
    },
  });

  const resolveError = trpc.dev.resolveError.useMutation({
    onSuccess: () => {
      toast.success("Błąd oznaczony jako rozwiązany");
      refetchSettings();
    },
  });

  const addSource = trpc.dev.addSource.useMutation({
    onSuccess: () => {
      toast.success("Źródło dodane do whitelisty");
      refetchSources();
    },
  });

  const updateSource = trpc.dev.updateSource.useMutation({
    onSuccess: () => {
      toast.success("Status źródła zaktualizowany");
      refetchSources();
    },
  });

  // Local state for settings
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

  // Initialize local settings from server
  useState(() => {
    if (settings) {
      const settingsMap: Record<string, string> = {};
      settings.forEach((s: any) => {
        settingsMap[s.key] = s.value;
      });
      setLocalSettings(settingsMap);
    }
  });

  const handleSaveSetting = (key: string, value: string) => {
    updateSetting.mutate({ key, value });
  };

  const getSettingValue = (key: string, defaultValue: string = "") => {
    return localSettings[key] || settings?.find((s: any) => s.key === key)?.value || defaultValue;
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Panel Deweloperski</h1>
        <p className="text-muted-foreground">Kontrola pracy Stefana, monitoring jakości, i zarządzanie źródłami</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Ustawienia</TabsTrigger>
          <TabsTrigger value="errors">
            Błędy
            {unresolvedErrors && unresolvedErrors.length > 0 && (
              <Badge variant="destructive" className="ml-2">{unresolvedErrors.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="quality">Jakość</TabsTrigger>
          <TabsTrigger value="sources">Źródła</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kontrola Pracy Stefana</CardTitle>
              <CardDescription>Parametry LLM i system prompts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* System Prompt */}
              <div className="space-y-2">
                <Label htmlFor="system_prompt">System Prompt</Label>
                <Textarea
                  id="system_prompt"
                  value={getSettingValue("system_prompt")}
                  onChange={(e) => setLocalSettings({ ...localSettings, system_prompt: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                  disabled
                />
                <Button
                  size="sm"
                  onClick={() => handleSaveSetting("system_prompt", localSettings.system_prompt || getSettingValue("system_prompt"))}
                  disabled
                >
                  <Save className="w-4 h-4 mr-2" />
                  Zapisz
                </Button>
              </div>

              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
                Polityka runtime jest wymuszana przez kod i checkpoint bezpieczeństwa: Gemini 3.1 Pro Preview, temperatura 0,1,
                reasoning effort high oraz fail-closed. Te pola są widokiem audytowym i nie zmieniają aktywnej konfiguracji.
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperatura runtime: 0,1 (wymuszone)</Label>
                <Slider
                  id="temperature"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[parseFloat(getSettingValue("temperature", "0.1"))]}
                  onValueChange={(value) => {
                    setLocalSettings({ ...localSettings, temperature: value[0].toString() });
                    handleSaveSetting("temperature", value[0].toString());
                  }}
                  disabled
                />
                <p className="text-sm text-muted-foreground">Zmiana wymaga modyfikacji polityki runtime, testów regresyjnych i nowego checkpointu.</p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <Label htmlFor="max_tokens">Limit runtime: 16384 tokenów</Label>
                <Input
                  id="max_tokens"
                  type="number"
                  value="16384"
                  onChange={(e) => setLocalSettings({ ...localSettings, max_tokens: e.target.value })}
                  onBlur={() => handleSaveSetting("max_tokens", localSettings.max_tokens || getSettingValue("max_tokens"))}
                  disabled
                />
              </div>

              {/* Reasoning effort */}
              <div className="space-y-2">
                <Label htmlFor="reasoning_effort">Reasoning effort: high (wymuszone)</Label>
                <Select
                  value="high"
                  onValueChange={(value) => {
                    setLocalSettings({ ...localSettings, reasoning_effort: value });
                    handleSaveSetting("reasoning_effort", value);
                  }}
                  disabled
                >
                  <SelectTrigger id="reasoning_effort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Model */}
              <div className="space-y-2">
                <Label htmlFor="model">Model runtime: Gemini 3.1 Pro Preview</Label>
                <Select
                  value="gemini-3.1-pro-preview"
                  onValueChange={(value) => {
                    setLocalSettings({ ...localSettings, model: value });
                    handleSaveSetting("model", value);
                  }}
                  disabled
                >
                  <SelectTrigger id="model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview — główny</SelectItem>
                    <SelectItem value="gemini-3-flash-preview">Gemini 3 Flash Preview — fallback</SelectItem>
                    <SelectItem value="manus-llm">Manus LLM — awaryjny</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost Guard</CardTitle>
              <CardDescription>Hierarchia modeli (oszczędzanie budżetu)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="cost_guard_enabled"
                  checked={getSettingValue("cost_guard_enabled") === "true"}
                  onChange={(e) => handleSaveSetting("cost_guard_enabled", e.target.checked.toString())}
                  className="w-4 h-4"
                />
                <Label htmlFor="cost_guard_enabled">Włącz Cost Guard</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_guard_threshold_flash">Próg dla Gemini Flash (%)</Label>
                <Input
                  id="cost_guard_threshold_flash"
                  type="number"
                  value={getSettingValue("cost_guard_threshold_flash", "80")}
                  onChange={(e) => setLocalSettings({ ...localSettings, cost_guard_threshold_flash: e.target.value })}
                  onBlur={() => handleSaveSetting("cost_guard_threshold_flash", localSettings.cost_guard_threshold_flash || getSettingValue("cost_guard_threshold_flash"))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_guard_threshold_manus">Próg dla Manus LLM (%)</Label>
                <Input
                  id="cost_guard_threshold_manus"
                  type="number"
                  value={getSettingValue("cost_guard_threshold_manus", "90")}
                  onChange={(e) => setLocalSettings({ ...localSettings, cost_guard_threshold_manus: e.target.value })}
                  onBlur={() => handleSaveSetting("cost_guard_threshold_manus", localSettings.cost_guard_threshold_manus || getSettingValue("cost_guard_threshold_manus"))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          {errorsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : errorLogs && errorLogs.length > 0 ? (
            errorLogs.map((error: any) => (
              <Card key={error.id} className={error.resolved ? "opacity-50" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {error.errorType === "falsification" && <AlertTriangle className="w-5 h-5 text-red-500" />}
                        {error.errorType === "source_mismatch" && <XCircle className="w-5 h-5 text-orange-500" />}
                        {error.errorType === "system_error" && <XCircle className="w-5 h-5 text-yellow-500" />}
                        {error.errorType === "llm_error" && <XCircle className="w-5 h-5 text-blue-500" />}
                        {error.errorType}
                      </CardTitle>
                      <CardDescription>{new Date(error.createdAt).toLocaleString("pl-PL")}</CardDescription>
                    </div>
                    {!error.resolved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveError.mutate({ id: error.id })}
                        disabled={resolveError.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Rozwiąż
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{error.message}</p>
                  {error.context && (
                    <details className="mt-2">
                      <summary className="text-sm text-muted-foreground cursor-pointer">Kontekst</summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">{error.context}</pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Brak błędów do wyświetlenia
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          {metricsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : qualityMetrics && qualityMetrics.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Metryki Jakości</CardTitle>
                <CardDescription>Ostatnie {qualityMetrics.length} pomiarów</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {qualityMetrics.map((metric: any) => (
                    <div key={metric.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {metric.falsificationDetected && <Badge variant="destructive">Falsyfikacja</Badge>}
                        {metric.sourceMismatch && <Badge variant="outline">Niezgodność źródła</Badge>}
                        {metric.confidenceScore && <Badge>Pewność: {metric.confidenceScore}%</Badge>}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(metric.createdAt).toLocaleString("pl-PL")}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Brak metryk do wyświetlenia
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Whitelist Źródeł</CardTitle>
              <CardDescription>Zatwierdzone źródła dla Stefana</CardDescription>
            </CardHeader>
            <CardContent>
              {sourcesLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : sourceWhitelist && sourceWhitelist.length > 0 ? (
                <div className="space-y-2">
                  {sourceWhitelist.map((source: any) => (
                    <div key={source.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{source.domain}</p>
                        {source.description && (
                          <p className="text-sm text-muted-foreground">{source.description}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={source.active ? "outline" : "default"}
                        onClick={() => updateSource.mutate({ id: source.id, active: !source.active })}
                        disabled={updateSource.isPending}
                      >
                        {source.active ? "Dezaktywuj" : "Aktywuj"}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Brak źródeł w whiteliście</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dodaj Źródło</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const domain = formData.get("domain") as string;
                  const description = formData.get("description") as string;
                  addSource.mutate({ domain, description });
                  e.currentTarget.reset();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="domain">Domena</Label>
                  <Input id="domain" name="domain" placeholder="example.gov.pl" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Opis</Label>
                  <Input id="description" name="description" placeholder="Oficjalny portal..." />
                </div>
                <Button type="submit" disabled={addSource.isPending}>
                  {addSource.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Dodaj
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
