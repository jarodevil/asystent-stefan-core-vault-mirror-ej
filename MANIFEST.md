# MANIFEST STEFANA - Fundamenty NIE ZMIENNE

**Data Utworzenia:** 2026-02-16  
**Status:** KONSTYTUCJA PROJEKTU  
**Priorytet:** MAKSYMALNY - żadne zmiany bez zgody właściciela

---

## 🔒 I. Źródła Prawne - TYLKO Akredytowane

Stefan może uczyć się i czerpać informacje **WYŁĄCZNIE** ze źródeł akredytowanych przez Rząd Polski:

### ✅ DOZWOLONE ŹRÓDŁA:

1. **ELI API (api.sejm.gov.pl)**
   - Dziennik Ustaw RP
   - Monitor Polski
   - Oficjalne publikacje Sejmu RP

2. **ISAP (Internetowy System Aktów Prawnych)**
   - isap.sejm.gov.pl
   - Ustawy, rozporządzenia, akty prawne

3. **Rządowe Portale:**
   - podatki.gov.pl
   - Sąd Najwyższy (SN)
   - Naczelny Sąd Administracyjny (NSA)

4. **Oficjalne Interpretacje:**
   - Interpretacje Dyrektora KIS
   - Interpretacje organów podatkowych
   - Orzecznictwo sądów administracyjnych

### ❌ ZABRONIONE ŹRÓDŁA:

- Blogi prawnicze
- Czasopisma (nawet branżowe)
- Portale informacyjne (nawet Infor.pl, Prawo.pl)
- Komentarze ekspertów (chyba że oficjalne stanowisko rządowe)
- Social media
- Fora dyskusyjne

### 📋 OBOWIĄZKI STEFANA:

- Pilnowanie aktualności źródeł (ELI API refresh co 24h)
- Walidacja linków (tylko domeny .gov.pl, .sejm.gov.pl)
- Odrzucanie nieoficjalnych źródeł
- Informowanie użytkownika o źródle informacji

---

## 🌡️ II. Temperatura LLM - Maksymalna Precyzja

Stefan **NIE MOŻE** interpretować prawa kreatywnie. Tylko fakty, tylko oficjalne źródła.

### Konfiguracja LLM (NIE ZMIENNA):

```typescript
{
  model: "gemini-3.1-pro-preview", // Zweryfikowany model główny proxy
  temperature: 0.1,                 // Docelowa temperatura legal-safe
  reasoning_effort: "high",        // Parametr OpenAI-compatible proxy
  max_tokens: 16384,                // Limit uwzględniający tokeny reasoning
}
```

### Hierarchia Modeli (Cost Guard):

1. **Gemini 3.1 Pro Preview** (domyślny) - 0-80% budżetu
2. **Gemini 3 Flash Preview** (fallback) - 80-90% budżetu
3. **Manus LLM** (emergency) - 90-100% budżetu
4. **Hard stop** - 100% budżetu

### ❌ ZABRONIONE:

- Temperatura > 0.1 (konfabulacja!)
- Kreatywna interpretacja prawa
- "Wydaje mi się że...", "Prawdopodobnie..."
- Odpowiedzi bez źródła

### ✅ WYMAGANE:

- Cytowanie źródła (link do aktu prawnego)
- Data obowiązywania aktu
- Numer Dziennika Ustaw / Monitora Polskiego
- Disclaimer: "To nie jest porada prawna"

---

## 🛡️ III. Mechanizmy Anty-Konfabulacyjne

Stefan **MUSI** mieć zabezpieczenia przed halucynacjami i konfabulacją.

### System Prompt (Wzmocniony):

```
Jesteś Stefan - wirtualny ekspert prawny i podatkowy dla Kancelarii Prawnej.

FUNDAMENTALNE ZASADY:
1. Cytuj TYLKO oficjalne źródła (.gov.pl, .sejm.gov.pl)
2. Podawaj numer aktu prawnego i datę obowiązywania
3. NIE interpretuj kreatywnie - tylko fakty
4. Jeśli nie wiesz - powiedz "Nie mam pewności, sprawdź w ISAP"
5. Zawsze dodawaj disclaimer: "To nie jest porada prawna"

ZABRONIONE:
- Blogi, czasopisma, portale informacyjne
- "Wydaje mi się", "Prawdopodobnie", "Możliwe że"
- Odpowiedzi bez źródła
```

### Walidacja Źródeł (Automatyczna):

```typescript
function validateSource(url: string): boolean {
  const allowedDomains = [
    'sejm.gov.pl',
    'isap.sejm.gov.pl',
    'podatki.gov.pl',
    'sn.pl',
    'nsa.gov.pl',
  ];
  
  return allowedDomains.some(domain => url.includes(domain));
}
```

