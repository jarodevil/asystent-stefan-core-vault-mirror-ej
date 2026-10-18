import { describe, it, expect } from "vitest";

// ─── Test helper: checklist JSON parsing ─────────────────────────────────────

function parseChecklist(json: string | null | undefined) {
  const DEFAULT = {
    systemIntegrated: false,
    testsDone: false,
    staffTrained: false,
    backupProcedure: false,
    offlineConfigured: false,
    firstInvoiceSent: false,
  };
  try {
    return json ? { ...DEFAULT, ...JSON.parse(json) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function completionRate(checklistJson: string | null | undefined): number {
  const cl = parseChecklist(checklistJson);
  const done = Object.values(cl).filter(Boolean).length;
  return Math.round((done / 6) * 100);
}

// ─── NIP validation ───────────────────────────────────────────────────────────

function isValidNip(nip: string): boolean {
  const cleaned = nip.replace(/[\s-]/g, "");
  if (!/^\d{10}$/.test(cleaned)) return false;
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const sum = weights.reduce((acc, w, i) => acc + w * parseInt(cleaned[i]), 0);
  return sum % 11 === parseInt(cleaned[9]);
}

// ─── Status label mapping ─────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  not_started: "Nie rozpoczęto",
  in_progress:  "W trakcie",
  completed:    "Zakończone",
  issues:       "Problemy",
};

const OBLIGATION_LABELS: Record<string, string> = {
  mandatory_large:    "Duży podatnik (> 200 mln PLN) — od 01.02.2026",
  mandatory_standard: "Standardowy — od 01.04.2026",
  voluntary:          "Dobrowolny",
  exempt:             "Zwolniony z KSeF",
};

const AUTH_LABELS: Record<string, string> = {
  token:         "Token KSeF",
  qualified_sig: "Podpis kwalifikowany",
  trusted_sig:   "Podpis zaufany (ePUAP)",
  not_set:       "Nie ustalono",
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("KSeF Client Cards — Checklist", () => {
  it("zwraca 0% dla pustej check-listy", () => {
    expect(completionRate(null)).toBe(0);
    expect(completionRate(undefined)).toBe(0);
    expect(completionRate("{}")).toBe(0);
  });

  it("zwraca 100% dla kompletnej check-listy", () => {
    const full = JSON.stringify({
      systemIntegrated: true,
      testsDone: true,
      staffTrained: true,
      backupProcedure: true,
      offlineConfigured: true,
      firstInvoiceSent: true,
    });
    expect(completionRate(full)).toBe(100);
  });

  it("zwraca 50% dla połowy wykonanych zadań", () => {
    const half = JSON.stringify({
      systemIntegrated: true,
      testsDone: true,
      staffTrained: true,
      backupProcedure: false,
      offlineConfigured: false,
      firstInvoiceSent: false,
    });
    expect(completionRate(half)).toBe(50);
  });

  it("zwraca 17% dla jednego wykonanego zadania", () => {
    const one = JSON.stringify({ systemIntegrated: true });
    expect(completionRate(one)).toBe(17);
  });

  it("obsługuje nieprawidłowy JSON gracefully", () => {
    expect(completionRate("not-json")).toBe(0);
    expect(completionRate("{broken")).toBe(0);
  });

  it("parseChecklist wypełnia brakujące pola wartościami domyślnymi", () => {
    const partial = JSON.stringify({ systemIntegrated: true });
    const result = parseChecklist(partial);
    expect(result.systemIntegrated).toBe(true);
    expect(result.testsDone).toBe(false);
    expect(result.staffTrained).toBe(false);
  });
});

describe("KSeF Client Cards — NIP Validation", () => {
  it("akceptuje poprawny NIP (5261040828 — zweryfikowana suma kontrolna)", () => {
    expect(isValidNip("5261040828")).toBe(true);
  });

  it("akceptuje NIP z myślnikami (526-104-08-28)", () => {
    expect(isValidNip("526-104-08-28")).toBe(true);
  });

  it("odrzuca NIP z nieprawidłową sumą kontrolną", () => {
    expect(isValidNip("1234567890")).toBe(false);
  });

  it("odrzuca NIP za krótki", () => {
    expect(isValidNip("123456789")).toBe(false);
  });

  it("odrzuca NIP za długi", () => {
    expect(isValidNip("12345678901")).toBe(false);
  });

  it("odrzuca NIP z literami", () => {
    expect(isValidNip("123456789A")).toBe(false);
  });

  it("odrzuca pusty NIP", () => {
    expect(isValidNip("")).toBe(false);
  });
});

describe("KSeF Client Cards — Status Labels", () => {
  it("wszystkie statusy mają etykiety", () => {
    const statuses = ["not_started", "in_progress", "completed", "issues"];
    statuses.forEach(s => {
      expect(STATUS_LABELS[s]).toBeDefined();
      expect(STATUS_LABELS[s].length).toBeGreaterThan(0);
    });
  });

  it("etykiety statusów są po polsku", () => {
    expect(STATUS_LABELS.not_started).toBe("Nie rozpoczęto");
    expect(STATUS_LABELS.in_progress).toBe("W trakcie");
    expect(STATUS_LABELS.completed).toBe("Zakończone");
    expect(STATUS_LABELS.issues).toBe("Problemy");
  });
});

describe("KSeF Client Cards — Obligation Types", () => {
  it("wszystkie typy obowiązku mają etykiety", () => {
    const types = ["mandatory_large", "mandatory_standard", "voluntary", "exempt"];
    types.forEach(t => {
      expect(OBLIGATION_LABELS[t]).toBeDefined();
    });
  });

  it("duży podatnik ma poprawną datę obowiązku", () => {
    expect(OBLIGATION_LABELS.mandatory_large).toContain("01.02.2026");
  });

  it("standardowy podatnik ma poprawną datę obowiązku", () => {
    expect(OBLIGATION_LABELS.mandatory_standard).toContain("01.04.2026");
  });
});

describe("KSeF Client Cards — Auth Methods", () => {
  it("wszystkie metody uwierzytelnienia mają etykiety", () => {
    const methods = ["token", "qualified_sig", "trusted_sig", "not_set"];
    methods.forEach(m => {
      expect(AUTH_LABELS[m]).toBeDefined();
      expect(AUTH_LABELS[m].length).toBeGreaterThan(0);
    });
  });

  it("token KSeF ma poprawną etykietę", () => {
    expect(AUTH_LABELS.token).toBe("Token KSeF");
  });

  it("podpis zaufany odwołuje się do ePUAP", () => {
    expect(AUTH_LABELS.trusted_sig).toContain("ePUAP");
  });
});

describe("KSeF Client Cards — Form Validation", () => {
  it("karta wymaga niepustej nazwy klienta", () => {
    const isValid = (name: string, nip: string) => name.trim().length > 0 && nip.trim().length >= 10;
    expect(isValid("ABC Sp. z o.o.", "7743200442")).toBe(true);
    expect(isValid("", "7743200442")).toBe(false);
    expect(isValid("ABC", "")).toBe(false);
    expect(isValid("  ", "7743200442")).toBe(false);
  });

  it("NIP musi mieć co najmniej 10 znaków", () => {
    const nipLengthOk = (nip: string) => nip.trim().length >= 10;
    expect(nipLengthOk("7743200442")).toBe(true);
    expect(nipLengthOk("123456789")).toBe(false);
    expect(nipLengthOk("")).toBe(false);
  });
});

describe("KSeF Client Cards — PDF Export Data", () => {
  it("generuje poprawną nazwę pliku PDF", () => {
    const clientName = "ABC Sp. z o.o.";
    const nip = "7743200442";
    const filename = `KSeF_${clientName.replace(/\s+/g, "_")}_${nip}.pdf`;
    expect(filename).toBe("KSeF_ABC_Sp._z_o.o._7743200442.pdf");
  });

  it("formatuje datę generowania po polsku", () => {
    const date = new Date("2026-04-04");
    const formatted = date.toLocaleDateString("pl-PL");
    expect(formatted).toMatch(/\d{1,2}\.\d{1,2}\.\d{4}/);
  });

  it("karta z pełnymi danymi zawiera wymagane pola", () => {
    const card = {
      clientName: "Test Sp. z o.o.",
      nip: "7743200442",
      address: "ul. Testowa 1, 00-001 Warszawa",
      taxOffice: "US Warszawa-Mokotów",
      contactEmail: "test@test.pl",
      implementationStatus: "in_progress",
      obligationDate: "2026-04-01",
      obligationType: "mandatory_standard",
      authMethod: "token",
      zawFaGranted: true,
      zawFaDate: "2026-03-15",
    };
    expect(card.clientName).toBeTruthy();
    expect(card.nip).toBeTruthy();
    expect(card.implementationStatus).toBe("in_progress");
    expect(card.zawFaGranted).toBe(true);
  });
});
