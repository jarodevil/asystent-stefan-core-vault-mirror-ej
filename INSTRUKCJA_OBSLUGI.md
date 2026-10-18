# KancelariaAI - Instrukcja Obsługi

## Witamy w Przyszłości Doradztwa Prawno-Podatkowego

**KancelariaAI** to zaawansowana aplikacja wykorzystująca sztuczną inteligencję do analizy problemów prawnych, podatkowych i księgowych. W jej sercu znajduje się **Stefan** - wirtualny ekspert o kompetencjach Starszego Partnera kancelarii, który zapewnia precyzyjne, chłodne i profesjonalne analizy oparte na faktach i podstawach prawnych.

---

## Dlaczego Stefan Deklasuje Konkurencję?

Stefan wyróżnia się na tle innych systemów AI dzięki unikalnym cechom technologicznym i funkcjonalnym:

| Cecha | Stefan (KancelariaAI) | Typowa Konkurencja |
|-------|----------------------|-------------------|
| **Streaming odpowiedzi** | ✅ Tekst pojawia się na żywo (jak ChatGPT) | ❌ Czekanie na pełną odpowiedź |
| **Automatyczny fallback** | ✅ 3 modele AI (Gemini 2.0 → Gemini 1.5 → GPT-4) | ❌ Jeden model, brak redundancji |
| **Pamięć 30-dniowa** | ✅ Kontekst rozmowy przez miesiąc | ⚠️ Zazwyczaj 7-14 dni |
| **Persona prawnicza** | ✅ Specjalizacja w prawie PL/UE | ⚠️ Ogólne modele językowe |
| **Weryfikacja źródeł** | ✅ Automatyczna weryfikacja podstaw prawnych | ❌ Brak weryfikacji |
| **Analiza dokumentów** | ✅ PDF, DOC, DOCX do 50 MB | ⚠️ Ograniczone formaty |
| **Generowanie szablonów** | ✅ Profesjonalne pisma prawne | ❌ Brak tej funkcji |
| **Baza wiedzy** | ✅ Wbudowana biblioteka aktów prawnych | ⚠️ Tylko internet |
| **Bezpieczeństwo** | ✅ RODO, szyfrowanie, separacja danych | ⚠️ Różne standardy |
| **Dostępność** | ✅ PWA - działa offline, instalacja 1 klik | ❌ Tylko przeglądarka |

---

## Specyfikacja Techniczna Stefana

### Modele AI

Stefan korzysta z **trzech modeli AI w kolejności priorytetów**:

1. **Google Gemini 2.0 Flash** (główny) - najnowszy model Google, zoptymalizowany pod kątem szybkości i precyzji
2. **Google Gemini 1.5 Pro** (zapasowy) - starszy, ale bardziej stabilny model
3. **OpenAI GPT-4o Mini** (awaryjny) - model OpenAI jako ostatnia linia obrony

Jeśli główny model jest niedostępny, Stefan **automatycznie przełącza się** na model zapasowy bez przerwy w usłudze. System monitoruje zdrowie każdego modelu i resetuje metryki co 5 minut.

### Pamięć i Kontekst

- **Zakres pamięci:** 30 dni historii rozmów
- **Kontekst rozmowy:** Ostatnie 10-15 wiadomości w każdym zapytaniu
- **Archiwizacja:** Automatyczna po 30 dniach
- **Separacja danych:** Każdy użytkownik ma własną historię (nie widzi czatów innych osób)

### Limity Techniczne

| Parametr | Wartość | Uwagi |
|----------|---------|-------|
| **Maksymalny rozmiar pytania** | 100,000 znaków | Zalecane: 5,000-10,000 znaków |
| **Rozmiar dokumentu** | 50 MB | PDF, DOC, DOCX |
| **Czas odpowiedzi** | 2-10 sekund | Zależny od złożoności pytania |
| **Streaming** | Real-time | Tekst pojawia się na żywo |
| **Dostępność** | 99.9% | Dzięki mechanizmowi fallback |

---

## Jak Korzystać z KancelariaAI

### 1. Instalacja PWA (Progressive Web App)

KancelariaAI działa jako **PWA** - można ją zainstalować na dowolnym urządzeniu jednym kliknięciem:

#### Na Komputerze (Chrome, Edge, Opera):
1. Otwórz link do aplikacji w przeglądarce
2. Kliknij ikonę **"Zainstaluj"** w pasku adresu (lub menu ⋮ → "Zainstaluj KancelariaAI")
3. Aplikacja pojawi się jako ikona na pulpicie i w menu Start

#### Na Telefonie (Android):
1. Otwórz link w przeglądarce Chrome
2. Kliknij **"Dodaj do ekranu głównego"**
3. Aplikacja pojawi się jako ikona obok innych aplikacji

#### Na iPhone/iPad (Safari):
1. Otwórz link w Safari
2. Kliknij przycisk **"Udostępnij"** (kwadrat ze strzałką)
3. Wybierz **"Dodaj do ekranu głównego"**

**Zalety PWA:**
- Działa offline (podstawowe funkcje)
- Szybsze ładowanie
- Wygląda jak natywna aplikacja
- Automatyczne aktualizacje

---

### 2. Chat z Ekspertem (Stefan)

To główna funkcja aplikacji - rozmowa z wirtualnym ekspertem prawno-podatkowym.

#### Jak Zadawać Pytania:

**✅ Dobrze:**
> "Prowadzę jednoosobową działalność gospodarczą na ryczałcie. Czy mogę odliczyć VAT od zakupu samochodu osobowego o wartości 80,000 zł?"

**❌ Źle:**
> "Samochód VAT?"

**Wskazówki:**
- Przedstaw problem **zwięźle i rzeczowo**
- Podaj **kontekst** (forma działalności, branża, wartości)
- Zadawaj **konkretne pytania**
- Unikaj emocji i zbędnych szczegółów

#### Funkcje Czatu:

- **Streaming odpowiedzi** - tekst pojawia się na żywo (jak w ChatGPT)
- **Formatowanie Markdown** - pogrubienia, listy, tabele
- **Podstawy prawne** - Stefan automatycznie podaje źródła (ustawy, rozporządzenia)
- **Historia 30 dni** - Stefan pamięta poprzednie pytania w ramach sesji

#### Przykładowe Pytania:

1. **Prawo podatkowe:**
   - "Jakie są stawki VAT dla usług budowlanych w 2024?"
   - "Czy mogę rozliczyć stratę z lat ubiegłych w zeznaniu PIT-36?"

2. **Prawo pracy:**
   - "Jakie są zasady wypowiedzenia umowy o pracę na czas nieokreślony?"
   - "Czy pracodawca może obniżyć wynagrodzenie bez zgody pracownika?"

3. **Prawo cywilne:**
   - "Jakie są terminy przedawnienia roszczeń z tytułu umowy sprzedaży?"
   - "Czy mogę odstąpić od umowy kupna samochodu używanego?"

---

### 3. Analiza Dokumentów

Stefan może przeanalizować dokumenty prawne, umowy, faktury i inne pliki.

#### Obsługiwane Formaty:
- PDF (do 50 MB)
- DOC, DOCX (Microsoft Word)
- Obrazy umów (JPG, PNG) - OCR automatyczny

#### Jak Analizować Dokument:

1. Przejdź do sekcji **"Analiza Dokumentów"**
2. Kliknij **"Prześlij dokument"** lub przeciągnij plik
3. Poczekaj na upload (pasek postępu)
4. Stefan automatycznie:
   - Zidentyfikuje typ dokumentu (umowa, faktura, akt prawny)
   - Wyciągnie kluczowe dane (strony, kwoty, daty, klauzule)
   - Wskaże potencjalne ryzyka lub niezgodności

#### Przykłady Użycia:

- **Umowa o pracę** - weryfikacja zgodności z Kodeksem Pracy
- **Faktura VAT** - sprawdzenie poprawności formalnej
- **Akt notarialny** - analiza klauzul i zobowiązań
- **Dokument prawny** - identyfikacja podstaw prawnych

---

### 4. Szablony Pism

Generuj profesjonalne pisma prawne w kilka sekund.

#### Dostępne Szablony:

| Kategoria | Przykłady |
|-----------|-----------|
| **Prawo pracy** | Wypowiedzenie umowy, wniosek o urlop, reklamacja wynagrodzenia |
| **Prawo cywilne** | Odstąpienie od umowy, wezwanie do zapłaty, reklamacja towaru |
| **Prawo podatkowe** | Wniosek o interpretację, odwołanie od decyzji, korekta deklaracji |
| **Prawo administracyjne** | Wniosek o informację publiczną, skarga do WSA |

