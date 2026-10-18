import StefanLayout from "@/components/StefanLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Copyright,
  Database,
  ExternalLink,
  FileCheck,
  Info,
  Landmark,
  LockKeyhole,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const features = [
  ["KSeF i alerty", "Kalkulator obowiązku, harmonogram, wyjątki, sankcje, siedem wzorów pism oraz monitoring skonfigurowanych źródeł urzędowych. Alerty i ich podstawa prawna są utrwalane w bazie."],
  ["Praca z klientem", "Karty wdrożenia KSeF, dokumenty wygenerowane z wzorów, przypisanie dokumentu do klienta oraz możliwość ponownego otwarcia szkicu do korekty."],
  ["Czat i notatki", "Historia sesji jest zapisywana dla zalogowanego użytkownika. Odpowiedź Stefana można zapisać jako trwałą notatkę, wyszukać, przypiąć i wyeksportować do TXT."],
  ["Analiza dokumentów", "Analiza plików PDF, DOCX i TXT oraz przygotowanie roboczych dokumentów do druku/PDF. Wzory zawsze wymagają kontroli merytorycznej przed złożeniem do organu."],
  ["Trwała pamięć operacyjna", "systemCache ogranicza ponowne pobieranie tych samych danych KSeF i RSS. Odświeżanie aktualizuje istniejące dane zamiast budować bazę od początku."],
];

const complianceReferences = [
  {
    label: "RODO — rozporządzenie (UE) 2016/679",
    description: "Oficjalny tekst aktu o ochronie osób fizycznych w związku z przetwarzaniem danych osobowych.",
    href: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
  },
  {
    label: "AI Act — rozporządzenie (UE) 2024/1689",
    description: "Oficjalny tekst unijnych zasad dotyczących systemów sztucznej inteligencji.",
    href: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
  },
  {
    label: "UODO — prawa osoby, której dane dotyczą",
    description: "Materiał organu nadzorczego dotyczący dostępu, sprostowania i usunięcia danych.",
    href: "https://uodo.gov.pl/en/694",
  },
];

