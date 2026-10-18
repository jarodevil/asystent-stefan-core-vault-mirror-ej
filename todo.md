# Stefan TODO — Aktualna Lista Zadań

## 📊 Status Projektu

| Pole | Wartość |
|---|---|
| **Wersja** | 5.8.0 |
| **Status** | Zmiany 5.8 gotowe lokalnie — oczekują na publikację |
| **Ostatni Checkpoint** | Stefan Audit Pack v1.0 — 475e1090 |
| **Data Aktualizacji** | 2026-09-05 |
| **Testy** | 195/195 pass |
| **Seeder Historyczny** | ✅ Aktywny (90 dni KSeF) |
| **TypeScript** | 0 błędów |
| **Autor** | Pasternak Jarek (Jaro'Devil) |

---

## 🟡 Do Zrobienia — Kolejne Zadania

### Panel Deweloperski — Integracja z Logiką Stefana
- [ ] Middleware logowania błędów (catch all errors → tabela `error_logs`)
- [ ] Detekcja falsyfikacji (porównanie odpowiedzi LLM z whitelistą źródeł)
- [ ] Pamięć stała (zapisywanie preferencji do `dev_settings` między sesjami)

### Optymalizacja Archiwizacji (Stefan 5.0)
- [ ] Kompresja danych przed archiwizacją (gzip)
- [ ] Automatyczna utylizacja sesji starszych niż 90 dni
- [ ] Export zarchiwizowanych danych do S3

### KSeF — Kolejne Etapy
- [x] Karta wdrożenia KSeF dla klienta — formularz check-listy z eksportem PDF
- [x] Seeder historyczny KSeF — zasilenie bazy danymi z ostatnich 90 dni (ELI API)
- [x] getAllRecentActs rozszerzony o poprzedni rok (pokrycie 90 dni)
- [x] getActsInDateRange — nowa funkcja dla zakresów dat
- [x] seedHistorical procedura tRPC (admin)
- [x] Automatyczny seeder przy starcie serwera (15s delay, idempotentny)
- [x] Integracja alertów KSeF z kontekstem Stefana (askQuestion) — Stefan widzi historię 30 dni z bazy
- [x] Przycisk „Zapytaj Stefana” przy każdym alercie — automatyczne przekierowanie do czatu z kontekstem alertu
- [x] Badge z liczbą nieprzeczytanych na zakładce Alerty (czerwona liczba, aktualizacja co 60s)
- [x] Zakładka Sankcje KSeF — art. 106ni, 5 kategorii kar z podstawami prawnymi i datami aktywacji
- [x] KSEF_SANCTIONS eksportowana stała w ksef-knowledge.ts + procedura getSanctions w routers.ts
- [x] Tabela systemCache w DB — trwały cache z TTL, wzorzec stale-while-revalidate
- [x] Tabela stefanNotes w DB — notatki między sesjami
- [x] Inteligentny seeder — uruchamia się tylko gdy baza pusta lub dane >24h stare
- [x] Inteligentny refresh KSeF — pomija jeśli dane świeże (<6h)
- [x] Inteligentny refresh RSS — pomija jeśli dane świeże (<24h)
- [x] Historia czatu z DB — Chat.tsx ładuje ostatnią sesję z bazy przy starcie
- [x] Sessions router tRPC — getActive, getArchived, getMessages, create, archive, restore, delete
- [x] Sessions.tsx — prawdziwe dane z DB, archiwizacja/przywracanie/usuwanie
- [x] db-sessions.ts — helpers: getUserSessions, createSession, saveMessagePair, getLastSession
- [x] system-cache.ts — cacheGet/cacheSet/cacheGetOrSet/shouldRunSeeder/markSeederRun
- [ ] Autouzupełnianie danych klienta w szablonach (integracja z bazą klientów)

### Raport Techniczny dla p. Agnieszki
- [ ] Stworzenie raportu technicznego (naprawy, rozwój, kontrola jakości)
- [ ] Instrukcja obsługi — aktualizacja do wersji 4.8.0

---

## ✅ Ukończone — Wersja 4.8.0 (2026-04-04)

### Wyszukiwarka alertów KSeF + UI
- [x] Wyszukiwarka alertów KSeF — pole tekstowe (tytuł / treść / podstawa prawna), client-side
- [x] Filtry: źródło (Portal KSeF / ISAP / MF), priorytet, przełącznik "Nieprzeczytane", licznik wyników
- [x] Baner wielkanocny na Home.tsx — aktywny 30.03–13.04.2026, znika automatycznie
- [x] Stopka StefanLayout — logo Jaro'Devil (CDN), wersja v4.7.0→v4.8.0, © 2026, Autor: Pasternak Jarek
- [x] Checkpoint c55fb569

---

## ✅ Ukończone — Wersja 4.7.0 (2026-04-03)

### System Alertów RSS KSeF
- [x] `server/_core/ksef-monitor.ts` — scraper HTTP + filtr ELI API + gov.pl/finanse
- [x] Cron co 6h (0:00 / 6:00 / 12:00 / 18:00) + uruchomienie przy starcie serwera
- [x] Tabela `ksefAlerts` w bazie danych
- [x] `notifyOwner()` przy każdym nowym alercie KSeF
- [x] Panel alertów w `/ksef` — statystyki, lista, oznaczanie jako przeczytane, ręczne odświeżanie
- [x] 32 testy jednostkowe (isKsefRelated, detectPriority) — 126/126 pass
- [x] Checkpoint 41b565a2

---

## ✅ Ukończone — Wersja 4.6.0 (2026-04-03)

### Szablony Pism KSeF
- [x] `server/ksef-templates.ts` — 7 szablonów z pełnymi treściami i podstawami prawnymi
- [x] ZAW-FA nadanie/odebranie uprawnień (art. 106na ust. 4 i 5 ustawy o VAT)
- [x] Wezwanie do faktury korygującej (art. 106j), oświadczenie offline24 (art. 106nf)
- [x] Zawiadomienie tryb awaryjny (art. 106ng), pełnomocnictwo, informacja dla kontrahenta
- [x] Procedury tRPC: `getTemplates`, `getTemplatesByCategory`, `getTemplateCategories`, `fillTemplate`
- [x] Zakładka "Szablony" w `/ksef` — 3-krokowy formularz, eksport TXT + druk/PDF
- [x] 25 testów jednostkowych — 94/94 pass
- [x] Checkpoint d7baae72

---

## ✅ Ukończone — Wersja 4.5.0 (2026-04-02)

### Moduł KSeF (Krajowy System e-Faktur)
- [x] Analiza stanu prawnego z oficjalnych źródeł (ksef.podatki.gov.pl, gov.pl/finanse, Dz. U. 2025 poz. 1203)
- [x] `server/ksef-knowledge.ts` — KSEF_TIMELINE, KSEF_EXCEPTIONS, KSEF_TRANSITIONAL_2026, KSEF_AUTH_METHODS
- [x] `checkKsefObligation()` — kalkulator obowiązku KSeF (0 konfabulacji)
- [x] Router ksef: `getTimeline`, `getExceptions`, `getTransitional2026`, `getAuthMethods`, `checkObligation`, `askQuestion`
- [x] Wstrzyknięcie KSEF_SYSTEM_PROMPT_EXTENSION do głównego system prompt Stefana
- [x] Strona `/ksef` — 4 zakładki: Pytaj Stefana, Kalkulator, Harmonogram, Wyłączenia
- [x] Pozycja "KSeF e-Faktury" w menu StefanLayout
- [x] 30 testów jednostkowych — 69/69 pass
- [x] Checkpoint 250f166c

---

## ✅ Ukończone — Wersja 4.4.x (2026-02-16 → 2026-02-24)

### 4.4.0 — Automatyczne Backupy Bazy Danych
- [x] Backup cron job (mysqldump) co 24h o 02:00 AM
- [x] Upload backupów do S3 (storagePut), retencja 30 dni
- [x] Naprawa parsowania DATABASE_URL (split przed '?')
- [x] Checkpoint 8deff00c

### 4.4.1 — Dokumentacja i Konserwacja
- [x] Utworzenie MANIFEST.md — konstytucja Stefana
- [x] Usunięcie przestarzałych dokumentów (Bielik, Sejm research, Fallback, Audit)
- [x] Checkpoint dce4a92e

---

## ✅ Ukończone — Wersje 4.0 – 4.3.x (archiwum)

<details>
<summary>Stefan 4.3.x — Bezpieczeństwo, Gemini Stable, Kontekst 250k, Archiwizacja</summary>

- [x] 4.3.4 — Naprawa luk bezpieczeństwa (jsPDF, @trpc/server, sameSite: strict, qs override) — Checkpoint 2329c5a4
- [x] 4.3.3 — Gemini Preview → Stable (gemini-3-pro, gemini-3-flash) — Checkpoint 0225663d
- [x] 4.3.2 — Limit kontekstu 50k → 250k tokenów — Checkpoint f05ca053
- [x] 4.3.1 — System monitorowania kontekstu (licznik, alert 80%, blokada 100%) — Checkpoint 60d938b7
- [x] 4.3.0 — Archiwizacja danych + Zarządzanie Sesjami (chatSessions, chatMessages, /sessions) — Checkpoint 77416177

</details>

<details>
<summary>Stefan 4.2.x — PDF/DOCX, Gemini 3 Pro, UI</summary>

- [x] 4.2.5 — ELI API parser fix, 20+ kategorii prawnych — Checkpoint 9611484a
- [x] 4.2.4 — DOCX support (mammoth.js) — Checkpoint 21a819d7
- [x] 4.2.3 — PDF support (pdfjs-dist → zastąpiony Gemini multimodal w 4.7) — Checkpoint fd4a6e20
- [x] 4.2.2 — Gemini 3 Pro Preview, temperatura 0.1, thinking: high — Checkpoint 15f3a034
- [x] 4.2.0 — PDF export + druk (Analysis.tsx, Templates.tsx) — Checkpoint cec66ccb

</details>

<details>
<summary>Stefan 4.1.x — ELI API, RSS, Hierarchical Prompting</summary>

- [x] 4.1.3 — eli-api-client.ts, auto-kategoryzacja aktów — Checkpoint 3e9523f5
- [x] 4.1.2 — RSS Cron Job co 24h, animowany pasek informacyjny
- [x] 4.1.1 — RSS Backend (rss-fetcher.ts), tabela legalNews, temperatura 0.1
- [x] 4.1.0 — Hierarchical Prompting + Few-Shot Learning, analiza Bielik LLM (decyzja: NIE)

</details>

<details>
<summary>Stefan 4.0 i wcześniejsze — Gemini 3, Context Management, SEO</summary>

- [x] 4.0 — Gemini 3 Flash Preview, walidacja prawa podatkowego, źródła rządowe, context 50k
- [x] 3.5 — Meta keywords, Stripe integration (disabled)
- [x] 3.0 — Temperature 0.0-0.3, ISAP API, Document Conversion, LLM Hierarchy

</details>

---

## 🎯 Manifest Priorytetów (KESSI Logic)

1. **Stefan (produkcja) ma priorytet** — to wizytówka kancelarii
2. **Token respect** — Stefan musi DZIAŁAĆ przed końcem sesji
3. **Jakość > szybkość** — innowacyjne rozwiązania, nie marketing "bubbles"
4. **No over-engineering** — minimalne, chirurgiczne zmiany
5. **Testy zawsze** — 126/126 musi przechodzić przed checkpointem
6. **Checkpoint przed końcem** — zawsze zapisać działającego Stefana

---

## 📝 Stack Technologiczny

| Warstwa | Technologia |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Vite |
| Backend | tRPC 11.10.0, Express 4, Node.js |
| AI | Gemini 3.1 Pro Preview + Gemini 3 Flash Preview (fallback), temperatura 0.1 |
| Database | MySQL/TiDB (Drizzle ORM) |
| Document Processing | mammoth (DOCX), Gemini multimodal (PDF) |
| Deployment | Manus platform (kancelaria-mefa9ha9.manus.space) |
| Bezpieczeństwo | sameSite: strict, pnpm audit: 0 HIGH/CRITICAL, backup co 24h |

---

**Ostatnia aktualizacja:** 2026-04-04 — Pasternak Jarek

## ✅ Karta Wdrożenia KSeF dla Klienta — 2026-04-04

- [x] Tabela `ksefClientCards` w drizzle/schema.ts + migracja SQL
- [x] Backend tRPC: getClientCards, getClientCard, createClientCard, updateClientCard, deleteClientCard
- [x] Frontend: strona /ksef/klient — lista kart z paskiem postępu, formularz, statystyki
- [x] Eksport PDF z jsPDF (po stronie klienta, bez serwera) — A4, nagłówek, check-lista, stopka
- [x] Pozycja "Karty Klientów KSeF" w menu StefanLayout
- [x] 26 testów jednostkowych (check-lista, NIP, statusy, PDF) — 152/152 pass

## ✅ Sezonowy System Banerów — 2026-04-04

- [x] `client/src/lib/seasonal-banners.ts` — algorytm Gaussa dla Wielkanocy, 17 banerów polskich świąt
- [x] Dynamiczny komponent `SeasonalBanner.tsx` — zastępuje hardcoded baner wielkanocny w Home.tsx
- [x] sessionStorage — baner można zamknąć, wróci przy nowej sesji
- [x] 37 testów jednostkowych (Gauß, święta ruchome, priorytety) — 189/189 pass

## ✅ Stefan 5.1.0 — Aktualizacja Modeli i Czyszczenie Kodu — 2026-04-04

- [x] Naprawa 4 błędów runtime: trasy bez `/` w App.tsx (settings/pricing/sessions) + try/catch na localStorage/sessionStorage
- [x] Aktualizacja modelu: gemini-2.5-pro (główny) + gemini-2.5-flash (fallback przy 80% budżetu)
- [x] Zaktualizowane pliki: llm.ts, cost-tracker.ts, llmHierarchy.ts, hierarchical-prompting.ts, llm-safety.ts
- [x] 0 błędów TypeScript, 189/189 testów pass

## ✅ Stefan 5.5.0 — Notatki z Odpowiedzi Stefana — GOTOWE

- [x] Tabela `stefanNotes` w DB — tytuł, treść, kategoria, isPinned, sessionId
- [x] Backend tRPC notes router — getAll, getByCategory, search, getCount, create, updateTitle, updateContent, updateCategory, togglePin, delete
- [x] server/db-notes.ts — helpers: getUserNotes, createNote, updateNoteTitle, toggleNotePin, deleteNote, generateNoteTitle, searchNotes
- [x] Chat.tsx — przycisk "Notatka" (ikona Bookmark) przy każdej odpowiedzi Stefana
- [x] Chat.tsx — stan savedNoteIdx: przycisk zmienia się na ✅ "Zapisano" po kliknięciu
- [x] Notes.tsx — dwie zakładki: "Zapisane od Stefana" (DB) + "Notatki własne" (localStorage)
- [x] Wyszukiwarka notatek client-side (tytuł + treść)
- [x] Filtr kategorii: KSeF, Klient, Sprawa, Preferencja, Inne
- [x] Edycja tytułu inline (Enter = zapisz, Escape = anuluj)
- [x] Zmiana kategorii z dropdown w karcie notatki
- [x] Przypinanie notatek (Pin/PinOff) — przypnięte wyświetlane na górze
- [x] Eksport TXT wszystkich notatek
- [x] 189/189 testów pass, 0 błędów TypeScript

## ✅ Stefan 5.6.0 — Pop-up podglądu dokumentu + zapis do bazy klientów — GOTOWE

- [x] Tabela generatedDocuments w DB — templateId, templateTitle, category, content, fieldValues, legalBasis, clientName, clientNip, status, notes
- [x] server/db-documents.ts — helpers: saveGeneratedDocument, getUserDocuments, getClientDocuments, getDocumentById, updateDocumentNotes, updateDocumentStatus, deleteDocument, assignDocumentToClient
- [x] documents router tRPC — getAll, getByClient, getById, save, updateNotes, updateStatus, assignToClient, delete
- [x] DocumentPreviewModal.tsx — pop-up z podglądem dokumentu, nota prawna, stopka, druk/PDF (nowe okno A4), pobierz TXT, zapis do DB, przypisanie do karty klienta
- [x] KSeF.tsx — integracja modalu z KsefTemplates (zastąpienie step preview)
- [x] 0 błędów TypeScript, 189/189 testów pass

## 🔄 Audyt bezpieczeństwa po odtworzeniu — Gemini i kompatybilność
- [x] Zweryfikować HEAD, ostatni checkpoint i integralność repo po restore
- [ ] Opublikować audytowany checkpoint i potwierdzić, że produkcja przeszła z v5.1.0 na wersję audytowaną
- [x] Zidentyfikować faktycznie używany model Gemini oraz fallback i parametry generowania
- [x] Zaudytować system prompt, wykluczenia konfabulacji, walidację odpowiedzi i whitelistę źródeł
- [x] Przygotować testy regresyjne kontraktu modelu, fail-closed i prompt injection
- [ ] Rozszerzyć regresję o aktualność podstawy prawnej i pełną strukturę odpowiedzi na oficjalnych fixture'ach
- [x] Dodać bramkę bezpieczeństwa blokującą niespełniające odpowiedzi przed pokazaniem użytkownikowi
- [ ] Dodać tani cykliczny test kompatybilności modeli z zapisanym raportem i alertem, bez analizy całej bazy — endpoint gotowy, harmonogram po publikacji
- [x] Zweryfikować TypeScript i pełny zestaw testów: 193/193
- [ ] Zapisać checkpoint audytu po zakończeniu zmian

## 🔄 Naprawa runtime React/Vite po hibernacji
- [x] Zdiagnozować duplikację Reacta powodującą Invalid hook call w TRPCProvider
- [x] Ustabilizować aliasy i dedupe React/React DOM oraz oczyścić cache Vite
- [x] Zweryfikować render `/` i brak Invalid hook call w konsoli
- [x] Oddzielić ograniczenie WebSocket podglądu Vite od błędów aplikacji — WebSocket HMR jest ograniczeniem proxy podglądu, nie błędem aplikacji

## 🔄 Aktualizacja dokumentacji i procesów Stefana — 2026-09-05
- [x] Zinwentaryzować nieaktualne opisy na stronach O Systemie i Pomoc oraz w MANIFEST.md
- [x] Zastąpić opis v4.8.0 aktualnym zakresem funkcji po 5.6.0 i audycie bezpieczeństwa
- [x] Ujednolicić nazwę i parametry faktycznie obsługiwanych modeli Gemini oraz Cost Guard
- [x] Opisać trwałe dane: historia czatu, notatki, dokumenty klientów, systemCache i monitoring KSeF
- [x] Opisać proces bezpieczeństwa: źródła urzędowe, fail-closed, prompt-injection, test kompatybilności modeli
- [x] Zweryfikować render ekranów informacyjnych, TypeScript i testy: 193/193
- [ ] Opublikować checkpoint dokumentacji i potwierdzić na live `/about` oraz `/help`

## 🔄 Raport dzienny i standard sygnatury Jaro’Devil — 2026-09-05
- [x] Zinwentaryzować aktywne eksporty i dokumenty zawierające starą sygnaturę
- [x] Ustawić nowy znak Jaro’Devil jako zasób sygnatury dla raportów i eksportów PDF
- [x] Dodać znak do podglądu dokumentu, eksportu karty klienta KSeF, szablonów, analizy i historii czatu
- [x] Opracować raport z rozszerzonego audytu, naprawy runtime, bazy danych i aktualizacji dokumentacji
- [x] Zweryfikować kompilację, testy i wygląd eksportów: TypeScript 0 błędów, 195/195 testów; raport DOCX oraz proxy sygnatury potwierdzone

## 🔄 Naprawa aktualizacji PWA po publikacji — 2026-09-05
- [x] Zmienić strategię nawigacji Service Workera z stale-while-revalidate na network-first z fallbackiem offline
- [x] Podnieść wersję cache PWA i usunąć stare zasoby po aktywacji
- [x] Zweryfikować po restarcie widoczną wersję 5.8.0 oraz nową sygnaturę — potwierdzone w DOM świeżej strony głównej

## 🔄 Biblioteka i skill audytu różnicowego Stefana — optymalizacja kosztów
- [x] Zdefiniować kontrakty krytyczne: modele, fail-closed, źródła prawne, KSeF, trwałość danych, PWA i dokumenty
- [x] Utworzyć wersjonowany manifest komponentów krytycznych z hashami plików oraz klasyfikacją ryzyka
- [x] Utworzyć lokalny skill Stefan Audit Pack z procedurą auditów różnicowych i warunkami pełnego audytu
- [x] Dodać deterministyczny skrypt wykrywający zmiany plików krytycznych bez wywołań LLM
- [x] Dodać skrypt raportu: brak zmian = szybki audit, zmiany krytyczne = eskalacja do pełnego audytu
- [x] Dodać testy kontraktów i instrukcję uruchamiania w projekcie
- [x] Zweryfikować TypeScript, testy — skill valid, 27/27 testów celowanych pass, fast-audit-pass
- [x] Zapisać checkpoint pakietu Stefan Audit Pack — 475e1090

## 🔄 SEO strony głównej
- [x] Ustawić document.title strony głównej w zakresie 30–60 znaków — 53 znaki
- [x] Zweryfikować długość i render tytułu w przeglądarce — potwierdzone w document.title

## 🔄 Audit konfiguracji Google Cloud/Firebase
- [x] Zinwentaryzować obecne sekrety i łączniki bez ujawniania wartości
- [x] Porównać nazwy sekretów wymagane przez kod z bezpieczną historią konfiguracji projektu
- [x] Sprawdzić dostępność używanych integracji i wskazać ewentualne braki po transferze — brak aktywnej integracji Firebase; główna ścieżka LLM używa Forge, nie GEMINI_API_KEY

## 🔄 Zabezpieczenie konfiguracji referencyjnych Firebase
- [x] Zapisać osobno konfigurację referencyjną Firebase `gen-lang-client-0601612946` w sekretach projektu
- [x] Zapisać osobno konfigurację referencyjną Firebase `gen-lang-client-0428019009` w sekretach projektu
- [x] Dodać test, że wartości konfiguracji Firebase nie trafiły do kodu ani repozytorium

## 🔄 Walidacja konta usługi Firebase Admin
- [x] Zweryfikować poświadczenie konta usługi przez minimalny token OAuth, bez wypisywania klucza
- [x] Ustalić projekt, zakresy i możliwość użycia bez dokładania logowania do aplikacji
- [x] Zapisać wyłącznie zatwierdzony model użycia jako chronioną konfigurację serwerową

## 🔄 Mapa projektów i poświadczeń Google/Firebase
- [x] Zinwentaryzować identyfikatory projektów widoczne w konfiguracji oraz aktywnych ścieżkach Stefana
- [x] Rozdzielić klucze webowe Firebase, klucze Gemini Developer API i konto usługi Admin według roli
- [x] Opracować listę: aktywne dla Stefana / referencyjne / do ręcznej decyzji, bez usuwania kluczy

## 🔄 Odzyskiwanie rozmów — weryfikacja
- [x] Sprawdzić trwałość i zakres historii chatSessions/chatMessages po restore — 38 rekordów sesji właściciela, 0 zapisanych wiadomości; brak treści do odzyskania z DB
- [x] Przygotować bezpieczny eksport rozmów z ostatnich 7 dni po właściwym userId, bez ujawniania danych innych użytkowników — nie utworzono, ponieważ zakres zawiera 0 sesji i 0 wiadomości

## 🔄 Stefan 5.6.0 — brakujące elementy dokumentów
- [x] Uzupełnić backend generateDocument z walidacją podstawy prawnej i źródeł urzędowych
- [x] Dodać dokumenty zapisane do widoku karty klienta KSeF
- [x] Zweryfikować przypisywanie generatedDocuments do kart klientów w produkcji

## 🔄 Finalizacja przepływu dokumentów KSeF
- [x] Zinwentaryzować obowiązujące źródła urzędowe i pola podstaw prawnych dla każdego szablonu
- [x] Wymusić odrzucenie zapisu dokumentu bez zweryfikowanej podstawy prawnej
- [x] Dodać listę dokumentów zapisanych do szczegółów Karty Klienta KSeF
- [x] Przetestować przypisanie, ponowne otwarcie i aktualizację statusu dokumentu
- [x] Ograniczyć odczyt, edycję i usuwanie Kart Klientów KSeF do pola `createdBy`
