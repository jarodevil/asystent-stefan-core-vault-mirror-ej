import StefanLayout from "@/components/StefanLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowRight, BookOpenCheck, FileText, MessageSquareText, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";

const guideSteps = [
  {
    title: "1. Zacznij od alertów KSeF",
    description: "W zakładce KSeF sprawdź nieprzeczytane alerty. Otwórz alert i użyj przycisku „Zapytaj Stefana”, aby przekazać do czatu jego treść oraz podstawę prawną.",
    path: "/ksef",
    label: "Otwórz KSeF",
  },
  {
    title: "2. Prowadź rozmowę w jednej sesji",
    description: "Czat zapisuje sesje dla zalogowanego użytkownika. Wróć do poprzedniego wątku w „Zarządzaniu Sesjami”, jeżeli analiza dotyczy tej samej sprawy.",
    path: "/chat",
    label: "Otwórz chat",
  },
  {
    title: "3. Zapisuj istotne odpowiedzi",
    description: "Przy odpowiedzi Stefana wybierz „Notatka”. Zapis trafia do trwałych notatek w bazie i można go wyszukać, przypiąć lub wyeksportować do TXT.",
    path: "/notes",
    label: "Otwórz notatki",
  },
  {
    title: "4. Generuj dokument jako szkic roboczy",
    description: "Po wypełnieniu wzoru wybierz „Generuj dokument”. Podgląd umożliwia wydruk/PDF, pobranie TXT, zapis w bazie oraz przypisanie do karty klienta KSeF.",
    path: "/ksef",
    label: "Otwórz wzory KSeF",
  },
];

export default function Help() {
  const [, navigate] = useLocation();

  return (
    <StefanLayout>
      <div className="container max-w-5xl py-8 space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Pomoc i dokumentacja</h1>
          <p className="text-muted-foreground mt-2">Instrukcja operacyjna Stefana — aktualna na 5 września 2026 r.</p>
        </header>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpenCheck className="w-5 h-5" /> Zasada pracy</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Stefan służy do uporządkowania analizy, obsługi KSeF i tworzenia szkiców. Nie zastępuje kontroli prawnika,
            doradcy podatkowego ani źródła urzędowego. Przed działaniem sprawdź datę, podstawę prawną i aktualny tekst
            aktu w ISAP lub właściwym serwisie administracji.
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {guideSteps.map((step) => (
            <Card key={step.title}>
              <CardHeader><CardTitle className="text-base">{step.title}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{step.description}</p>
                <Button variant="outline" onClick={() => navigate(step.path)} className="gap-2">
                  {step.label}<ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Dokumenty i dane klienta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Dokument utworzony z wzoru ma status szkicu roboczego. Wprowadź korekty, sprawdź kompletność danych, podstawę prawną i wymagania właściwego urzędu przed podpisaniem, wysłaniem lub złożeniem.</p>
            <p>Po użyciu opcji „Zapisz w bazie” dokument pozostaje dostępny dla zalogowanego użytkownika. Można go powiązać z Kartą Klienta KSeF, aby kontynuować pracę bez ponownego wypełniania wzoru.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquareText className="w-5 h-5" /> Pamięć rozmów i notatek</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Historia czatu, sesje i notatki zapisane przy odpowiedziach Stefana są przechowywane w bazie w kontekście konta użytkownika. Dzięki temu można kontynuować sprawę z innego urządzenia po zalogowaniu na to samo konto.</p>
            <p>Własne notatki ze starszego edytora mogą być lokalne dla przeglądarki. W zakładce „Moje Notatki” oba typy są opisane osobno.</p>
          </CardContent>
        </Card>

        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Kontrola bezpieczeństwa AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Stefan działa z temperaturą 0,1 i wymaga linku do ISAP oraz ostrzeżenia w analizie prawnej. Odpowiedź, która nie przejdzie tej kontroli lub zawiera wzorzec próby zmiany zasad systemu, jest blokowana zamiast uzupełniana domysłami.</p>
            <p>W razie blokady doprecyzuj pytanie, załącz właściwy tekst aktu lub przejdź bezpośrednio do oficjalnego źródła. Nie traktuj blokady jako potwierdzenia stanu prawnego.</p>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="p-5 flex gap-3 text-sm text-muted-foreground">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-amber-600" />
            <p><strong className="text-foreground">Ważne:</strong> źródłem aktualnej instrukcji jest ta strona Pomoc. Przestarzały plik PDF instrukcji został wycofany, ponieważ nie opisywał pełnego zakresu funkcji po wersji 4.8.0.</p>
          </CardContent>
        </Card>
      </div>
    </StefanLayout>
  );
}
