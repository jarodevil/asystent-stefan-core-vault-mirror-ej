# Raport dzienny — System Stefan

**Data:** 5 września 2026 r.  
**Zakres:** odtworzenie stanu, bezpieczeństwo modeli, trwałość danych, KSeF, dokumenty, runtime React/Vite oraz aktualizacja dokumentacji.  
**Sygnatura dokumentu:** Jaro’Devil — Pasternak Jarek.

> **Status:** zmiany są sprawdzone w środowisku roboczym i zapisane w checkpointach. Publiczna domena wymaga ręcznego użycia przycisku **Publish** w panelu projektu, aby pokazać stan 5.8.0 użytkownikom.

## 1. Cel i powód rozszerzenia audytu

Planowy audyt aktualizacyjny miał obejmować kompatybilność Gemini, testy regresyjne promptu, koszt i kontrolę bezpieczeństwa. Po odtworzeniu Stefana z kopii zapasowej wykryto jednak, że sam test modelu był niewystarczający. Konieczne było rozszerzenie zakresu o **integralność odtworzonej wersji, zgodność produkcji z repozytorium, prawdziwość opisu procesów oraz trwałość danych**.

| Wykryte ryzyko | Dlaczego wymagało rozszerzenia audytu | Działanie |
|---|---|---|
| Rozjazd wersji | Publiczna strona wskazywała Stefan v5.1.0, podczas gdy repozytorium zawierało późniejsze moduły. | Zidentyfikowano konieczność publikacji aktualnego checkpointu i opisano ją jako warunek zakończenia. |
| Rozjazd modeli | W konfiguracji, testach i opisach pozostały nieaktualne identyfikatory Gemini. | Ujednolicono runtime, helpery, panel i testy z katalogiem modeli zweryfikowanym podczas audytu. |
| Ryzyko fałszywej odpowiedzi prawnej | Sama niska temperatura nie wystarcza do kontroli konfabulacji ani prompt injection. | Dodano fail-closed, kontrolę wzorca injection oraz testy kontraktu bezpieczeństwa. |
| Niejednolita dokumentacja | Strony informacyjne nadal deklarowały stan v4.8.0 i lokalne przechowywanie danych. | Zastąpiono je opisem aktualnego procesu danych, KSeF i bezpieczeństwa. |
| Błąd runtime w podglądzie | `Invalid hook call` w `TRPCProvider` blokował interfejs po hibernacji. | Ustabilizowano resolucję React/Vite i odbudowano cache zależności. |

## 2. Wykonane prace

### 2.1. KSeF i wiedza operacyjna

Rozszerzono monitoring KSeF o historyczne dane z ELI API i zapis do bazy, aby alerty nie były jedynie chwilowym wynikiem pobrania. Alerty są wstrzykiwane do kontekstu pytań KSeF, dzięki czemu Stefan może odnieść analizę do ostatnich zapisanych zmian zamiast korzystać wyłącznie z wiedzy statycznej. Dodano przycisk kontekstowego pytania o alert, licznik nieprzeczytanych oraz sekcję sankcji KSeF.

### 2.2. Trwałość danych i ciągłość pracy

Wprowadzono `systemCache` dla znaczników odświeżenia KSeF/RSS, co ogranicza ponowne pobieranie tych samych danych przy restarcie. Historia czatu została połączona z `chatSessions` i `chatMessages` w bazie, a notatki z odpowiedzi Stefana z tabelą `stefanNotes`. Dokumenty wygenerowane z wzorów są zapisywane jako `generatedDocuments` i mogą być przypisane do karty klienta KSeF. [1]

### 2.3. Dokumenty i obsługa klienta

Po użyciu funkcji „Generuj dokument” użytkownik otrzymuje podgląd z danymi formularza, notą prawną oraz akcjami druk/PDF, TXT i zapis do bazy. Dokument jest szkicem roboczym — przed podpisem lub złożeniem wymaga sprawdzenia danych, podstawy prawnej i aktualnych wymagań właściwego organu.

### 2.4. Bezpieczeństwo modeli Gemini

Zweryfikowano dostępność modeli przez aktualny proxy katalog i ujednolicono konfigurację na **Gemini 3.1 Pro Preview** jako model główny oraz **Gemini 3 Flash Preview** jako fallback. Temperatura odpowiedzi prawnych pozostaje ustawiona na 0,1. Zamiast „dopisania brakujących elementów” do odpowiedzi, która nie spełnia kryteriów, aktywowano regułę **fail-closed**: odpowiedź z brakującą weryfikacją lub wzorcem prompt injection jest blokowana. [2]

Utworzono lekki probe kompatybilności modeli zapisujący wynik w `systemCache` oraz chroniony endpoint cykliczny dla Heartbeat. Sam harmonogram produkcyjny pozostaje do aktywacji po publikacji aktualnego checkpointu. [3]

### 2.5. Naprawa React/Vite