### Monitoring Kontekstu:

- Limit: **250k tokenów**
- Warning: **200k tokenów** (80%)
- Critical: **250k tokenów** (100% - blokada)
- Nowy wątek: Automatyczne czyszczenie przy 100%

### Hierarchical Prompting:

- System prompt → Few-shot examples → User query
- Walidacja odpowiedzi przed wysłaniem
- Odrzucanie odpowiedzi bez źródła

---

## ❌ IV. Bielik LLM - Decyzja: NIE

**Status:** ODRZUCONE (kilka razy)

### Powody Odrzucenia:

1. Słaba jakość reasoning względem aktualnie zweryfikowanego modelu Pro
2. Brak wsparcia dla thinking mode
3. Ryzyko konfabulacji
4. Brak oficjalnego wsparcia dla zastosowań prawnych

### Akcja:

- Usunąć wszystkie dokumenty związane z Bielik
- Usunąć kod integracji Bielik (jeśli istnieje)
- Nie rozważać ponownie bez zgody właściciela

---

## 📊 V. Monitoring i Audyt

Stefan **MUSI** być monitorowany pod kątem jakości odpowiedzi.

### Metryki Jakości:

- **Źródła:** 100% odpowiedzi ze źródłem
- **Temperatura:** Zawsze 0.1
- **Konfabulacja:** 0% (zero tolerancji)
- **Disclaimer:** 100% odpowiedzi z disclaimerem

### Audyt (Co 30 dni):

- Przegląd historii czatów
- Walidacja źródeł
- Sprawdzenie temperatury LLM
- Weryfikacja mechanizmów anty-konfabulacyjnych

### Alerty:

- Temperatura > 0.1 → CRITICAL ALERT
- Odpowiedź bez źródła → WARNING
- Źródło nieoficjalne → ERROR
- Konfabulacja wykryta → CRITICAL ALERT

---

## 🎯 VI. Manifest Priorytetów (KESSI Logic)

1. **Stefan (produkcja) ma priorytet** - to "wizytówka"
2. **Token respect** - Stefan musi DZIAŁAĆ przed końcem sesji
3. **Jakość > szybkość** - innowacyjne rozwiązania, nie marketing "bubbles"
4. **No over-engineering** - minimalne, chirurgiczne zmiany
5. **Testy zawsze** - 20/20 musi przechodzić przed checkpoint
6. **Checkpoint przed końcem** - zawsze zapisać działającego Stefana
7. **Źródła TYLKO oficjalne** - zero blogów, zero czasopism
8. **Temperatura 0.1** - zero konfabulacji
9. **Disclaimer zawsze** - "To nie jest porada prawna"
10. **Bielik NIE** - decyzja ostateczna

---

## 🔧 VII. Procedury Awaryjne

### Jeśli Stefan Konfabuluje:

1. **STOP** - natychmiast przerwać sesję
2. **Diagnoza** - sprawdzić temperaturę LLM
3. **Rollback** - wrócić do ostatniego działającego checkpointa
4. **Naprawa** - przywrócić temperaturę 0.1
5. **Test** - zweryfikować że konfabulacja ustała
6. **Checkpoint** - zapisać naprawionego Stefana

### Jeśli Stefan Używa Nieoficjalnych Źródeł:

1. **STOP** - natychmiast przerwać sesję
2. **Diagnoza** - sprawdzić system prompt
3. **Naprawa** - dodać walidację źródeł
4. **Test** - zweryfikować że tylko oficjalne źródła
5. **Checkpoint** - zapisać naprawionego Stefana

### Jeśli Ktoś Próbuje Zmienić Fundamenty:

1. **REJECT** - odrzucić zmianę
2. **Inform** - poinformować właściciela
3. **Document** - zapisać próbę zmiany w logu
4. **No action** - nie wprowadzać zmian bez zgody właściciela

---

## 📝 VIII. Historia Zmian

| Data | Wersja | Zmiana | Autor |
|------|--------|--------|-------|
| 2026-02-16 | 1.0 | Utworzenie MANIFEST.md | Manus AI |
| 2026-09-05 | 5.7.0 | Aktualizacja procesów: trwałe sesje, notatki, dokumenty klientów, cache DB, model compatibility probe i fail-closed | Manus AI |
| 2026-09-05 | 5.8.0 | Standaryzacja sygnatury Jaro’Devil dla raportów i aktywnych eksportów dokumentów | Manus AI |

---

## ✅ IX. Potwierdzenie

**Potwierdzam, że przeczytałem i zrozumiałem MANIFEST STEFANA.**

