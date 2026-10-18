import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import OfficialUpdatesBar from "@/components/OfficialUpdatesBar";
import AccountAccess from "@/components/AccountAccess";
import {
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  FileCheck,
  FileText,
  FolderArchive,
  HelpCircle,
  Home,
  Info,
  Landmark,
  Menu,
  MessageSquare,
  Moon,
  Receipt,
  Scale,
  Settings as SettingsIcon,
  ShieldCheck,
  StickyNote,
  Sun,
  X,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { ReactNode, useEffect, useState } from "react";
import { JARODEVIL_SIGNATURE_URL } from "@/lib/brandSignature";

interface StefanLayoutProps {
  children: ReactNode;
}

type NavigationItem = { path: string; icon: typeof Home; label: string };

type NavigationGroup = { label: string; items: NavigationItem[] };

const navigation: NavigationGroup[] = [
  {
    label: "Przestrzeń pracy",
    items: [
      { path: "/", icon: Home, label: "Strona główna" },
      { path: "/chat", icon: MessageSquare, label: "Chat z Ekspertem" },
      { path: "/analysis", icon: FileCheck, label: "Analiza dokumentów" },
      { path: "/templates", icon: FileText, label: "Szablony pism" },
      { path: "/notes", icon: StickyNote, label: "Moje notatki" },
      { path: "/sessions", icon: FolderArchive, label: "Sesje" },
    ],
  },
  {
    label: "Źródła i rozliczenia",
    items: [
      { path: "/knowledge", icon: BookOpen, label: "Baza Wiedzy" },
      { path: "/ksef", icon: Receipt, label: "KSeF e-Faktury" },
      { path: "/ksef/klient", icon: Building2, label: "Karty klientów KSeF" },
    ],
  },
  {
    label: "System",
    items: [
      { path: "/settings", icon: SettingsIcon, label: "Ustawienia" },
      { path: "/privacy", icon: ShieldCheck, label: "Prywatność i RODO" },
      { path: "/help", icon: HelpCircle, label: "Pomoc" },
      { path: "/about", icon: Info, label: "O systemie" },
    ],
  },
];

export default function StefanLayout({ children }: StefanLayoutProps) {
  const [location] = useLocation();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(() =>
    navigation.find(group => group.items.some(item => item.path === location))?.label ?? navigation[0].label
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem("stefan_theme") as
        | "light"
        | "dark"
        | null;
      if (saved) {
        setTheme(saved);
        document.documentElement.classList.toggle("dark", saved === "dark");
      }
    } catch {
      // Tryb prywatny lub osadzony podgląd może blokować localStorage.
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem("stefan_theme", next);
    } catch {
      /* storage optional */
    }
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    if (!isSidebarOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSidebar();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isSidebarOpen]);

  useEffect(() => {
    const activeGroup = navigation.find(group => group.items.some(item => item.path === location));
    if (activeGroup) setExpandedGroup(activeGroup.label);
  }, [location]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {isSidebarOpen && (
        <>
          <button
            aria-label="Zamknij menu"
            className="fixed inset-0 z-40 bg-slate-950/45"
            onClick={closeSidebar}
          />

          <aside
            id="stefan-navigation"
            aria-label="Menu główne"
            className="fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[17rem] max-w-[calc(100vw-1rem)] flex-col overflow-hidden border-r border-border bg-card shadow-2xl"
          >
        <div className="flex shrink-0 items-center gap-3 px-4 py-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Scale className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-office text-lg font-semibold leading-none text-foreground">
              Stefan
            </h1>
            <p className="mt-1 text-[0.69rem] font-medium tracking-[0.12em] text-muted-foreground uppercase">
              Asystent Prawny AI
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            onClick={closeSidebar}
            aria-label="Zamknij menu"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="mx-4 shrink-0 rounded-lg border border-primary/15 bg-primary/[0.035] px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Landmark className="size-3.5 text-primary" />
            Tryb pracy kontrolowanej
          </div>
          <p className="mt-0.5 text-[0.68rem] leading-4 text-muted-foreground">
            Źródła urzędowe · weryfikacja przed odpowiedzią
          </p>
        </div>

        <ScrollArea className="mt-3 min-h-0 flex-1 px-2 pb-2">
          <nav aria-label="Główna nawigacja" className="space-y-1">
            {navigation.map(group => (
              <section key={group.label} aria-label={group.label}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-[0.62rem] font-bold tracking-[0.13em] text-muted-foreground uppercase transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => setExpandedGroup(current => current === group.label ? "" : group.label)}
                  aria-expanded={expandedGroup === group.label}
                >
                  {group.label}
                  {expandedGroup === group.label ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                </button>
                {expandedGroup === group.label && (
                  <div className="space-y-0.5 pb-2">
                    {group.items.map(item => {
                    const Icon = item.icon;
                    const active = location === item.path;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={closeSidebar}
                        className={`flex min-h-8 items-center gap-2.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="min-w-0 truncate">{item.label}</span>
                      </Link>
                    );
                    })}
                  </div>
                )}
              </section>
            ))}
          </nav>
        </ScrollArea>

        <Separator />
        <div className="shrink-0 p-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="w-full justify-start gap-2 bg-background/60"
          >
            {theme === "light" ? (
              <Moon className="size-4" />
            ) : (
              <Sun className="size-4" />
            )}
            {theme === "light" ? "Tryb ciemny" : "Tryb jasny"}
          </Button>
          <div className="mt-3 flex items-center gap-2.5 px-1">
            <img
              src={JARODEVIL_SIGNATURE_URL}
              alt="Jaro'Devil"
              className="h-6 w-14 object-contain opacity-65 dark:invert"
            />
            <p className="text-[0.66rem] leading-4 text-muted-foreground">
              System Stefan
              <br />© 2026 KancelariaAI
            </p>
          </div>
        </div>
          </aside>
        </>
      )}

      <main className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/80 bg-background/88 px-4 backdrop-blur lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Otwórz menu"
            aria-controls="stefan-navigation"
            aria-expanded={isSidebarOpen}
          >
            <Menu className="size-5" />
          </Button>
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <Scale className="size-4 shrink-0 text-primary" />
            <span className="truncate font-medium text-foreground">
              KancelariaAI
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="hidden text-muted-foreground sm:inline">
              System Stefan
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <AccountAccess />
            <Link
              href="/about"
              className="mr-2 hidden items-center gap-1.5 rounded-md px-2 py-1 font-medium text-primary transition-colors hover:bg-primary/5 lg:inline-flex"
            >
              <ShieldCheck className="size-3.5" />
              Zaufanie i zgodność
            </Link>
            <span className="hidden size-1.5 rounded-full bg-emerald-600 sm:inline" />
            <span className="hidden sm:inline">Interfejs gotowy do pracy</span>
          </div>
        </header>
        <OfficialUpdatesBar />
        {children}
      </main>
    </div>
  );
}
