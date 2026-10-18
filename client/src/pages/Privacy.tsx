import StefanLayout from "@/components/StefanLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clock3,
  Database,
  ExternalLink,
  FileCheck2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { Link } from "wouter";

const requestSteps = [
  [
    "1. Wyślij zgłoszenie",
    "Napisz na adres administratora, wskazując że chodzi o żądanie dotyczące danych osobowych w Systemie Stefan. Nie przesyłaj hasła ani kluczy dostępu.",
  ],
  [
    "2. Określ zakres",
    "Wskaż żądanie: dostęp, sprostowanie, usunięcie, ograniczenie, przeniesienie lub sprzeciw. Podaj adres e-mail użyty przy logowaniu oraz bezpieczny kanał odpowiedzi.",
  ],
  [
    "3. Potwierdź tożsamość",
    "Przed wydaniem danych administrator może poprosić o potwierdzenie tożsamości przez zalogowaną sesję Manus OAuth lub przez wiadomość z adresu powiązanego z kontem.",
  ],
  [
    "4. Otrzymaj odpowiedź",
    "Odpowiedź jest przekazywana bez zbędnej zwłoki, co do zasady w ciągu miesiąca od otrzymania kompletnego żądania. Przy złożonych sprawach termin może zostać przedłużony o maksymalnie dwa kolejne miesiące wraz z uzasadnieniem.",
  ],
] as const;

