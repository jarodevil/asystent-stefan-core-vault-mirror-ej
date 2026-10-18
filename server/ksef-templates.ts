/**
 * KSeF Document Templates
 * Verified legal templates for KSeF-related correspondence
 *
 * Sources:
 * - ksef.podatki.gov.pl (official KSeF portal)
 * - Ustawa z 05.08.2025 r. (Dz. U. 2025 poz. 1203)
 * - Rozporządzenie MFiG z 07.12.2025 r. (Dz. U. 2025 poz. 1742)
 * - Art. 106 ustawy z 11.03.2004 r. o VAT (Dz. U. 2024 poz. 361 t.j.)
 *
 * Code-Language-Isolation Protocol: types/logic in English, content in Polish
 * Last verified: 2026-04-02
 */

export type KsefTemplateCategory =
  | "uprawnienia"
  | "korekta"
  | "offline"
  | "wdrozenie"
  | "inne";

export interface KsefTemplateField {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  hint?: string;
}

export interface KsefTemplate {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  category: KsefTemplateCategory;
  legalBasis: string;
  fields: KsefTemplateField[];
  /** Template body — use {{field_id}} placeholders */
  body: string;
  notes: string[];
  lastVerified: string;
}

// ============================================================
// TEMPLATE DEFINITIONS
// ============================================================