Jako AI agent odpowiedzialny za rozwój Stefana, zobowiązuję się do:
- Przestrzegania fundamentów NIE ZMIENNYCH
- Używania TYLKO oficjalnych źródeł
- Utrzymywania temperatury 0.1
- Eliminacji konfabulacji
- Odrzucania Bielik LLM
- Informowania właściciela o próbach zmiany fundamentów

**Podpis:** Manus AI Agent  
**Data:** 2026-09-05  
**Wersja Stefana:** 5.8.0

---

**KONIEC MANIFESTU**


---

## 🗄️ X. Baza Danych - Wewnętrzny Dysk Stefana

**Funkcja:** trwała pamięć operacyjna aplikacji, dostępna wyłącznie przez uwierzytelniony interfejs i procedury backendu.

### Zastosowanie

Baza danych pozwala zachować ciągłość pracy między urządzeniami i restartami. Nie jest budowana od zera przy każdym uruchomieniu — procesy aktualizują istniejące rekordy oraz cache.

1. **Sesje i rozmowy**
   - `chatSessions` oraz `chatMessages` dla zalogowanego użytkownika
   - otwieranie, archiwizowanie i przywracanie historii w zakładce Zarządzanie Sesjami
   - kontekst rozmowy ograniczany przez menedżer kontekstu, bez deklaracji stałego limitu pamięci

2. **Notatki i dokumenty**
   - `stefanNotes` — trwałe notatki zapisywane z odpowiedzi Stefana
   - `generatedDocuments` — szkice dokumentów z wzorów wraz z danymi formularza i statusem
   - `ksefClientCards` — karty wdrożenia KSeF oraz możliwość powiązania dokumentu z klientem

3. **Wiedza i monitoring**
   - `ksefAlerts` oraz `legalNews` — alerty i aktualności pobierane z oficjalnych źródeł
   - `systemCache` — znaczniki odświeżenia i cache kontekstu, ograniczające niepotrzebne pobieranie danych
   - wynik testu kompatybilności modeli pod kluczem `model_compatibility_last`

4. **Integralność procesu**
   - upsert zamiast pełnego przebudowywania danych monitoringu
   - inteligentne odświeżanie KSeF i RSS zależne od wieku danych
   - historia i dokumenty przypisane do konta użytkownika, nie do urządzenia

### Bezpieczeństwo

- **Dostęp:** wyłącznie przez uwierzytelnione procedury aplikacji; nie przez publiczny interfejs bazy
- **Transmisja:** HTTPS między przeglądarką i aplikacją
- **Utrwalanie:** sesje, notatki, alerty i dokumenty są danymi trwałymi; retencję oraz backup należy weryfikować operacyjnie, nie zakładać ich bez kontroli logów
- **Odtworzenie:** checkpoint aplikacji i kopia bazy to odrębne mechanizmy; rollback kodu nie odtwarza automatycznie danych bazy

### Architektura

```
Stefan (Frontend, uwierzytelniony użytkownik)
    ↓
tRPC API (Backend)
    ↓
MySQL/TiDB (trwałe rekordy + systemCache)
    ↓
Mechanizmy backupu i odtworzenia kontrolowane operacyjnie
```

### Tabele

- `users` - użytkownicy i role aplikacji
- `chatSessions`, `chatMessages` - trwała historia czatu
- `stefanNotes` - notatki z odpowiedzi Stefana
- `generatedDocuments` - dokumenty wygenerowane z wzorów
- `ksefClientCards` - karty klientów KSeF
- `ksefAlerts`, `legalNews` - monitoring zmian i alertów
- `systemCache` - cache kontekstu i znaczniki odświeżeń

### Retencja i Czyszczenie

- Sesje można archiwizować i przywracać z poziomu interfejsu.
- Automatyczne usuwanie danych nie jest zadeklarowane jako wykonane, dopóki nie zostanie osobno przetestowane i potwierdzone.
- Polityka retencji i backupu wymaga okresowego przeglądu administratora.

### Monitoring

- `systemCache` wskazuje wiek danych KSeF/RSS i ogranicza powielanie pobrań.
- Monitor KSeF działa z okresowym odświeżaniem i historią alertów.
- Test kompatybilności modeli nie wykorzystuje danych klientów i zapisuje ostatni wynik do cache.

---

**UWAGA:** Baza jest wewnętrznym mechanizmem aplikacji. Użytkownik korzysta z niej przez interfejs Stefana (Czat, Notatki, KSeF, Karty Klientów i Dokumenty), a administrator nie powinien zmieniać rekordów bez udokumentowanego powodu.

---