export default function Privacy() {
  return (
    <StefanLayout>
      <div className="container max-w-7xl space-y-6 py-8 lg:py-10">
        <section className="office-hero rounded-2xl border border-primary/15 px-6 py-7 lg:px-8">
          <div className="max-w-3xl">
            <div className="office-eyebrow mb-3">
              <ShieldCheck className="size-4" /> Dane i przejrzystość
            </div>
            <h1 className="font-office text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Prywatność, retencja danych i RODO
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground lg:text-base">
              Praktyczna informacja o danych przetwarzanych przez System Stefan,
              ich przechowywaniu i sposobie zgłoszenia żądania. Opis dotyczy
              obecnej konfiguracji technicznej aplikacji.
            </p>
          </div>
        </section>

        <section
          className="grid gap-5 lg:grid-cols-3"
          aria-label="Podstawowe informacje o danych"
        >
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <UserRoundCheck className="mb-2 size-5 text-primary" />
              <CardTitle className="font-office text-lg">Dane konta</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Manus OAuth przekazuje identyfikator konta oraz — jeżeli są
              dostępne — imię, adres e-mail i metodę logowania. Dane służą do
              uwierzytelnienia, rozdzielenia danych użytkowników i obsługi
              sesji.
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <Database className="mb-2 size-5 text-primary" />
              <CardTitle className="font-office text-lg">
                Dane robocze
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Zapisane sesje czatu, notatki, dokumenty robocze, karty klientów i
              dane KSeF są przypisane do zalogowanego użytkownika. Nie należy
              umieszczać w pytaniach danych, których przetwarzanie nie jest
              konieczne do celu sprawy.
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <LockKeyhole className="mb-2 size-5 text-primary" />
              <CardTitle className="font-office text-lg">
                Dane lokalne
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Ustawienia interfejsu, takie jak motyw, oraz wybrane dane robocze
              starszego edytora mogą pozostać wyłącznie w pamięci przeglądarki.
              Użytkownik może je usunąć w ustawieniach aplikacji lub w danych
              przeglądarki.
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-office text-xl">
              <Clock3 className="size-5 text-primary" /> Retencja i usuwanie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border p-4">
                <h2 className="font-semibold text-foreground">Sesje czatu</h2>
                <p className="mt-1">
                  Sesje nieaktywne przez ponad 30 dni są automatycznie
                  archiwizowane, a nie kasowane. Użytkownik może przywrócić lub
                  usunąć własną sesję; usunięcie sesji usuwa powiązane
                  wiadomości z aktywnej bazy danych.
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <h2 className="font-semibold text-foreground">
                  Notatki, dokumenty i karty klientów
                </h2>
                <p className="mt-1">
                  Dla tych danych nie ma automatycznego okresu usunięcia w
                  obecnej konfiguracji. Są przechowywane do czasu usunięcia
                  przez uprawnionego użytkownika albo realizacji uzasadnionej
                  dyspozycji administratora.
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <h2 className="font-semibold text-foreground">
                  Kopie zapasowe
                </h2>
                <p className="mt-1">
                  Zautomatyzowany backup bazy jest szyfrowany i zapisywany pod
                  jednym rotującym kluczem. Kolejny poprawny backup zastępuje
                  poprzednią kopię. Usunięte dane mogą więc pozostawać w
                  istniejącej kopii maksymalnie do następnego cyklu backupu.
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <h2 className="font-semibold text-foreground">
                  Sesja logowania
                </h2>
                <p className="mt-1">
                  Po pomyślnym logowaniu aplikacja używa bezpiecznego ciasteczka
                  sesyjnego. Token sesji jest wystawiany maksymalnie na rok i
                  może zostać zakończony przez wylogowanie; dane konta nie mają
                  obecnie automatycznego harmonogramu usunięcia.
                </p>
              </div>
            </div>
            <p className="rounded-lg border border-amber-700/15 bg-amber-50/45 p-4 text-foreground dark:bg-amber-950/15">
              <strong>Ważne:</strong> retencja może podlegać odrębnym obowiązkom
              prawnym administratora kancelarii, w szczególności zasadom
              przechowywania dokumentacji sprawy oraz obrony roszczeń. Przed
              udostępnieniem aplikacji klientom administrator powinien ustalić i
              zatwierdzić właściwe okresy retencji dla danej praktyki.
            </p>
          </CardContent>
        </Card>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.8fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-office text-xl">
                <FileCheck2 className="size-5 text-primary" /> Procedura
                zgłoszenia żądania RODO
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {requestSteps.map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-xl border border-border p-4"
                >
                  <h2 className="font-semibold text-foreground">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/15 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-office text-xl">
                <Mail className="size-5 text-primary" /> Kanał zgłoszeń
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                W obecnej wersji osobnego formularza nie wprowadzono, aby nie
                gromadzić dodatkowych danych. Zgłoszenie można przekazać na:
              </p>
              <a
                className="office-link break-all font-semibold"
                href="mailto:Pasjar1979@gmail.com?subject=%C5%BB%C4%85danie%20RODO%20%E2%80%94%20System%20Stefan"
              >
                Pasjar1979@gmail.com
              </a>
              <p>
                Podaj nazwę Systemu Stefan, zakres żądania i dane pozwalające
                bezpiecznie odnaleźć konto. Nie wysyłaj treści haseł, tokenów,
                kodów jednorazowych ani pełnych danych wrażliwych, jeśli nie są
                konieczne.
              </p>
              <p>
                Przed publicznym udostępnieniem aplikacji administrator powinien
                uzupełnić dane identyfikacyjne administratora, adres kontaktowy
                oraz — jeżeli będzie wymagany — kontakt do inspektora ochrony
                danych.
              </p>
            </CardContent>
          </Card>
        </section>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="font-office text-xl">
              Twoje prawa i źródła
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              W zależności od podstawy i okoliczności przetwarzania możesz żądać
              dostępu do danych, sprostowania, usunięcia, ograniczenia,
              przeniesienia, wnieść sprzeciw oraz złożyć skargę do Prezesa UODO.
              Realizacja żądania może wymagać weryfikacji tożsamości i może
              podlegać ustawowym ograniczeniom.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <a
                className="office-link inline-flex items-center gap-1.5"
                href="https://eur-lex.europa.eu/eli/reg/2016/679/oj"
                target="_blank"
                rel="noreferrer"
              >
                RODO — rozporządzenie (UE) 2016/679{" "}
                <ExternalLink className="size-3.5" />
              </a>
              <a
                className="office-link inline-flex items-center gap-1.5"
                href="https://uodo.gov.pl/en/694"
                target="_blank"
                rel="noreferrer"
              >
                UODO — prawa osoby, której dane dotyczą{" "}
                <ExternalLink className="size-3.5" />
              </a>
              <a
                className="office-link inline-flex items-center gap-1.5"
                href="https://uodo.gov.pl/en/p/complaints"
                target="_blank"
                rel="noreferrer"
              >
                UODO — skarga <ExternalLink className="size-3.5" />
              </a>
            </div>
            <p>
              Informacja ma charakter operacyjny i opisuje aktualne mechanizmy
              aplikacji; nie zastępuje indywidualnej porady prawnej ani
              kompleksowej dokumentacji RODO dla kancelarii.
            </p>
            <Link href="/about" className="office-link font-semibold">
              Wróć do informacji o bezpieczeństwie i zgodności →
            </Link>
          </CardContent>
        </Card>
      </div>
    </StefanLayout>
  );
}
