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
  ArrowRight,
  BookOpenCheck,
  Copyright,
  FileCheck,
  FileText,
  Landmark,
  MessageSquare,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { Link } from "wouter";

const quickActions = [
  {
    title: "Chat z Ekspertem",
    description: "Pytania prawne z restrykcyjną polityką źródeł i odpowiedzi.",
    icon: MessageSquare,
    href: "/chat",
  },
  {
    title: "Analiza dokumentów",
    description: "Analizuj PDF, DOCX lub tekst w kontrolowanym procesie.",
    icon: FileCheck,
    href: "/analysis",
  },
  {
    title: "Szablony pism",
    description: "Pracuj na uporządkowanych materiałach kancelaryjnych.",
    icon: FileText,
    href: "/templates",
  },
];

export default function Home() {
  const recentPublications = trpc.legalNews.getRecent.useQuery();

  return (
    <StefanLayout>
      <div className="container max-w-none py-8 lg:py-10">
        <section className="office-hero relative overflow-hidden rounded-2xl border border-primary/15 px-6 py-8 lg:px-9 lg:py-10">
          <div className="relative max-w-3xl">
            <div className="office-eyebrow mb-3">
              <Scale className="size-4" />
              KancelariaAI · przestrzeń robocza
            </div>
            <h1 className="font-office text-3xl font-semibold tracking-tight text-foreground lg:text-5xl">
              System Stefan
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground lg:text-lg">
              Asystent prawny dla uporządkowanej pracy z dokumentami, KSeF i
              źródłami urzędowymi.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/5 px-3 py-1 text-primary"
              >
                <ShieldCheck className="mr-1.5 size-3.5" />
                Weryfikacja przed odpowiedzią
              </Badge>
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/5 px-3 py-1 text-primary"
              >
                <BookOpenCheck className="mr-1.5 size-3.5" />
                Źródła urzędowe
              </Badge>
            </div>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="workspaces-heading">
          <div className="mb-4">
            <div className="office-eyebrow mb-2">Praca merytoryczna</div>
            <h2
              id="workspaces-heading"
              className="font-office text-2xl font-semibold text-foreground"
            >
              Główne funkcje
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="office-resource group rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="mb-5 flex size-10 items-center justify-center rounded-lg bg-primary/8 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-office text-lg font-semibold text-foreground group-hover:text-primary">
                    {action.title}
                  </h3>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">
                    {action.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Otwórz moduł{" "}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section
          className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.75fr)]"
          aria-labelledby="publication-heading"
        >
          <Card className="overflow-hidden border-border shadow-sm">
            <CardHeader className="border-b border-border/80 bg-muted/25 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="office-eyebrow mb-2">
                    <Landmark className="size-4" />
                    Monitor publikacji
                  </div>
                  <CardTitle
                    id="publication-heading"
                    className="font-office text-xl"
                  >
                    Najnowsze akty w bazie
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Synchronizacja ELI: Dziennik Ustaw i Monitor Polski.
                  </CardDescription>
                </div>
                <Link href="/knowledge" className="office-link">
                  Baza Wiedzy <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentPublications.isLoading ? (
                <div className="space-y-3 p-5">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : recentPublications.data &&
                recentPublications.data.length > 0 ? (
                <div className="divide-y divide-border/80">
                  {recentPublications.data.slice(0, 3).map(item => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block px-5 py-4 transition-colors hover:bg-primary/[0.025]"
                    >
                      <div className="mb-1 text-xs font-medium text-primary">
                        {item.source} ·{" "}
                        {formatPublicationDate(item.date, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }) ?? "Publikacja urzędowa"}
                      </div>
                      <p className="line-clamp-2 font-medium leading-6 text-foreground">
                        {item.title}
                      </p>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-5 text-sm leading-6 text-muted-foreground">
                  Brak bieżących publikacji w lokalnej kopii. Kolejny Heartbeat
                  sprawdzi oficjalne ELI bez stosowania danych przykładowych.
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-primary/15 bg-card shadow-sm">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/8 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <CardTitle className="font-office text-xl">
                Standard zaufania Stefana
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              Stefan nie uzupełnia niepewności domysłem. Gdy nie może
              potwierdzić źródła, powinien to zakomunikować i wskazać drogę
              weryfikacji w ISAP lub odpowiednim serwisie urzędowym.
              <div className="space-y-3 border-t border-border/80 pt-4">
                <div className="flex gap-2.5">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p>
                    <span className="font-semibold text-foreground">
                      Kontrola techniczna:
                    </span>{" "}
                    walidacja źródeł, konfiguracji modelu i odpowiedzi przed
                    udostępnieniem.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <BookOpenCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p>
                    <span className="font-semibold text-foreground">
                      Jawność zasad:
                    </span>{" "}
                    opis technologii, danych i ograniczeń dostępny jest w
                    informacji o systemie.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <Copyright className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p>
                    <span className="font-semibold text-foreground">
                      Prawa autorskie:
                    </span>{" "}
                    materiały Stefana pozostają objęte ochroną prawnoautorską.
                  </p>
                </div>
              </div>
              <p className="rounded-lg bg-muted/55 px-3 py-2 text-xs leading-5">
                Mechanizmy wspierają bezpieczną pracę i transparentność, ale nie
                są formalną certyfikacją RODO, AI Act ani cyberbezpieczeństwa.
              </p>
              <Link href="/about" className="office-link">
                Informacje o bezpieczeństwie i zgodności{" "}
                <ArrowRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </StefanLayout>
  );
}