export default function About() {
  return (
    <StefanLayout>
      <div className="container max-w-7xl space-y-6 py-8 lg:py-10">
        <section className="office-hero rounded-2xl border border-primary/15 px-6 py-7 lg:px-8">
          <div className="max-w-3xl">
            <div className="office-eyebrow mb-3">
              <ShieldCheck className="size-4" /> Przejrzystość działania
            </div>
            <h1 className="font-office text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Zaufanie, bezpieczeństwo i zgodność
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground lg:text-base">
              Jawny opis stosowanych mechanizmów, technologii oraz ograniczeń Systemu Stefan. Stan techniczny jest opisywany bez deklarowania nieposiadanych certyfikatów.
            </p>
          </div>
        </section>

        <Card className="border-primary/15 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-office text-xl">
              <Info className="size-5 text-primary" /> Stan architektury i zakres odpowiedzialności
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              Stefan jest asystentem prawnym i operacyjnym dla kancelarii. Ułatwia analizę materiału, przygotowanie szkiców, pracę z KSeF oraz porządkowanie wiedzy klienta. Nie jest źródłem wiążącej porady prawnej ani podatkowej i nie zastępuje weryfikacji przez osobę uprawnioną.
            </p>
            <p>
              Warstwa AI korzysta z aktualnie zweryfikowanej konfiguracji: <strong className="text-foreground">Gemini 3.1 Pro Preview</strong> jako model główny oraz <strong className="text-foreground">Gemini 3 Flash Preview</strong> wyłącznie jako fallback przy błędzie transportowym lub usługowym. Temperatura jest stała: <strong className="text-foreground">0,1</strong>; odpowiedź prawna przechodzi kontrolę źródeł i wymaganych ostrzeżeń.
            </p>
          </CardContent>
        </Card>

        <section className="grid gap-5 lg:grid-cols-3" aria-label="Potwierdzone mechanizmy ochronne">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <LockKeyhole className="mb-2 size-5 text-primary" />
              <CardTitle className="font-office text-lg">Dostęp i dane</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Logowanie aplikacji korzysta z Manus OAuth, a sesja jest obsługiwana przez bezpieczne ciasteczko. Dane robocze są zapisywane wyłącznie w mechanizmach skonfigurowanych dla projektu.
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <FileCheck className="mb-2 size-5 text-primary" />
              <CardTitle className="font-office text-lg">Kontrola odpowiedzi</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Odpowiedź bez wymaganej informacji o źródle urzędowym, ostrzeżenia albo z wykrytym wzorcem prompt injection nie jest prezentowana jako analiza Stefana.
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <Workflow className="mb-2 size-5 text-primary" />
              <CardTitle className="font-office text-lg">Audyt zmian</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Zmiany w obszarach krytycznych są porównywane z zatwierdzoną bazą, a model i automatyzacje posiadają celowane testy regresji przed wydaniem.
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-office text-xl">
              <Database className="size-5 text-primary" /> Dane, prywatność i granice zgodności
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Czat, zapisane odpowiedzi Stefana, karty klientów KSeF, alerty i dokumenty tworzone z wzorów są zapisami trwałymi dla zalogowanego użytkownika. Ustawienia przeglądarkowe, takie jak motyw i część notatek starszego edytora, mogą pozostawać lokalnie na urządzeniu.
            </p>
            <p>
              Ustawienia aplikacji umożliwiają eksport oraz usunięcie danych lokalnie zapisanych w przeglądarce. Nie zastępują one procedury obsługi wniosków dotyczących danych utrwalonych w bazie projektu; administrator kancelarii powinien zapewnić właściwą podstawę przetwarzania, retencję, uprawnienia dostępu i obsługę żądań osób, których dane dotyczą.
            </p>
            <p className="rounded-lg border border-amber-700/15 bg-amber-50/45 p-4 text-foreground dark:bg-amber-950/15">
              <strong>Ważne:</strong> System wspiera zasady privacy by design, transparentności i kontroli człowieka, ale nie jest formalnym certyfikatem zgodności z RODO, AI Act, ISO 27001 ani potwierdzeniem zewnętrznego audytu cyberbezpieczeństwa. W szczególności aplikacja nie deklaruje osobnego certyfikatu antywirusowego.
            </p>
          </CardContent>
        </Card>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.8fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-office text-xl">
                <Landmark className="size-5 text-primary" /> Podstawy i materiały referencyjne
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {complianceReferences.map(reference => (
                <a
                  key={reference.href}
                  href={reference.href}
                  target="_blank"
                  rel="noreferrer"
                  className="office-resource rounded-xl border border-border bg-card p-4"
                >
                  <p className="flex items-start justify-between gap-2 font-semibold text-foreground">
                    {reference.label}
                    <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{reference.description}</p>
                </a>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/15 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="font-office text-xl">Technologie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
              <p><strong className="text-foreground">Aplikacja:</strong> React, TypeScript i Vite.</p>
              <p><strong className="text-foreground">Serwer:</strong> Express, tRPC, Drizzle ORM oraz zarządzana baza danych.</p>
              <p><strong className="text-foreground">Usługi:</strong> Manus OAuth, zarządzane przechowywanie plików, Heartbeaty dla aktualizacji oraz backupów.</p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-office text-xl">
              <Workflow className="size-5 text-primary" /> Zakres pracy
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {features.map(([title, description]) => (
              <div key={title} className="rounded-lg border border-border p-4">
                <h3 className="mb-1 font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-office text-xl">
              <Copyright className="size-5 text-primary" /> Autor i prawa autorskie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Autor:</strong> Pasternak Jarek — Jaro&apos;Devil.</p>
            <p><strong className="text-foreground">Kontakt:</strong> <a className="office-link" href="mailto:Pasjar1979@gmail.com">Pasjar1979@gmail.com</a></p>
            <p>© 2026 KancelariaAI. Wszelkie prawa zastrzeżone. Materiały oraz elementy interfejsu nie mogą być kopiowane, rozpowszechniane ani wykorzystywane poza zakresem dozwolonym przez prawo bez zgody uprawnionego.</p>
          </CardContent>
        </Card>
      </div>
    </StefanLayout>
  );
}