export const KSEF_TEMPLATES: KsefTemplate[] = [
  // ----------------------------------------------------------
  // 1. ZAW-FA — Zawiadomienie o nadaniu/odebraniu uprawnień
  // ----------------------------------------------------------
  {
    id: "zaw-fa-nadanie",
    title: "ZAW-FA — Zawiadomienie o nadaniu uprawnień do KSeF",
    shortTitle: "ZAW-FA (nadanie)",
    description:
      "Zawiadomienie o nadaniu uprawnień do wystawiania i/lub odbierania faktur w KSeF dla biura rachunkowego lub innego podmiotu. Składane do naczelnika US właściwego dla podatnika.",
    category: "uprawnienia",
    legalBasis:
      "Rozporządzenie MFiG z 12.12.2025 r. w sprawie korzystania z KSeF (Dz. U. 2025 poz. 1815); oficjalny wzór ZAW-FA MF",
    fields: [
      {
        id: "miejscowosc_data",
        label: "Miejscowość i data",
        placeholder: "np. Warszawa, 02.04.2026",
        required: true,
      },
      {
        id: "nazwa_podatnika",
        label: "Pełna nazwa / imię i nazwisko podatnika (zlecającego)",
        placeholder: "np. ABC Sp. z o.o.",
        required: true,
      },
      {
        id: "nip_podatnika",
        label: "NIP podatnika",
        placeholder: "np. 123-456-78-90",
        required: true,
      },
      {
        id: "adres_podatnika",
        label: "Adres siedziby podatnika",
        placeholder: "np. ul. Przykładowa 1, 00-001 Warszawa",
        required: true,
      },
      {
        id: "naczelnik_us",
        label: "Naczelnik Urzędu Skarbowego (właściwy dla podatnika)",
        placeholder: "np. Naczelnik Urzędu Skarbowego Warszawa-Mokotów",
        required: true,
      },
      {
        id: "nazwa_uprawnionego",
        label: "Pełna nazwa / imię i nazwisko podmiotu uprawnianego",
        placeholder: "np. Biuro Rachunkowe XYZ Sp. z o.o.",
        required: true,
      },
      {
        id: "nip_uprawnionego",
        label: "NIP podmiotu uprawnianego",
        placeholder: "np. 987-654-32-10",
        required: true,
      },
      {
        id: "zakres_uprawnien",
        label: "Zakres uprawnień",
        placeholder: "np. wystawianie i odbieranie faktur ustrukturyzowanych",
        required: true,
        hint: "Możliwe: wystawianie faktur / odbieranie faktur / wystawianie i odbieranie faktur / zarządzanie uprawnieniami",
      },
      {
        id: "data_od",
        label: "Data, od której uprawnienie obowiązuje",
        placeholder: "np. 02.04.2026",
        required: true,
      },
      {
        id: "podpis_imie_nazwisko",
        label: "Imię i nazwisko osoby podpisującej",
        placeholder: "np. Jan Kowalski",
        required: true,
      },
      {
        id: "stanowisko",
        label: "Stanowisko / funkcja osoby podpisującej",
        placeholder: "np. Prezes Zarządu",
        required: true,
      },
    ],
    body: `{{miejscowosc_data}}

{{nazwa_podatnika}}
NIP: {{nip_podatnika}}
{{adres_podatnika}}


{{naczelnik_us}}


ZAWIADOMIENIE ZAW-FA
O NADANIU UPRAWNIEŃ DO KORZYSTANIA Z KRAJOWEGO SYSTEMU E-FAKTUR (KSeF)

	Na podstawie art. 106na ust. 4 ustawy z dnia 11 marca 2004 r. o podatku od towarów i usług
	(Dz. U. 2024 poz. 361 t.j., ze zm.) oraz § 3 rozporządzenia Ministra Finansów i Gospodarki
	z dnia 12 grudnia 2025 r. w sprawie korzystania z Krajowego Systemu e-Faktur
	(Dz. U. 2025 poz. 1815), niniejszym zawiadamiam o nadaniu uprawnień do korzystania z KSeF
następującemu podmiotowi:

PODMIOT UPRAWNIONY:
Nazwa / imię i nazwisko: {{nazwa_uprawnionego}}
NIP: {{nip_uprawnionego}}

ZAKRES NADANYCH UPRAWNIEŃ:
{{zakres_uprawnien}}

DATA OBOWIĄZYWANIA UPRAWNIENIA:
Od dnia: {{data_od}}

Uprawnienia zostały/zostaną nadane za pośrednictwem systemu teleinformatycznego KSeF
(ksef.podatki.gov.pl) lub aplikacji e-Urząd Skarbowy.

Niniejsze zawiadomienie składane jest w związku z realizacją obowiązku wynikającego
z art. 106na ust. 4 ustawy o VAT.


................................................
{{podpis_imie_nazwisko}}
{{stanowisko}}
{{nazwa_podatnika}}


POUCZENIE:
Nadanie uprawnień podmiotowi trzeciemu do wystawiania faktur w imieniu podatnika nie zwalnia
podatnika z odpowiedzialności za prawidłowość wystawianych faktur (art. 106d ust. 1 ustawy o VAT).
Uprawnienia można w każdej chwili odwołać poprzez złożenie zawiadomienia ZAW-FA o odebraniu
uprawnień lub bezpośrednio w systemie KSeF.`,
    notes: [
      "Formularz ZAW-FA jest dostępny w systemie e-Urząd Skarbowy i w aplikacji KSeF 2.0 — nadanie uprawnień przez system jest równoważne złożeniu zawiadomienia.",
      "Zawiadomienie składa się do naczelnika US właściwego ze względu na siedzibę podatnika.",
      "Uprawnienia można nadać: do wystawiania faktur, do odbierania faktur, do wystawiania i odbierania faktur, do zarządzania uprawnieniami.",
      "Biuro rachunkowe musi posiadać własny NIP aby uzyskać uprawnienia w KSeF.",
    ],
    lastVerified: "2026-04-02",
  },

  // ----------------------------------------------------------
  // 2. ZAW-FA — Odebranie uprawnień
  // ----------------------------------------------------------
  {
    id: "zaw-fa-odebranie",
    title: "ZAW-FA — Zawiadomienie o odebraniu uprawnień do KSeF",
    shortTitle: "ZAW-FA (odebranie)",
    description:
      "Zawiadomienie o odebraniu (cofnięciu) uprawnień do wystawiania i/lub odbierania faktur w KSeF. Stosowane przy zmianie biura rachunkowego lub zakończeniu współpracy.",
    category: "uprawnienia",
    legalBasis:
      "Rozporządzenie MFiG z 12.12.2025 r. w sprawie korzystania z KSeF (Dz. U. 2025 poz. 1815); oficjalny wzór ZAW-FA MF",
    fields: [
      {
        id: "miejscowosc_data",
        label: "Miejscowość i data",
        placeholder: "np. Warszawa, 02.04.2026",
        required: true,
      },
      {
        id: "nazwa_podatnika",
        label: "Pełna nazwa / imię i nazwisko podatnika",
        placeholder: "np. ABC Sp. z o.o.",
        required: true,
      },
      {
        id: "nip_podatnika",
        label: "NIP podatnika",
        placeholder: "np. 123-456-78-90",
        required: true,
      },
      {
        id: "adres_podatnika",
        label: "Adres siedziby podatnika",
        placeholder: "np. ul. Przykładowa 1, 00-001 Warszawa",
        required: true,
      },
      {
        id: "naczelnik_us",
        label: "Naczelnik Urzędu Skarbowego",
        placeholder: "np. Naczelnik Urzędu Skarbowego Warszawa-Mokotów",
        required: true,
      },
      {
        id: "nazwa_uprawnionego",
        label: "Pełna nazwa podmiotu, któremu odbierane są uprawnienia",
        placeholder: "np. Biuro Rachunkowe XYZ Sp. z o.o.",
        required: true,
      },
      {
        id: "nip_uprawnionego",
        label: "NIP podmiotu",
        placeholder: "np. 987-654-32-10",
        required: true,
      },
      {
        id: "zakres_odebrania",
        label: "Zakres odbieranych uprawnień",
        placeholder: "np. wszystkie uprawnienia nadane dnia 01.01.2026",
        required: true,
      },
      {
        id: "data_od",
        label: "Data, od której odebranie obowiązuje",
        placeholder: "np. 02.04.2026",
        required: true,
      },
      {
        id: "podpis_imie_nazwisko",
        label: "Imię i nazwisko osoby podpisującej",
        placeholder: "np. Jan Kowalski",
        required: true,
      },
      {
        id: "stanowisko",
        label: "Stanowisko",
        placeholder: "np. Prezes Zarządu",
        required: true,
      },
    ],
    body: `{{miejscowosc_data}}

{{nazwa_podatnika}}
NIP: {{nip_podatnika}}
{{adres_podatnika}}


{{naczelnik_us}}


ZAWIADOMIENIE ZAW-FA
O ODEBRANIU UPRAWNIEŃ DO KORZYSTANIA Z KRAJOWEGO SYSTEMU E-FAKTUR (KSeF)

Na podstawie art. 106na ust. 5 ustawy z dnia 11 marca 2004 r. o podatku od towarów i usług
(Dz. U. 2024 poz. 361 t.j., ze zm.) niniejszym zawiadamiam o odebraniu uprawnień do
korzystania z KSeF następującemu podmiotowi:

PODMIOT, KTÓREMU ODBIERANE SĄ UPRAWNIENIA:
Nazwa / imię i nazwisko: {{nazwa_uprawnionego}}
NIP: {{nip_uprawnionego}}

ZAKRES ODBIERANYCH UPRAWNIEŃ:
{{zakres_odebrania}}

DATA OBOWIĄZYWANIA ODEBRANIA:
Od dnia: {{data_od}}

Odebranie uprawnień zostało/zostanie dokonane za pośrednictwem systemu teleinformatycznego
KSeF (ksef.podatki.gov.pl) lub aplikacji e-Urząd Skarbowy.


................................................
{{podpis_imie_nazwisko}}
{{stanowisko}}
{{nazwa_podatnika}}


POUCZENIE:
Po odebraniu uprawnień podmiot nie będzie mógł wystawiać ani odbierać faktur w KSeF
w imieniu podatnika. Faktury wystawione przed odebraniem uprawnień pozostają ważne.`,
    notes: [
      "Odebranie uprawnień można dokonać bezpośrednio w systemie KSeF lub e-Urząd Skarbowy bez konieczności składania papierowego zawiadomienia.",
      "Odebranie uprawnień nie unieważnia faktur wystawionych przez podmiot przed datą odebrania.",
      "Zalecane jest jednoczesne poinformowanie biura rachunkowego o odebraniu uprawnień.",
    ],
    lastVerified: "2026-04-02",
  },

  // ----------------------------------------------------------
  // 3. Wezwanie do wystawienia faktury korygującej w KSeF
  // ----------------------------------------------------------
  {
    id: "wezwanie-korekta-ksef",
    title: "Wezwanie do wystawienia faktury korygującej w KSeF",
    shortTitle: "Wezwanie do korekty",
    description:
      "Wezwanie skierowane do kontrahenta, który wystawił fakturę zawierającą błędy, do wystawienia faktury korygującej za pośrednictwem KSeF. Stosowane gdy kontrahent jest zobowiązany do wystawiania faktur w KSeF.",
    category: "korekta",
    legalBasis:
      "Art. 106j ustawy o VAT; Art. 106na ustawy o VAT (obowiązek KSeF); Dz. U. 2025 poz. 1203",
    fields: [
      {
        id: "miejscowosc_data",
        label: "Miejscowość i data",
        placeholder: "np. Warszawa, 02.04.2026",
        required: true,
      },
      {
        id: "nazwa_wzywajacego",
        label: "Nazwa / imię i nazwisko wzywającego (nabywcy)",
        placeholder: "np. ABC Sp. z o.o.",
        required: true,
      },
      {
        id: "nip_wzywajacego",
        label: "NIP wzywającego",
        placeholder: "np. 123-456-78-90",
        required: true,
      },
      {
        id: "adres_wzywajacego",
        label: "Adres wzywającego",
        placeholder: "np. ul. Przykładowa 1, 00-001 Warszawa",
        required: true,
      },
      {
        id: "nazwa_kontrahenta",
        label: "Nazwa / imię i nazwisko kontrahenta (wystawcy faktury)",
        placeholder: "np. XYZ Sp. z o.o.",
        required: true,
      },
      {
        id: "nip_kontrahenta",
        label: "NIP kontrahenta",
        placeholder: "np. 987-654-32-10",
        required: true,
      },
      {
        id: "adres_kontrahenta",
        label: "Adres kontrahenta",
        placeholder: "np. ul. Inna 2, 00-002 Kraków",
        required: true,
      },
      {
        id: "numer_faktury",
        label: "Numer faktury wymagającej korekty",
        placeholder: "np. FV/2026/04/001",
        required: true,
      },
      {
        id: "data_faktury",
        label: "Data wystawienia faktury",
        placeholder: "np. 01.04.2026",
        required: true,
      },
      {
        id: "numer_ksef",
        label: "Numer KSeF faktury (jeśli znany)",
        placeholder: "np. 1234567890-20260401-ABCDEF",
        required: false,
        hint: "Numer KSeF widoczny w systemie KSeF lub aplikacji podatnika",
      },
      {
        id: "opis_bledu",
        label: "Opis błędu / przyczyna korekty",
        placeholder: "np. błędna stawka VAT (zastosowano 23% zamiast 8%), błędna kwota netto",
        required: true,
      },
      {
        id: "termin_korekty",
        label: "Termin wystawienia korekty",
        placeholder: "np. 14 dni od daty otrzymania niniejszego wezwania",
        required: true,
      },
      {
        id: "podpis_imie_nazwisko",
        label: "Imię i nazwisko osoby podpisującej",
        placeholder: "np. Anna Nowak",
        required: true,
      },
      {
        id: "stanowisko",
        label: "Stanowisko",
        placeholder: "np. Główna Księgowa",
        required: true,
      },
    ],
    body: `{{miejscowosc_data}}

{{nazwa_wzywajacego}}
NIP: {{nip_wzywajacego}}
{{adres_wzywajacego}}


{{nazwa_kontrahenta}}
NIP: {{nip_kontrahenta}}
{{adres_kontrahenta}}


WEZWANIE DO WYSTAWIENIA FAKTURY KORYGUJĄCEJ W KRAJOWYM SYSTEMIE E-FAKTUR (KSeF)

Działając w imieniu {{nazwa_wzywajacego}} (NIP: {{nip_wzywajacego}}), niniejszym wzywam
do wystawienia faktury korygującej w trybie art. 106j ustawy z dnia 11 marca 2004 r.
o podatku od towarów i usług (Dz. U. 2024 poz. 361 t.j., ze zm.) do faktury:

Numer faktury: {{numer_faktury}}
Data wystawienia: {{data_faktury}}
Numer KSeF: {{numer_ksef}}

PRZYCZYNA KOREKTY:
{{opis_bledu}}

Wskazana faktura zawiera błędy wpływające na wysokość zobowiązania podatkowego / prawo
do odliczenia podatku VAT przez nabywcę, co uzasadnia wystawienie faktury korygującej
zgodnie z art. 106j ust. 1 ustawy o VAT.

OBOWIĄZEK WYSTAWIENIA KOREKTY W KSeF:
Informuję, że Państwa podmiot jest zobowiązany do wystawiania faktur w Krajowym Systemie
e-Faktur na podstawie art. 106na ustawy o VAT (Dz. U. 2025 poz. 1203). W związku z tym
faktura korygująca powinna zostać wystawiona wyłącznie za pośrednictwem systemu KSeF.

Wzywam do wystawienia faktury korygującej w terminie: {{termin_korekty}}

Po wystawieniu faktury korygującej w KSeF prosimy o przesłanie jej numeru KSeF na adres
e-mail wskazany w nagłówku niniejszego pisma.

Brak wystawienia faktury korygującej w wyznaczonym terminie może skutkować skierowaniem
sprawy do właściwego naczelnika urzędu skarbowego.


................................................
{{podpis_imie_nazwisko}}
{{stanowisko}}
{{nazwa_wzywajacego}}`,
    notes: [
      "Faktura korygująca w KSeF jest wystawiana przez sprzedawcę — nabywca nie może jej wystawić samodzielnie (nota korygująca została uchylona od 01.02.2026).",
      "Nota korygująca jako instytucja prawna została uchylona z dniem 01.02.2026 (art. 106k ustawy o VAT uchylony).",
      "Korekta in minus: nabywca musi potwierdzić otrzymanie korekty w KSeF (data przypisania numeru KSeF = data doręczenia).",
      "Korekta in plus: nie wymaga potwierdzenia nabywcy — skuteczna z chwilą przypisania numeru KSeF.",
    ],
    lastVerified: "2026-04-02",
  },

  // ----------------------------------------------------------
  // 4. Oświadczenie o korzystaniu z trybu offline24
  // ----------------------------------------------------------
  {
    id: "oswiadczenie-offline24",
    title: "Oświadczenie o korzystaniu z trybu offline24 KSeF",
    shortTitle: "Oświadczenie offline24",
    description:
      "Oświadczenie podatnika o korzystaniu z trybu offline24. Dokument wewnętrzny / dla kontrahenta; fakturę należy przesłać do KSeF najpóźniej w następnym dniu roboczym.",
    category: "offline",
    legalBasis:
      "Art. 106nda ustawy o VAT; ustawa z 05.08.2025 r. (Dz. U. 2025 poz. 1203); oficjalne wyjaśnienia MF: tryb offline24",
    fields: [
      {
        id: "miejscowosc_data",
        label: "Miejscowość i data",
        placeholder: "np. Warszawa, 02.04.2026",
        required: true,
      },
      {
        id: "nazwa_podatnika",
        label: "Pełna nazwa / imię i nazwisko podatnika",
        placeholder: "np. ABC Sp. z o.o.",
        required: true,
      },
      {
        id: "nip_podatnika",
        label: "NIP podatnika",
        placeholder: "np. 123-456-78-90",
        required: true,
      },
      {
        id: "adres_podatnika",
        label: "Adres siedziby",
        placeholder: "np. ul. Przykładowa 1, 00-001 Warszawa",
        required: true,
      },
      {
        id: "data_od",
        label: "Data, od której stosowany jest tryb offline24",
        placeholder: "np. 01.04.2026",
        required: true,
      },
      {
        id: "przyczyna",
        label: "Przyczyna korzystania z trybu offline24",
        placeholder: "np. brak stałego dostępu do internetu w miejscu prowadzenia działalności / awaria systemu",
        required: true,
        hint: "Tryb offline24 jest dostępny dla każdego podatnika bez konieczności uzasadnienia — pole informacyjne",
      },
      {
        id: "podpis_imie_nazwisko",
        label: "Imię i nazwisko osoby podpisującej",
        placeholder: "np. Jan Kowalski",
        required: true,
      },
      {
        id: "stanowisko",
        label: "Stanowisko",
        placeholder: "np. Właściciel / Prezes Zarządu",
        required: true,
      },
    ],
    body: `{{miejscowosc_data}}

{{nazwa_podatnika}}
NIP: {{nip_podatnika}}
{{adres_podatnika}}


OŚWIADCZENIE O KORZYSTANIU Z TRYBU OFFLINE24 W KRAJOWYM SYSTEMIE E-FAKTUR (KSeF)

Niniejszym oświadczam, że {{nazwa_podatnika}} (NIP: {{nip_podatnika}}) korzysta z trybu
	offline24 w Krajowym Systemie e-Faktur (KSeF) na podstawie art. 106nda ustawy z dnia
11 marca 2004 r. o podatku od towarów i usług (Dz. U. 2024 poz. 361 t.j., ze zm.)
w brzmieniu nadanym ustawą z dnia 5 sierpnia 2025 r. (Dz. U. 2025 poz. 1203).

DATA STOSOWANIA TRYBU OFFLINE24:
Od dnia: {{data_od}}

PRZYCZYNA KORZYSTANIA Z TRYBU OFFLINE24:
{{przyczyna}}

	ZASADY TRYBU OFFLINE24 (art. 106nda ustawy o VAT):

1. Faktury wystawiane są w trybie offline24 bez połączenia z systemem KSeF w momencie
   wystawiania.

2. Faktura wystawiona w trybie offline24 jest oznaczana przez oprogramowanie kodem QR
   umożliwiającym weryfikację.

	3. Podatnik jest zobowiązany do przesłania faktury do systemu KSeF niezwłocznie,
	   najpóźniej w następnym dniu roboczym po dniu jej wystawienia.

4. Za datę wystawienia faktury uważa się datę wskazaną w fakturze, a nie datę
   przesłania do KSeF.

5. Numer KSeF jest nadawany fakturze po jej przesłaniu do systemu.

6. Nabywca otrzymuje fakturę bezpośrednio od wystawcy (nie za pośrednictwem KSeF)
   i może ją zweryfikować za pomocą kodu QR.

ZOBOWIĄZANIE:
	Oświadczam, że wszystkie faktury wystawiane w trybie offline24 będą przesyłane do
	systemu KSeF niezwłocznie, najpóźniej w następnym dniu roboczym po ich wystawieniu.


................................................
{{podpis_imie_nazwisko}}
{{stanowisko}}
{{nazwa_podatnika}}


POUCZENIE:
Niedopełnienie obowiązku przesłania faktury do KSeF w terminie 24 godzin może skutkować
sankcjami z art. 106ni ustawy o VAT (od 01.01.2027 r.). W 2026 r. sankcje z art. 106ni
są zawieszone na podstawie przepisów epizodycznych (Dz. U. 2025 poz. 1203).`,
    notes: [
      "Tryb offline24 jest dostępny dla wszystkich podatników zobowiązanych do KSeF — nie wymaga zgłoszenia do US.",
      "Faktura offline24 musi zawierać kod QR umożliwiający weryfikację — generowany przez oprogramowanie podatnika.",
	  "Fakturę należy przesłać do KSeF niezwłocznie, najpóźniej w następnym dniu roboczym po dniu wystawienia.",
      "W 2026 r. sankcje za niedopełnienie obowiązku KSeF (art. 106ni) są zawieszone — wchodzą od 01.01.2027.",
    ],
    lastVerified: "2026-04-02",
  },

  // ----------------------------------------------------------
  // 5. Zawiadomienie o awarii systemu KSeF (tryb awaryjny)
  // ----------------------------------------------------------
  {
    id: "zawiadomienie-awaria-ksef",
    title: "Zawiadomienie o wystawieniu faktur w trybie awaryjnym KSeF",
    shortTitle: "Tryb awaryjny KSeF",
    description:
      "Zawiadomienie do naczelnika US o wystawieniu faktur poza KSeF w czasie awarii systemu ogłoszonej przez MF. Obowiązek złożenia w ciągu 7 dni roboczych od zakończenia awarii.",
    category: "offline",
    legalBasis:
      "Art. 106ng ustawy o VAT (Dz. U. 2025 poz. 1203); § 6 Rozporządzenia MFiG z 07.12.2025 r.",
    fields: [
      {
        id: "miejscowosc_data",
        label: "Miejscowość i data złożenia zawiadomienia",
        placeholder: "np. Warszawa, 02.04.2026",
        required: true,
      },
      {
        id: "nazwa_podatnika",
        label: "Pełna nazwa / imię i nazwisko podatnika",
        placeholder: "np. ABC Sp. z o.o.",
        required: true,
      },
      {
        id: "nip_podatnika",
        label: "NIP podatnika",
        placeholder: "np. 123-456-78-90",
        required: true,
      },
      {
        id: "adres_podatnika",
        label: "Adres siedziby podatnika",
        placeholder: "np. ul. Przykładowa 1, 00-001 Warszawa",
        required: true,
      },
      {
        id: "naczelnik_us",
        label: "Naczelnik Urzędu Skarbowego",
        placeholder: "np. Naczelnik Urzędu Skarbowego Warszawa-Mokotów",
        required: true,
      },
      {
        id: "data_awarii_od",
        label: "Data i godzina rozpoczęcia awarii KSeF (ogłoszona przez MF)",
        placeholder: "np. 01.04.2026 godz. 10:00",
        required: true,
      },
      {
        id: "data_awarii_do",
        label: "Data i godzina zakończenia awarii KSeF",
        placeholder: "np. 01.04.2026 godz. 18:00",
        required: true,
      },
      {
        id: "liczba_faktur",
        label: "Liczba faktur wystawionych w trybie awaryjnym",
        placeholder: "np. 5",
        required: true,
      },
      {
        id: "numery_faktur",
        label: "Numery wystawionych faktur (lub zakres)",
        placeholder: "np. FV/2026/04/001 – FV/2026/04/005",
        required: true,
      },
      {
        id: "podpis_imie_nazwisko",
        label: "Imię i nazwisko osoby podpisującej",
        placeholder: "np. Jan Kowalski",
        required: true,
      },
      {
        id: "stanowisko",
        label: "Stanowisko",
        placeholder: "np. Prezes Zarządu",
        required: true,
      },
    ],
    body: `{{miejscowosc_data}}

{{nazwa_podatnika}}
NIP: {{nip_podatnika}}
{{adres_podatnika}}


{{naczelnik_us}}


ZAWIADOMIENIE O WYSTAWIENIU FAKTUR W TRYBIE AWARYJNYM KSeF

Na podstawie art. 106ng ustawy z dnia 11 marca 2004 r. o podatku od towarów i usług
(Dz. U. 2024 poz. 361 t.j., ze zm.) w brzmieniu nadanym ustawą z dnia 5 sierpnia 2025 r.
(Dz. U. 2025 poz. 1203), niniejszym zawiadamiam o wystawieniu faktur poza Krajowym
Systemem e-Faktur w czasie awarii systemu KSeF ogłoszonej przez Ministra Finansów.

DANE AWARII SYSTEMU KSeF:
Data i godzina rozpoczęcia awarii: {{data_awarii_od}}
Data i godzina zakończenia awarii: {{data_awarii_do}}

FAKTURY WYSTAWIONE W TRYBIE AWARYJNYM:
Liczba faktur: {{liczba_faktur}}
Numery faktur: {{numery_faktur}}

Faktury wymienione powyżej zostały wystawione zgodnie z wymogami formalnymi określonymi
w art. 106e ustawy o VAT i zawierają wszystkie wymagane elementy. Faktury zostaną
przesłane do systemu KSeF niezwłocznie po przywróceniu jego dostępności, zgodnie
z art. 106ng ust. 3 ustawy o VAT.

Niniejsze zawiadomienie składane jest w terminie 7 dni roboczych od zakończenia awarii,
zgodnie z art. 106ng ust. 2 ustawy o VAT.


................................................
{{podpis_imie_nazwisko}}
{{stanowisko}}
{{nazwa_podatnika}}


POUCZENIE:
Faktury wystawione w trybie awaryjnym należy przesłać do KSeF niezwłocznie po
przywróceniu systemu. Numer KSeF zostanie nadany po przesłaniu. Nabywca może
odliczyć VAT z faktury awaryjnej na podstawie jej daty wystawienia.`,
    notes: [
      "Tryb awaryjny jest ogłaszany przez Ministra Finansów na stronie ksef.podatki.gov.pl — podatnik nie może samodzielnie ogłosić awarii.",
      "Zawiadomienie należy złożyć w ciągu 7 dni roboczych od zakończenia awarii (art. 106ng ust. 2 ustawy o VAT).",
      "Faktury awaryjne należy przesłać do KSeF niezwłocznie po przywróceniu systemu.",
      "W 2026 r. sankcje za błędy w KSeF (art. 106ni) są zawieszone — wchodzą od 01.01.2027.",
    ],
    lastVerified: "2026-04-02",
  },

  // ----------------------------------------------------------
  // 6. Pełnomocnictwo do działania w KSeF
  // ----------------------------------------------------------
  {
    id: "pelnomocnictwo-ksef",
    title: "Pełnomocnictwo do działania w systemie KSeF",
    shortTitle: "Pełnomocnictwo KSeF",
    description:
      "Pełnomocnictwo upoważniające osobę fizyczną (np. pracownika biura rachunkowego) do działania w systemie KSeF w imieniu podatnika. Uzupełnienie do ZAW-FA dla konkretnej osoby.",
    category: "uprawnienia",
    legalBasis:
      "Art. 106na ust. 4 ustawy o VAT; Art. 138a–138e Ordynacji podatkowej (Dz. U. 2023 poz. 2383 t.j.)",
    fields: [
      {
        id: "miejscowosc_data",
        label: "Miejscowość i data",
        placeholder: "np. Warszawa, 02.04.2026",
        required: true,
      },
      {
        id: "nazwa_mocodawcy",
        label: "Pełna nazwa / imię i nazwisko mocodawcy (podatnika)",
        placeholder: "np. ABC Sp. z o.o.",
        required: true,
      },
      {
        id: "nip_mocodawcy",
        label: "NIP mocodawcy",
        placeholder: "np. 123-456-78-90",
        required: true,
      },
      {
        id: "adres_mocodawcy",
        label: "Adres siedziby mocodawcy",
        placeholder: "np. ul. Przykładowa 1, 00-001 Warszawa",
        required: true,
      },
      {
        id: "imie_nazwisko_pelnomocnika",
        label: "Imię i nazwisko pełnomocnika",
        placeholder: "np. Anna Nowak",
        required: true,
      },
      {
        id: "pesel_pelnomocnika",
        label: "PESEL pełnomocnika",
        placeholder: "np. 90010112345",
        required: true,
        hint: "PESEL jest wymagany do uwierzytelnienia w systemie KSeF",
      },
      {
        id: "adres_pelnomocnika",
        label: "Adres zamieszkania pełnomocnika",
        placeholder: "np. ul. Inna 5/10, 00-002 Warszawa",
        required: true,
      },
      {
        id: "zakres_pelnomocnictwa",
        label: "Zakres pełnomocnictwa",
        placeholder: "np. wystawianie i odbieranie faktur ustrukturyzowanych w KSeF",
        required: true,
        hint: "Możliwe: wystawianie faktur / odbieranie faktur / wystawianie i odbieranie / zarządzanie uprawnieniami",
      },
      {
        id: "podpis_imie_nazwisko",
        label: "Imię i nazwisko osoby podpisującej (mocodawcy)",
        placeholder: "np. Jan Kowalski",
        required: true,
      },
      {
        id: "stanowisko_mocodawcy",
        label: "Stanowisko mocodawcy",
        placeholder: "np. Prezes Zarządu",
        required: true,
      },
    ],
    body: `{{miejscowosc_data}}

PEŁNOMOCNICTWO DO DZIAŁANIA W KRAJOWYM SYSTEMIE E-FAKTUR (KSeF)

Ja/My, niżej podpisany/a:

MOCODAWCA:
{{nazwa_mocodawcy}}
NIP: {{nip_mocodawcy}}
{{adres_mocodawcy}}

niniejszym udzielam/y pełnomocnictwa:

PEŁNOMOCNIK:
Imię i nazwisko: {{imie_nazwisko_pelnomocnika}}
PESEL: {{pesel_pelnomocnika}}
Adres zamieszkania: {{adres_pelnomocnika}}

do działania w moim/naszym imieniu w Krajowym Systemie e-Faktur (KSeF) w zakresie:

ZAKRES PEŁNOMOCNICTWA:
{{zakres_pelnomocnictwa}}

Pełnomocnictwo udzielane jest na podstawie art. 106na ust. 4 ustawy z dnia 11 marca 2004 r.
o podatku od towarów i usług (Dz. U. 2024 poz. 361 t.j., ze zm.) i obejmuje uprawnienie
do działania w systemie teleinformatycznym KSeF (ksef.podatki.gov.pl) w zakresie wskazanym
powyżej.

Pełnomocnictwo jest udzielone na czas nieokreślony / do dnia: ........................
(niepotrzebne skreślić)

Pełnomocnictwo może być w każdej chwili odwołane przez mocodawcę.


................................................
{{podpis_imie_nazwisko}}
{{stanowisko_mocodawcy}}
{{nazwa_mocodawcy}}


POUCZENIE:
Uprawnienia w systemie KSeF nadawane są przez podatnika bezpośrednio w systemie
(ksef.podatki.gov.pl) lub przez e-Urząd Skarbowy. Niniejsze pełnomocnictwo stanowi
dokument wewnętrzny potwierdzający podstawę prawną do działania pełnomocnika.
Dla skuteczności działania w KSeF konieczne jest nadanie uprawnień w systemie KSeF.`,
    notes: [
      "Pełnomocnictwo do KSeF nadawane jest w systemie teleinformatycznym — niniejszy dokument ma charakter wewnętrzny/potwierdzający.",
      "Pełnomocnik musi posiadać PESEL do uwierzytelnienia w systemie KSeF.",
      "Uprawnienia w KSeF można nadać: przez ksef.podatki.gov.pl, przez e-Urząd Skarbowy, przez Aplikację Podatnika KSeF 2.0.",
      "Pełnomocnictwo ogólne (PPO-1) złożone w CEIDG/KRS nie obejmuje automatycznie uprawnień do KSeF — konieczne jest osobne nadanie uprawnień w systemie.",
    ],
    lastVerified: "2026-04-02",
  },

  // ----------------------------------------------------------
  // 7. Informacja dla kontrahenta o obowiązku KSeF
  // ----------------------------------------------------------
  {
    id: "informacja-kontrahent-ksef",
    title: "Informacja dla kontrahenta o obowiązku wystawiania faktur w KSeF",
    shortTitle: "Informacja dla kontrahenta",
    description:
      "Pismo informujące kontrahenta o obowiązku wystawiania faktur w KSeF i prośba o dostosowanie procesu fakturowania. Stosowane gdy kontrahent nadal wystawia faktury poza KSeF.",
    category: "wdrozenie",
    legalBasis:
      "Art. 106na ustawy o VAT (Dz. U. 2025 poz. 1203); Art. 86 ust. 10b ustawy o VAT",
    fields: [
      {
        id: "miejscowosc_data",
        label: "Miejscowość i data",
        placeholder: "np. Warszawa, 02.04.2026",
        required: true,
      },
      {
        id: "nazwa_nadawcy",
        label: "Nazwa / imię i nazwisko nadawcy",
        placeholder: "np. ABC Sp. z o.o.",
        required: true,
      },
      {
        id: "nip_nadawcy",
        label: "NIP nadawcy",
        placeholder: "np. 123-456-78-90",
        required: true,
      },
      {
        id: "nazwa_kontrahenta",
        label: "Nazwa / imię i nazwisko kontrahenta",
        placeholder: "np. XYZ Sp. z o.o.",
        required: true,
      },
      {
        id: "nip_kontrahenta",
        label: "NIP kontrahenta",
        placeholder: "np. 987-654-32-10",
        required: true,
      },
      {
        id: "adres_kontrahenta",
        label: "Adres kontrahenta",
        placeholder: "np. ul. Inna 2, 00-002 Kraków",
        required: true,
      },
      {
        id: "opis_sytuacji",
        label: "Opis sytuacji (jakie faktury wystawiane są poza KSeF)",
        placeholder: "np. faktury za usługi transportowe wystawiane w formie papierowej od 01.04.2026",
        required: true,
      },
      {
        id: "termin",
        label: "Termin dostosowania",
        placeholder: "np. 14 dni od daty otrzymania niniejszego pisma",
        required: true,
      },
      {
        id: "podpis_imie_nazwisko",
        label: "Imię i nazwisko osoby podpisującej",
        placeholder: "np. Anna Nowak",
        required: true,
      },
      {
        id: "stanowisko",
        label: "Stanowisko",
        placeholder: "np. Główna Księgowa",
        required: true,
      },
    ],
    body: `{{miejscowosc_data}}

{{nazwa_nadawcy}}
NIP: {{nip_nadawcy}}


{{nazwa_kontrahenta}}
NIP: {{nip_kontrahenta}}
{{adres_kontrahenta}}


INFORMACJA O OBOWIĄZKU WYSTAWIANIA FAKTUR W KRAJOWYM SYSTEMIE E-FAKTUR (KSeF)
ORAZ PROŚBA O DOSTOSOWANIE PROCESU FAKTUROWANIA

Szanowni Państwo,

Zwracamy się do Państwa w związku z obowiązkiem wystawiania faktur ustrukturyzowanych
w Krajowym Systemie e-Faktur (KSeF), który wszedł w życie na podstawie ustawy z dnia
5 sierpnia 2025 r. o zmianie ustawy o podatku od towarów i usług (Dz. U. 2025 poz. 1203).

OBOWIĄZEK KSeF:
Zgodnie z art. 106na ustawy o VAT, Państwa podmiot (jako czynny podatnik VAT z siedzibą
w Polsce) jest zobowiązany do wystawiania faktur ustrukturyzowanych wyłącznie za
pośrednictwem systemu KSeF:
- od 01.02.2026 r. — jeśli wartość sprzedaży w 2024 r. przekroczyła 200 mln zł, LUB
- od 01.04.2026 r. — dla pozostałych podatników VAT.

ZAISTNIAŁA SYTUACJA:
{{opis_sytuacji}}

Wystawienie faktury poza systemem KSeF przez podmiot zobowiązany do korzystania z KSeF
powoduje, że faktura taka nie jest uznawana za fakturę w rozumieniu przepisów o VAT
(art. 106na ust. 1 ustawy o VAT), co może skutkować brakiem prawa do odliczenia VAT
przez nabywcę.

PROŚBA:
Uprzejmie prosimy o dostosowanie procesu fakturowania i wystawianie wszystkich faktur
za pośrednictwem systemu KSeF w terminie: {{termin}}

W razie pytań dotyczących KSeF zachęcamy do kontaktu z infolinią KAS:
222 500 121 (całą dobę) lub portalu ksef.podatki.gov.pl.

Z poważaniem,

................................................
{{podpis_imie_nazwisko}}
{{stanowisko}}
{{nazwa_nadawcy}}`,
    notes: [
      "Faktura wystawiona poza KSeF przez podmiot zobowiązany do KSeF nie jest uznawana za fakturę VAT — nabywca nie ma prawa do odliczenia VAT.",
      "W 2026 r. sankcje art. 106ni są zawieszone — ale brak prawa do odliczenia VAT przez nabywcę obowiązuje od dnia wejścia w życie obowiązku.",
      "Kontrahent może sprawdzić swój obowiązek KSeF na ksef.podatki.gov.pl.",
    ],
    lastVerified: "2026-04-02",
  },
];