#### Jak Wygenerować Pismo:

1. Przejdź do **"Szablony Pism"**
2. Wybierz kategorię i typ pisma
3. Wypełnij formularz (dane stron, kwoty, daty)
4. Kliknij **"Generuj"**
5. Stefan utworzy profesjonalne pismo gotowe do wysłania
6. Pobierz jako **PDF** lub **DOCX**

**Uwaga:** Wygenerowane pisma są **szablonami** - zawsze sprawdź i dostosuj do swojej sytuacji!

---

### 5. Baza Wiedzy

Przeglądaj artykuły prawne i podatkowe z zakresu prawa polskiego i UE.

#### Kategorie:

- **Prawo podatkowe** - VAT, PIT, CIT, akcyza
- **Prawo cywilne** - umowy, zobowiązania, spadki
- **Prawo gospodarcze** - działalność gospodarcza, spółki
- **Prawo pracy** - umowy, wynagrodzenia, urlopy

#### Wyszukiwanie:

- Wpisz frazę w pole wyszukiwania (np. "VAT marża")
- Stefan przeszuka bazę i zwróci najbardziej trafne artykuły
- Kliknij artykuł, aby przeczytać pełną treść

---

## Notes - Zaznaczanie Fragmentów

**Nowość!** Możesz zaznaczać i zapisywać ważne fragmenty odpowiedzi Stefana.

### Jak Korzystać:

1. Zaznacz fragment tekstu w odpowiedzi Stefana
2. Kliknij **"Dodaj do notesu"** w menu kontekstowym
3. Fragment zostanie zapisany w Twoim osobistym notesie
4. Otwórz notes klikając ikonę **📋** w prawym górnym rogu
5. Możesz:
   - **Kopiować** fragmenty do schowka
   - **Eksportować** cały notes do PDF/TXT
   - **Udostępniać** wybrane fragmenty (link)

**Przykład użycia:**
Stefan odpowiedział na pytanie o VAT i podał 5 ustaw. Zaznaczasz tylko te 2, które dotyczą Twojej sytuacji, i zapisujesz w notesie. Później możesz je skopiować do maila lub dokumentu.

---

## Bezpieczeństwo i Prywatność

### RODO i Ochrona Danych

KancelariaAI jest w pełni zgodna z **RODO** (Rozporządzenie UE 2016/679):

- **Szyfrowanie danych** - wszystkie dane są szyfrowane (SSL/TLS)
- **Separacja użytkowników** - każdy użytkownik ma własną bazę danych
- **Prawo do usunięcia** - możesz usunąć swoje dane w każdej chwili
- **Minimalizacja danych** - zbieramy tylko niezbędne informacje
- **Przechowywanie** - dane są przechowywane przez 30 dni, potem archiwizowane

### Co Zbieramy:

- Adres email (do logowania)
- Historia czatu (przez 30 dni)
- Przesłane dokumenty (przez 30 dni)
- Logi techniczne (anonimowe)

### Czego NIE Zbieramy:

- Danych wrażliwych (numer PESEL, dane bankowe)
- Lokalizacji GPS
- Danych z innych aplikacji

### Cookies

Aplikacja używa **tylko niezbędnych cookies**:

- **Sesja** - do zapamiętania logowania
- **Preferencje** - motyw (ciemny/jasny), język

**Nie używamy** cookies reklamowych ani śledzących.

---

## Informacje Prawne

### Zastrzeżenia

**WAŻNE:** Analiza Stefana **nie stanowi porady prawnej ani podatkowej**. W sprawach wymagających wiążącej opinii skonsultuj się z uprawnionym doradcą podatkowym lub prawnikiem.

Stefan:
- ✅ Pomaga zrozumieć przepisy
- ✅ Wskazuje podstawy prawne
- ✅ Analizuje dokumenty
- ❌ NIE zastępuje prawnika/doradcy
- ❌ NIE ponosi odpowiedzialności za decyzje użytkownika

### Zgodność z Prawem UE

KancelariaAI jest zgodna z:

