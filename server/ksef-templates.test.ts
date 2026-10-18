/**
 * KSeF Templates Unit Tests
 * Tests for ksef-templates.ts — template data integrity and fill logic
 */
import { describe, it, expect } from "vitest";
import {
  KSEF_TEMPLATES,
  KSEF_TEMPLATE_CATEGORIES,
  fillKsefTemplate,
  getKsefTemplatesByCategory,
} from "./ksef-templates";

// ============================================================
// Template data integrity
// ============================================================

describe("KSEF_TEMPLATES data integrity", () => {
  it("should have at least 6 templates", () => {
    expect(KSEF_TEMPLATES.length).toBeGreaterThanOrEqual(6);
  });

  it("all templates should have required fields", () => {
    for (const t of KSEF_TEMPLATES) {
      expect(t.id, `${t.id} missing id`).toBeTruthy();
      expect(t.title, `${t.id} missing title`).toBeTruthy();
      expect(t.shortTitle, `${t.id} missing shortTitle`).toBeTruthy();
      expect(t.description, `${t.id} missing description`).toBeTruthy();
      expect(t.category, `${t.id} missing category`).toBeTruthy();
      expect(t.legalBasis, `${t.id} missing legalBasis`).toBeTruthy();
      expect(Array.isArray(t.fields), `${t.id} fields not array`).toBe(true);
      expect(Array.isArray(t.notes), `${t.id} notes not array`).toBe(true);
      expect(t.body, `${t.id} missing body`).toBeTruthy();
      expect(t.lastVerified, `${t.id} missing lastVerified`).toBeTruthy();
    }
  });

  it("all template IDs should be unique", () => {
    const ids = KSEF_TEMPLATES.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("all template categories should be valid", () => {
    const validCategories = ["uprawnienia", "korekta", "offline", "wdrozenie", "inne"];
    for (const t of KSEF_TEMPLATES) {
      expect(validCategories, `${t.id} has invalid category: ${t.category}`).toContain(t.category);
    }
  });

  it("all template fields should have required properties", () => {
    for (const t of KSEF_TEMPLATES) {
      for (const f of t.fields) {
        expect(f.id, `${t.id}.${f.id} missing id`).toBeTruthy();
        expect(f.label, `${t.id}.${f.id} missing label`).toBeTruthy();
        expect(f.placeholder, `${t.id}.${f.id} missing placeholder`).toBeTruthy();
        expect(typeof f.required, `${t.id}.${f.id} required not boolean`).toBe("boolean");
      }
    }
  });

  it("all templates should have legal basis from official sources", () => {
    for (const t of KSEF_TEMPLATES) {
      const basis = t.legalBasis.toLowerCase();
      const hasOfficialSource =
        basis.includes("dz. u.") ||
        basis.includes("ustawa") ||
        basis.includes("rozporządzenie") ||
        basis.includes("art.");
      expect(hasOfficialSource, `${t.id} legalBasis lacks official source reference`).toBe(true);
    }
  });

  it("all template bodies should contain at least one placeholder", () => {
    for (const t of KSEF_TEMPLATES) {
      const hasPlaceholder = /\{\{[a-z_]+\}\}/.test(t.body);
      expect(hasPlaceholder, `${t.id} body has no placeholders`).toBe(true);
    }
  });

  it("all body placeholders should match defined fields", () => {
    for (const t of KSEF_TEMPLATES) {
      const placeholders = [...t.body.matchAll(/\{\{([a-z_]+)\}\}/g)].map((m) => m[1]);
      const fieldIds = t.fields.map((f) => f.id);
      for (const ph of placeholders) {
        expect(fieldIds, `${t.id} placeholder {{${ph}}} has no matching field`).toContain(ph);
      }
    }
  });
});

// ============================================================
// Specific template existence checks
// ============================================================

describe("Required KSeF templates exist", () => {
  const templateIds = KSEF_TEMPLATES.map((t) => t.id);

  it("ZAW-FA nadanie template exists", () => {
    expect(templateIds).toContain("zaw-fa-nadanie");
  });

  it("ZAW-FA odebranie template exists", () => {
    expect(templateIds).toContain("zaw-fa-odebranie");
  });

  it("Wezwanie do korekty template exists", () => {
    expect(templateIds).toContain("wezwanie-korekta-ksef");
  });

  it("Oświadczenie offline24 template exists", () => {
    expect(templateIds).toContain("oswiadczenie-offline24");
  });

  it("Zawiadomienie o awarii template exists", () => {
    expect(templateIds).toContain("zawiadomienie-awaria-ksef");
  });

  it("Pełnomocnictwo KSeF template exists", () => {
    expect(templateIds).toContain("pelnomocnictwo-ksef");
  });

  it("Informacja dla kontrahenta template exists", () => {
    expect(templateIds).toContain("informacja-kontrahent-ksef");
  });
});

// ============================================================
// fillKsefTemplate logic
// ============================================================

describe("fillKsefTemplate", () => {
  const zawFa = KSEF_TEMPLATES.find((t) => t.id === "zaw-fa-nadanie")!;

  it("should replace all placeholders with provided values", () => {
    const values: Record<string, string> = {
      miejscowosc_data: "Warszawa, 02.04.2026",
      nazwa_podatnika: "ABC Sp. z o.o.",
      nip_podatnika: "123-456-78-90",
      adres_podatnika: "ul. Przykładowa 1, 00-001 Warszawa",
      naczelnik_us: "Naczelnik US Warszawa-Mokotów",
      nazwa_uprawnionego: "Biuro Rachunkowe XYZ",
      nip_uprawnionego: "987-654-32-10",
      zakres_uprawnien: "wystawianie i odbieranie faktur",
      data_od: "02.04.2026",
      podpis_imie_nazwisko: "Jan Kowalski",
      stanowisko: "Prezes Zarządu",
    };
    const result = fillKsefTemplate(zawFa, values);
    expect(result).toContain("Warszawa, 02.04.2026");
    expect(result).toContain("ABC Sp. z o.o.");
    expect(result).toContain("123-456-78-90");
    expect(result).toContain("Biuro Rachunkowe XYZ");
    expect(result).toContain("987-654-32-10");
    expect(result).not.toContain("{{miejscowosc_data}}");
    expect(result).not.toContain("{{nazwa_podatnika}}");
  });

  it("should use fallback label for missing fields", () => {
    const result = fillKsefTemplate(zawFa, {});
    expect(result).toContain("[MIEJSCOWOŚĆ I DATA]");
    expect(result).toContain("[PEŁNA NAZWA / IMIĘ I NAZWISKO PODATNIKA (ZLECAJĄCEGO)]");
  });

  it("should replace all occurrences of the same placeholder", () => {
    const template = KSEF_TEMPLATES.find((t) => t.id === "zaw-fa-odebranie")!;
    const values: Record<string, string> = {
      miejscowosc_data: "Kraków, 01.04.2026",
      nazwa_podatnika: "XYZ Sp. z o.o.",
      nip_podatnika: "111-222-33-44",
      adres_podatnika: "ul. Inna 5, 30-001 Kraków",
      naczelnik_us: "Naczelnik US Kraków-Śródmieście",
      nazwa_uprawnionego: "Stare Biuro Rachunkowe",
      nip_uprawnionego: "555-666-77-88",
      zakres_odebrania: "wszystkie uprawnienia",
      data_od: "01.04.2026",
      podpis_imie_nazwisko: "Anna Nowak",
      stanowisko: "Dyrektor Finansowy",
    };
    const result = fillKsefTemplate(template, values);
    // nazwa_podatnika appears multiple times in template
    const count = (result.match(/XYZ Sp\. z o\.o\./g) || []).length;
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("should not contain any unfilled placeholders when all values provided", () => {
    const template = KSEF_TEMPLATES.find((t) => t.id === "oswiadczenie-offline24")!;
    const values: Record<string, string> = {
      miejscowosc_data: "Gdańsk, 02.04.2026",
      nazwa_podatnika: "Firma Testowa",
      nip_podatnika: "999-888-77-66",
      adres_podatnika: "ul. Testowa 1, 80-001 Gdańsk",
      data_od: "01.04.2026",
      przyczyna: "brak stałego dostępu do internetu",
      podpis_imie_nazwisko: "Piotr Wiśniewski",
      stanowisko: "Właściciel",
    };
    const result = fillKsefTemplate(template, values);
    expect(result).not.toMatch(/\{\{[a-z_]+\}\}/);
  });
});

// ============================================================
// getKsefTemplatesByCategory
// ============================================================

describe("getKsefTemplatesByCategory", () => {
  it("should return only uprawnienia templates", () => {
    const result = getKsefTemplatesByCategory("uprawnienia");
    expect(result.length).toBeGreaterThanOrEqual(2);
    for (const t of result) {
      expect(t.category).toBe("uprawnienia");
    }
  });

  it("should return only korekta templates", () => {
    const result = getKsefTemplatesByCategory("korekta");
    expect(result.length).toBeGreaterThanOrEqual(1);
    for (const t of result) {
      expect(t.category).toBe("korekta");
    }
  });

  it("should return only offline templates", () => {
    const result = getKsefTemplatesByCategory("offline");
    expect(result.length).toBeGreaterThanOrEqual(2);
    for (const t of result) {
      expect(t.category).toBe("offline");
    }
  });

  it("should return empty array for unused category", () => {
    const result = getKsefTemplatesByCategory("inne");
    expect(Array.isArray(result)).toBe(true);
  });
});

// ============================================================
// KSEF_TEMPLATE_CATEGORIES
// ============================================================

describe("KSEF_TEMPLATE_CATEGORIES", () => {
  it("should have all required categories", () => {
    expect(KSEF_TEMPLATE_CATEGORIES).toHaveProperty("uprawnienia");
    expect(KSEF_TEMPLATE_CATEGORIES).toHaveProperty("korekta");
    expect(KSEF_TEMPLATE_CATEGORIES).toHaveProperty("offline");
    expect(KSEF_TEMPLATE_CATEGORIES).toHaveProperty("wdrozenie");
    expect(KSEF_TEMPLATE_CATEGORIES).toHaveProperty("inne");
  });

  it("each category should have label and description", () => {
    for (const [key, val] of Object.entries(KSEF_TEMPLATE_CATEGORIES)) {
      expect(val.label, `${key} missing label`).toBeTruthy();
      expect(val.description, `${key} missing description`).toBeTruthy();
    }
  });
});
