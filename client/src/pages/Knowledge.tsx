import StefanLayout from "@/components/StefanLayout";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPublicationDate } from "@/lib/publicationDate";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  CalendarDays,
  ExternalLink,
  Landmark,
  LibraryBig,
  ShieldCheck,
} from "lucide-react";

const coreActs = [
  {
    title: "Kodeks cywilny",
    description: "Podstawowe przepisy prawa cywilnego.",
    url: "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19640160093",
  },
  {
    title: "Kodeks pracy",
    description: "Przepisy regulujące stosunki pracy.",
    url: "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19740240141",
  },
  {
    title: "Kodeks postępowania cywilnego",
    description: "Zasady postępowania w sprawach cywilnych.",
    url: "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19640430296",
  },
];

export default function Knowledge() {
  const officialNews = trpc.legalNews.getAll.useQuery();
  const sourceCatalog = trpc.legalNews.getSourceCatalog.useQuery();
  const publications = officialNews.data ?? [];

  return (
    <StefanLayout>
      <div className="container max-w-7xl py-8 lg:py-10">
        <section className="office-hero mb-8 overflow-hidden rounded-2xl border border-primary/15 px-6 py-7 lg:px-8">
          <div className="max-w-3xl">
            <div className="office-eyebrow mb-3">
              <ShieldCheck className="size-4" />
              Kontrolowany zasób informacyjny
            </div>
            <h1 className="font-office text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Baza Wiedzy
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground lg:text-base">
              Publikacje prezentowane poniżej pochodzą wyłącznie z określonych
              źródeł urzędowych. Stefan nie uzupełnia tej listy przykładową ani
              niezweryfikowaną treścią.
            </p>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.8fr)]">
          <div className="space-y-6">
            <section aria-labelledby="official-publications">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <div className="office-eyebrow mb-2">
                    <Landmark className="size-4" />
                    Dzienniki urzędowe
                  </div>
                  <h2
                    id="official-publications"
                    className="font-office text-2xl font-semibold text-foreground"
                  >
                    Najnowsze publikacje prawne
                  </h2>
                </div>
                <Badge
                  variant="outline"
                  className="border-primary/20 bg-primary/5 text-primary"
                >
                  ELI · Dz.U. / M.P.
                </Badge>
              </div>

              {officialNews.isLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map(item => (
                    <Skeleton key={item} className="h-32 w-full rounded-xl" />
                  ))}
                </div>
              ) : publications.length > 0 ? (
                <div className="space-y-3">
                  {publications.map(item => (
                    <article
                      key={item.id}
                      className="office-record rounded-xl border border-border bg-card p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="size-3.5" />
                              {formatPublicationDate(item.date, {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              }) ?? "Data publikacji niedostępna"}
                            </span>
                            <span aria-hidden="true">•</span>
                            <span>{item.source}</span>
                          </div>
                          <h3 className="font-office text-lg font-semibold leading-snug text-foreground">
                            {item.title}
                          </h3>
                          {item.excerpt && (
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {item.excerpt}
                            </p>
                          )}
                        </div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="office-link shrink-0"
                        >
                          Otwórz publikację{" "}
                          <ExternalLink className="size-3.5" />
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex gap-3 py-7 text-sm text-muted-foreground">
                    <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" />
                    <p>
                      Brak zapisanych publikacji. Automatyczne odświeżenie przez
                      Heartbeat pobierze dane wyłącznie z ELI Sejmu; do tego
                      czasu Stefan nie wstawia danych zastępczych.
                    </p>
                  </CardContent>
                </Card>
              )}
              {officialNews.isError && (
                <p className="mt-3 text-sm text-destructive">
                  Nie udało się odczytać lokalnej kopii publikacji. Spróbuj
                  ponownie później.
                </p>
              )}
            </section>

            <section aria-labelledby="core-acts">
              <div className="mb-4">
                <div className="office-eyebrow mb-2">
                  <BookOpen className="size-4" />
                  Punkt odniesienia
                </div>
                <h2
                  id="core-acts"
                  className="font-office text-2xl font-semibold text-foreground"
                >
                  Podstawowe akty
                </h2>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {coreActs.map(act => (
                  <a
                    key={act.title}
                    href={act.url}
                    target="_blank"
                    rel="noreferrer"
                    className="office-resource group rounded-xl border border-border bg-card p-5 shadow-sm"
                  >
                    <LibraryBig className="mb-4 size-5 text-primary" />
                    <h3 className="font-office font-semibold text-foreground group-hover:text-primary">
                      {act.title}
                    </h3>
                    <p className="mt-2 text-sm leading-5 text-muted-foreground">
                      {act.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      ISAP <ExternalLink className="size-3" />
                    </span>
                  </a>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <Card className="border-primary/15 bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-office text-lg">
                  Rejestr źródeł
                </CardTitle>
                <CardDescription>
                  Zaufane kanały informacji dostępne w Stefanie.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sourceCatalog.isLoading ? (
                  <>
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </>
                ) : (
                  sourceCatalog.data?.map(source => (
                    <a
                      key={source.domain}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-lg border border-border/80 p-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-foreground">
                          {source.name}
                        </span>
                        <ExternalLink className="size-3.5 shrink-0 text-primary" />
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {source.description}
                      </p>
                    </a>
                  ))
                )}
              </CardContent>
            </Card>
            <Card className="border-amber-700/15 bg-amber-50/45 shadow-none dark:bg-amber-950/15">
              <CardContent className="p-5 text-sm leading-6 text-muted-foreground">
                <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                  <ShieldCheck className="size-4 text-primary" />
                  Zasada weryfikacji
                </div>
                Publikacja lub projekt nie jest poradą prawną. Stefan wskazuje
                źródło urzędowe, a przed działaniem należy potwierdzić aktualny
                tekst w ISAP oraz stan sprawy.
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </StefanLayout>
  );
}
