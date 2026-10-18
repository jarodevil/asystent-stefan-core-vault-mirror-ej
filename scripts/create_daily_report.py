from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.shared import Cm, Pt, RGBColor


ROOT = Path("/home/ubuntu/kancelariaai")
OUTPUT = ROOT / "RAPORT_DZIENNY_STEFAN_2026-09-05.docx"
LOGO = Path("/home/ubuntu/webdev-static-assets/jarodevil-signature-2026.png")


def shade(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = cell._element.xml
    if "w:shd" not in shd:
        from docx.oxml import OxmlElement
        from docx.oxml.ns import qn
        element = OxmlElement("w:shd")
        element.set(qn("w:fill"), fill)
        tc_pr.append(element)


def heading(document, title, level=1):
    paragraph = document.add_heading(title, level=level)
    paragraph.paragraph_format.space_before = Pt(14)
    paragraph.paragraph_format.space_after = Pt(6)
    return paragraph


def bullet(document, text):
    paragraph = document.add_paragraph(style="List Bullet")
    paragraph.add_run(text)
    return paragraph


def add_table(document, headers, rows):
    table = document.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    for index, header in enumerate(headers):
        cell = table.rows[0].cells[index]
        cell.text = header
        shade(cell, "DCEAF7")
        for run in cell.paragraphs[0].runs:
            run.bold = True
    for row in rows:
        cells = table.add_row().cells
        for index, value in enumerate(row):
            cells[index].text = value
            cells[index].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    return table


def configure_document(document):
    section = document.sections[0]
    section.top_margin = Cm(1.8)
    section.bottom_margin = Cm(1.8)
    section.left_margin = Cm(2.0)
    section.right_margin = Cm(2.0)
    normal = document.styles["Normal"]
    normal.font.name = "Aptos"
    normal.font.size = Pt(10.5)

    header = section.header.paragraphs[0]
    header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    if LOGO.exists():
        header.add_run().add_picture(str(LOGO), width=Cm(1.4))

    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.add_run("Jaro’Devil — Pasternak Jarek | System Stefan v5.8.0 | 05.09.2026").font.size = Pt(8)


def main():
    document = Document()
    configure_document(document)

    title = document.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("RAPORT DZIENNY — SYSTEM STEFAN")
    run.bold = True
    run.font.size = Pt(20)
    run.font.color.rgb = RGBColor(25, 58, 92)

    subtitle = document.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle.add_run("5 września 2026 r. | Audyt rozszerzony, bezpieczeństwo, trwałość danych i dokumentacja").italic = True

    if LOGO.exists():
        logo_paragraph = document.add_paragraph()
        logo_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        logo_paragraph.add_run().add_picture(str(LOGO), width=Cm(2.4))

    note = document.add_paragraph()
    note.style = "Intense Quote"
    note.add_run("Status: ").bold = True
    note.add_run("zmiany są przetestowane i zapisane w checkpointach. Aby pojawiły się na domenie publicznej, wymagają użycia przycisku Publish w panelu projektu.")

    heading(document, "1. Dlaczego audyt został rozszerzony")
    document.add_paragraph(
        "Planowy przegląd miał sprawdzić zgodność modeli Gemini, testy regresyjne promptu, koszt i zabezpieczenia. "
        "Po odtworzeniu Stefana z kopii zapasowej stwierdzono jednak, że sam test modelu nie wystarcza. "
        "Zakres objął także integralność odtworzonej wersji, zgodność produkcji z repozytorium, prawdziwość dokumentacji oraz trwałość danych."
    )
    add_table(document, ["Ryzyko", "Znaczenie", "Działanie"], [
        ["Rozjazd wersji", "Domena publiczna wskazywała v5.1.0 mimo późniejszych zmian w repozytorium.", "Ustalono obowiązek publikacji aktualnego checkpointu i kontroli po publikacji."],
        ["Rozjazd modeli", "W kodzie, testach i opisach pozostały stare identyfikatory Gemini.", "Ujednolicono runtime, helpery, panel, testy i dokumentację."],
        ["Ryzyko odpowiedzi prawnej", "Niska temperatura nie jest samodzielną ochroną przed konfabulacją ani injection.", "Wdrożono fail-closed i testy kontraktu bezpieczeństwa."],
        ["Błąd runtime", "Invalid hook call blokował TRPCProvider po hibernacji.", "Ustabilizowano resolucję React/Vite i cache zależności."],
    ])

    heading(document, "2. Zakres wykonanych prac")
    heading(document, "KSeF i dane operacyjne", 2)
    document.add_paragraph("Monitoring KSeF rozszerzono o historyczne dane ELI API. Alerty są utrwalane w bazie i przekazywane do kontekstu pytań KSeF. Dodano kontekstowe pytanie o alert, licznik nieprzeczytanych i sekcję sankcji.")
    heading(document, "Trwałość danych", 2)
    document.add_paragraph("Dodano systemCache dla kontrolowanego odświeżania KSeF/RSS. Czat, notatki, dokumenty tworzone z wzorów i karty klientów działają jako trwałe dane użytkownika, a nie jako dane jednorazowe zależne od pamięci urządzenia.")
    heading(document, "Bezpieczeństwo modeli", 2)
    document.add_paragraph("Ustalono Gemini 3.1 Pro Preview jako model główny i Gemini 3 Flash Preview jako fallback. Temperatura wynosi 0,1. Odpowiedź niespełniająca warunków weryfikacji lub zawierająca wzorzec prompt injection jest blokowana, zamiast otrzymywać domyślne uzupełnienie.")
    heading(document, "React/Vite", 2)
    document.add_paragraph("Usunięto realną przyczynę Invalid hook call przez dokładne aliasy React/React DOM, wspólną optymalizację zależności i reset cache Vite. Błąd WebSocket HMR pozostaje ograniczeniem proxy podglądu, nie błędem aplikacji produkcyjnej. Podczas kontroli końcowej naprawiono też PWA: cache podniesiono do stefan-v5.8.0, nawigacje działają network-first z fallbackiem offline, a rejestracja Service Workera wymusza pobranie bieżącego wydania bez cache. Po restarcie potwierdzono stopkę System Stefan v5.8.0.")
    heading(document, "Dokumentacja", 2)
    document.add_paragraph("Strony O Systemie i Pomoc zaktualizowano do stanu 5.7.0. Usunięto przestarzały PDF instrukcji. MANIFEST i Panel Deweloperski dopasowano do realnej polityki runtime, bez pozornej możliwości zmiany krytycznych parametrów z formularza.")

    heading(document, "3. Wynik walidacji")
    add_table(document, ["Obszar", "Wynik"], [
        ["TypeScript", "0 błędów"],
        ["Testy automatyczne", "193/193 zaliczone"],
        ["Render stron", "/, /about i /help sprawdzone w podglądzie"],
        ["Konsola po naprawie React", "Brak Invalid hook call i błędu TRPCProvider useState"],
        ["KSeF/RSS", "Kontrola wieku danych i cache aktywne"],
        ["PWA", "Świeży shell v5.8.0 potwierdzony po aktualizacji Service Workera"],
    ])

    heading(document, "4. Standard sygnatury Jaro’Devil")
    document.add_paragraph("Nowy znak Jaro’Devil jest standardową sygnaturą dokumentów, za które odpowiada Pasternak Jarek. Został podpięty przez chroniony proxy magazynu i dodany do aktywnych powierzchni dokumentowych:")
    for item in [
        "podgląd i druk/PDF dokumentów generowanych z wzorów;",
        "PDF Karty Klienta KSeF;",
        "wydruki ogólnych Szablonów Pism;",
        "raport analizy dokumentu;",
        "serwerowy eksport historii czatu do PDF;",
        "niniejszy raport dzienny.",
    ]:
        bullet(document, item)

    heading(document, "5. Otwarte działania")
    for item in [
        "Opublikować checkpoint 5.8.0 i potwierdzić publicznie strony /about oraz /help.",
        "Po publikacji aktywować harmonogram dziennego testu kompatybilności modeli i obserwować wynik w systemCache.",
        "Naprawić oraz osobno przetestować automatyczną archiwizację sesji; log audytu wskazał jej niepowodzenie.",
        "Przed wysyłką dokumentu lub działaniem na jego podstawie potwierdzić aktualną podstawę prawną w ISAP, podatki.gov.pl lub właściwym źródle urzędowym.",
    ]:
        bullet(document, item)

    conclusion = document.add_paragraph()
    conclusion.style = "Intense Quote"
    conclusion.add_run("Wniosek: ").bold = True
    conclusion.add_run("rozszerzenie audytu było konieczne. Odtworzenie aplikacji, rozjazd wersji produkcyjnej, nieaktualne identyfikatory modeli, ryzyko błędnej odpowiedzi prawnej i błąd runtime stanowiły jeden problem integralności. Naprawa objęła pełen łańcuch: źródło → baza → prompt → odpowiedź → dokument → publikacja.")

    sign = document.add_paragraph()
    sign.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    sign.add_run("Pasternak Jarek — Jaro’Devil\n").bold = True
    sign.add_run("Opracowanie techniczne: Manus AI")

    document.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    main()