Problem `Invalid hook call` i `useState` w `TRPCProvider` wynikał z niestabilnego grafu zoptymalizowanych zależności Vite po hibernacji. Zastosowano dokładne aliasy entrypointów React/React DOM, wspólną optymalizację zależności React, React DOM, tRPC i TanStack Query oraz oczyszczono cache Vite. Świeże wejście na stronę główną po naprawie renderuje się bez błędu runtime; konsola przeglądarki była pusta. Błąd WebSocket HMR pozostaje ograniczeniem proxy podglądu, a nie błędem aplikacji produkcyjnej. [4]

Podczas końcowej kontroli wykryto dodatkowo, że poprzedni Service Worker PWA potrafił pokazać stary shell interfejsu mimo aktualnego kodu. Jest to szczególnie niebezpieczne dla aplikacji prawnej, ponieważ użytkownik może pracować na nieaktualnej wersji bez wyraźnego sygnału. Cache PWA podniesiono do `stefan-v5.8.0`, nawigacje zmieniono na **network-first** z fallbackiem offline, a rejestrację Service Workera ustawiono bez cache i z identyfikatorem wydania. Po restarcie potwierdzono widoczną stopkę **System Stefan v5.8.0**. [6]

### 2.6. Dokumentacja i procesy

Strony **O Systemie** i **Pomoc** przepisano na opis rzeczywistego stanu 5.7.0. Usunięto przestarzały PDF instrukcji. `MANIFEST.md` zaktualizowano o bazę danych jako trwałą pamięć operacyjną oraz o prawdziwe ograniczenia retencji, backupu i publikacji. Panel deweloperski prezentuje obecnie politykę runtime jako tylko do odczytu, aby nie sugerować, że ustawienia krytyczne można bezpiecznie zmienić z poziomu formularza.

## 3. Wynik walidacji

| Obszar | Wynik |
|---|---|
| TypeScript | 0 błędów |
| Testy automatyczne | 193/193 zaliczone |
| Render `/`, `/about`, `/help` | potwierdzony w podglądzie |
| Konsola po naprawie React | brak `Invalid hook call` i błędu `TRPCProvider useState` |
| Cache KSeF/RSS | kontrola wieku danych aktywna |
| Sygnatura Jaro’Devil | wprowadzona do aktywnych druków/eksportów i raportu |
| PWA | świeży shell v5.8.0 potwierdzony po aktualizacji Service Workera |

## 4. Standard sygnatury Jaro’Devil

Nowy znak **Jaro’Devil** jest obowiązującą sygnaturą dokumentów, za które odpowiada Pasternak Jarek. Wprowadzono go do podglądu i wydruku dokumentów tworzonych z wzorów, PDF Karty Klienta KSeF, wydruków ogólnych szablonów, raportów analizy dokumentów oraz serwerowego eksportu historii czatu. Zasób jest obsługiwany przez chroniony proxy magazynu, bez kluczy po stronie przeglądarki. [5]

## 5. Otwarte działania i zalecenia

1. **Publikacja:** kliknąć **Publish** dla checkpointu 5.8.0, a następnie potwierdzić na domenie publicznej widok `/about` i `/help`.
2. **Heartbeat:** po publikacji aktywować harmonogram dziennego testu kompatybilności obu modeli oraz obserwować wynik zapisany w `systemCache`.
3. **Archiwizacja sesji:** log podczas audytu wskazał niepowodzenie zadania automatycznej archiwizacji. Przed poleganiem na automatycznym czyszczeniu należy osobno naprawić i przetestować tę procedurę.
4. **Prawo i KSeF:** każdą podstawę prawną, termin oraz dokument przeznaczony do wysyłki należy zweryfikować w ISAP, podatki.gov.pl albo innym właściwym źródle urzędowym.

> **Wniosek:** dzisiejszy audyt został rozszerzony słusznie. Odtworzenie aplikacji, rozjazd wersji produkcyjnej, nieaktualne nazwy modeli, ryzyko błędnej odpowiedzi prawnej oraz błąd runtime tworzyły łączny problem integralności. Zmiany nie polegają wyłącznie na „aktualizacji modelu”; przywracają kontrolę nad całym łańcuchem: źródło → baza → prompt → odpowiedź → dokument → publikacja.

## Referencje

[1]: `drizzle/schema.ts`, `server/_core/system-cache.ts`, `server/db-sessions.ts`, `server/db-notes.ts`, `server/db-documents.ts` — trwałe dane i cache.

[2]: `server/_core/llm.ts`, `server/_core/llm-safety.ts`, `server/routers.ts` — konfiguracja modelu i fail-closed.

[3]: `server/_core/model-compatibility.ts`, `server/_core/index.ts` — probe kompatybilności i endpoint Heartbeat.

[4]: `vite.config.ts`, `server/_core/vite.ts`, checkpoint `6a7ac6b7` — naprawa React/Vite.

[5]: `client/src/lib/brandSignature.ts`, `server/_core/storageProxy.ts`, aktywne powierzchnie wydruku — standard sygnatury.

[6]: `client/public/sw.js`, `client/index.html` — aktualizacja cache PWA i rejestracji Service Workera.

---

**Autor i sygnatura:** Pasternak Jarek — Jaro’Devil  
**Opracowanie techniczne:** Manus AI