- **RODO** (Rozporządzenie UE 2016/679) - ochrona danych osobowych
- **EU AI Act** (2024) - regulacje dotyczące systemów AI
- **ePrivacy Directive** - cookies i prywatność online
- **Polskie prawo telekomunikacyjne** - usługi elektroniczne

### Virus Free

Aplikacja jest:
- ✅ **Bezpieczna** - skanowana codziennie
- ✅ **Bez wirusów** - certyfikat bezpieczeństwa
- ✅ **Bez malware** - kod open-source (dostępny do audytu)

---

## Kontakt

### Właściciel Aplikacji

**Jarosław Pasternak**  
Email: [pasjar1979@gmail.com](mailto:pasjar1979@gmail.com)

### Wsparcie Techniczne

W przypadku problemów technicznych:
1. Sprawdź sekcję **FAQ** (poniżej)
2. Napisz na: [pasjar1979@gmail.com](mailto:pasjar1979@gmail.com)
3. Opisz problem (zrzut ekranu, komunikat błędu)

**Czas odpowiedzi:** do 24 godzin (dni robocze)

---

## FAQ - Najczęściej Zadawane Pytania

### 1. Czy Stefan zastąpi prawnika?

**Nie.** Stefan to narzędzie wspomagające, które pomaga zrozumieć przepisy i przygotować dokumenty. W sprawach skomplikowanych lub wymagających reprezentacji zawsze skonsultuj się z prawnikiem.

### 2. Czy moje dane są bezpieczne?

**Tak.** Wszystkie dane są szyfrowane, przechowywane zgodnie z RODO i usuwane po 30 dniach. Każdy użytkownik ma oddzielną bazę danych.

### 3. Czy Stefan działa offline?

**Częściowo.** Po zainstalowaniu PWA podstawowe funkcje (przeglądanie historii, notesu) działają offline. Do komunikacji z AI potrzebne jest połączenie internetowe.

### 4. Ile kosztuje korzystanie z KancelariaAI?

Szczegóły cenowe dostępne po kontakcie z właścicielem: [pasjar1979@gmail.com](mailto:pasjar1979@gmail.com)

### 5. Czy Stefan zna aktualne przepisy?

**Tak.** Stefan ma dostęp do aktualnej bazy wiedzy prawnej (aktualizowanej regularnie). Jednak zawsze weryfikuj informacje w oficjalnych źródłach.

### 6. Co się stanie, jeśli model AI będzie niedostępny?

Stefan automatycznie przełączy się na model zapasowy (Gemini 1.5 lub GPT-4). Użytkownik nie zauważy przerwy w usłudze.

### 7. Czy mogę udostępnić link do aplikacji innym osobom?

**Tak.** Każda osoba z linkiem może zalogować się i korzystać z Stefana. Każdy użytkownik ma własną historię czatu (nie widzi czatów innych osób).

---

## Prawa Autorskie

**© 2024 Jarosław Pasternak. Wszelkie prawa zastrzeżone.**

Aplikacja KancelariaAI, w tym kod źródłowy, grafiki, logo i treści, są chronione prawem autorskim. Kopiowanie, modyfikowanie lub dystrybucja bez zgody właściciela jest zabroniona.

**Licencja:** Proprietary (zastrzeżona)

---

## Changelog - Historia Wersji

### v1.2 (Listopad 2024)
- ✅ Streaming odpowiedzi (real-time)
- ✅ Endpoint monitorowania modeli AI
- ✅ Notes do zaznaczania fragmentów
- ✅ Ilustrowana instrukcja obsługi
- ✅ Strony prawne (RODO, Privacy Policy)

### v1.1 (Listopad 2024)
- ✅ Mechanizm automatycznego fallback (3 modele AI)
- ✅ Metryki zdrowia modeli
- ✅ Testy jednostkowe

### v1.0 (Listopad 2024)
- ✅ Chat z Stefanem
- ✅ Analiza dokumentów
- ✅ Generowanie szablonów pism
- ✅ Baza wiedzy
- ✅ PWA (instalacja 1 klik)

---

**Dziękujemy za korzystanie z KancelariaAI!**

*Stefan - Twój wirtualny ekspert prawno-podatkowy. Precyzyjny, chłodny, profesjonalny.*