// ============================================================
// HELPER: Fill template with field values
// ============================================================
export function fillKsefTemplate(
  template: KsefTemplate,
  values: Record<string, string>
): string {
  let result = template.body;
  for (const field of template.fields) {
    const value = values[field.id] ?? `[${field.label.toUpperCase()}]`;
    result = result.replaceAll(`{{${field.id}}}`, value);
  }
  return result;
}

// ============================================================
// HELPER: Get templates by category
// ============================================================
export function getKsefTemplatesByCategory(
  category: KsefTemplateCategory
): KsefTemplate[] {
  return KSEF_TEMPLATES.filter((t) => t.category === category);
}

export const KSEF_TEMPLATE_CATEGORIES: Record<
  KsefTemplateCategory,
  { label: string; description: string }
> = {
  uprawnienia: {
    label: "Uprawnienia i pełnomocnictwa",
    description: "ZAW-FA, pełnomocnictwa do KSeF",
  },
  korekta: {
    label: "Korekty faktur",
    description: "Wezwania do korekty, noty",
  },
  offline: {
    label: "Tryb offline i awaryjny",
    description: "Oświadczenia offline24, tryb awaryjny",
  },
  wdrozenie: {
    label: "Wdrożenie KSeF",
    description: "Informacje dla kontrahentów, check-listy",
  },
  inne: {
    label: "Inne",
    description: "Pozostałe pisma KSeF",
  },
};
