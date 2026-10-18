import { ArrowRight, Landmark, Rss } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function OfficialUpdatesBar() {
  const updates = trpc.legalNews.getRecent.useQuery();
  const items = updates.data ?? [];
  const recentItems = items.slice(0, 4);

  return (
    <section
      aria-label="Kanał aktualizacji urzędowych"
      className="sticky top-14 z-20 border-b border-primary/15 bg-card/95 backdrop-blur"
    >
      <div className="flex h-11 items-center gap-3 px-4 lg:px-8">
        <div className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-primary">
          <Rss className="size-3.5" />
          <span className="hidden sm:inline">Kanał RSS</span>
          <span className="sm:hidden">RSS</span>
        </div>
        <div className="min-w-0 flex-1 overflow-hidden" aria-live="polite">
          {updates.isLoading ? (
            <span className="text-sm text-muted-foreground">
              Odczytywanie urzędowych aktualizacji…
            </span>
          ) : recentItems.length > 0 ? (
            <div className="office-ticker-track flex w-max items-center">
              {[false, true].map(isDuplicate => (
                <div
                  key={isDuplicate ? "repeated" : "primary"}
                  aria-hidden={isDuplicate || undefined}
                  className="flex shrink-0 items-center"
                >
                  {recentItems.map(item => (
                    <a
                      key={`${isDuplicate ? "repeat" : "item"}-${item.id}`}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      tabIndex={isDuplicate ? -1 : undefined}
                      className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Landmark className="size-3.5 shrink-0 text-primary" />
                      <span className="text-xs font-semibold text-primary">
                        {item.source}
                      </span>
                      <span className="max-w-[34rem] truncate">
                        {item.title}
                      </span>
                      <span className="mx-2 text-primary/35" aria-hidden="true">
                        ·
                      </span>
                    </a>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              Brak nowych publikacji w lokalnej kopii — synchronizacja sprawdza
              wyłącznie źródła urzędowe.
            </span>
          )}
        </div>
        <Link href="/knowledge" className="office-link shrink-0 text-xs">
          <span className="hidden sm:inline">Baza wiedzy</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
