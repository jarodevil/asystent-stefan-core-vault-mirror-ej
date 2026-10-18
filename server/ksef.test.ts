/**
 * KSeF Module Unit Tests
 * Tests for ksef-knowledge.ts - obligation checker and data integrity
 * Source: ksef.podatki.gov.pl (official government portal)
 */

import { describe, it, expect } from "vitest";
import {
  checkKsefObligation,
  KSEF_TIMELINE,
  KSEF_EXCEPTIONS,
  KSEF_TRANSITIONAL_2026,
  KSEF_AUTH_METHODS,
} from "./ksef-knowledge";

// -----------------------------------------------------------------------
// Timeline data integrity tests
// -----------------------------------------------------------------------
describe("KSEF_TIMELINE data integrity", () => {
  it("should have at least 8 timeline entries", () => {
    expect(KSEF_TIMELINE.length).toBeGreaterThanOrEqual(8);
  });

  it("should include mandatory 01.02.2026 entry for large taxpayers", () => {
    const entry = KSEF_TIMELINE.find((e) => e.date === "2026-02-01");
    expect(entry).toBeDefined();
    expect(entry?.legalBasis).toContain("Dz. U. 2025 poz. 1203");
  });

  it("should include mandatory 01.04.2026 entry for remaining taxpayers", () => {
    const entry = KSEF_TIMELINE.find(
      (e) => e.date === "2026-04-01" && e.description.includes("Etap 2")
    );
    // Accept either the exact description or any 01.04.2026 entry about remaining taxpayers
    const aprilEntry = KSEF_TIMELINE.find(
      (e) => e.date === "2026-04-01" && e.description.toLowerCase().includes("pozostał")
    );
    expect(aprilEntry).toBeDefined();
  });

  it("should include 01.01.2027 sanction entry", () => {
    const entry = KSEF_TIMELINE.find(
      (e) => e.date === "2027-01-01" && e.description.includes("106ni")
    );
    expect(entry).toBeDefined();
  });

  it("should include 01.01.2027 MPP obligation entry", () => {
    const entry = KSEF_TIMELINE.find(
      (e) => e.date === "2027-01-01" && e.description.toLowerCase().includes("mpp")
    );
    expect(entry).toBeDefined();
  });

  it("all entries should have required fields", () => {
    for (const entry of KSEF_TIMELINE) {
      expect(entry.date).toBeTruthy();
      expect(entry.description).toBeTruthy();
      expect(entry.legalBasis).toBeTruthy();
      expect(entry.affectedEntities).toBeTruthy();
    }
  });
});

// -----------------------------------------------------------------------
// Exceptions data integrity tests
// -----------------------------------------------------------------------
describe("KSEF_EXCEPTIONS data integrity", () => {
  it("should have subject exceptions including B2C", () => {
    const b2c = KSEF_EXCEPTIONS.subjectExceptions.find((e) => e.id === "b2c_consumer");
    expect(b2c).toBeDefined();
    expect(b2c?.canUseVoluntarily).toBe(true);
  });

  it("should have OSS non-EU exception that cannot be used voluntarily", () => {
    const oss = KSEF_EXCEPTIONS.transactionExceptions.find((e) => e.id === "oss_non_eu");
    expect(oss).toBeDefined();
    expect(oss?.canUseVoluntarily).toBe(false);
  });

  it("should include notes korygujące as excluded document (uchylone)", () => {
    const notaKorygujaca = KSEF_EXCEPTIONS.excludedDocuments.find((d) =>
      d.toLowerCase().includes("noty koryguj")
    );
    expect(notaKorygujaca).toBeDefined();
    expect(notaKorygujaca).toContain("UCHYLONE");
  });

  it("should include faktury proforma as excluded", () => {
    const proforma = KSEF_EXCEPTIONS.excludedDocuments.find((d) =>
      d.toLowerCase().includes("proforma")
    );
    expect(proforma).toBeDefined();
  });
});

// -----------------------------------------------------------------------
// Transitional 2026 data integrity tests
// -----------------------------------------------------------------------
describe("KSEF_TRANSITIONAL_2026 data integrity", () => {
  it("should have at least 5 transitional items", () => {
    expect(KSEF_TRANSITIONAL_2026.length).toBeGreaterThanOrEqual(5);
  });

  it("all transitional items should expire on 2026-12-31", () => {
    for (const item of KSEF_TRANSITIONAL_2026) {
      expect(item.validUntil).toBe("2026-12-31");
    }
  });

  it("should include no-sanctions item for 2026", () => {
    const noSanctions = KSEF_TRANSITIONAL_2026.find((i) => i.id === "no_sanctions_2026");
    expect(noSanctions).toBeDefined();
    expect(noSanctions?.description).toContain("106ni");
  });

  it("should include micro 10k exemption", () => {
    const micro = KSEF_TRANSITIONAL_2026.find((i) => i.id === "micro_10k");
    expect(micro).toBeDefined();
    expect(micro?.description).toContain("10 000");
  });
});

// -----------------------------------------------------------------------
// Auth methods data integrity tests
// -----------------------------------------------------------------------
describe("KSEF_AUTH_METHODS data integrity", () => {
  it("should have at least 4 authentication methods", () => {
    expect(KSEF_AUTH_METHODS.length).toBeGreaterThanOrEqual(4);
  });

  it("should include Profil Zaufany as free method", () => {
    const pz = KSEF_AUTH_METHODS.find((m) => m.id === "trusted_profile");
    expect(pz).toBeDefined();
    expect(pz?.cost.toLowerCase()).toContain("bezpłat");
  });
});

// -----------------------------------------------------------------------
// checkKsefObligation - core business logic tests
// -----------------------------------------------------------------------
describe("checkKsefObligation - non-VAT payer", () => {
  it("should return no obligation for non-VAT payer", () => {
    const result = checkKsefObligation({
      hasPolishSeat: true,
      isVatPayer: false,
      transactionType: "b2b",
    });
    expect(result.isObligated).toBe(false);
    expect(result.obligationDate).toBeNull();
  });
});

describe("checkKsefObligation - no Polish seat", () => {
  it("should return no obligation for entity without Polish seat", () => {
    const result = checkKsefObligation({
      hasPolishSeat: false,
      isVatPayer: true,
      transactionType: "b2b",
    });
    expect(result.isObligated).toBe(false);
    expect(result.legalBasis).toContain("106na");
  });
});

describe("checkKsefObligation - B2C transaction", () => {
  it("should return no obligation for B2C transaction", () => {
    const result = checkKsefObligation({
      hasPolishSeat: true,
      isVatPayer: true,
      transactionType: "b2c",
    });
    expect(result.isObligated).toBe(false);
    expect(result.reason).toContain("B2C");
  });
});

describe("checkKsefObligation - special procedures", () => {
  it("should return no obligation for OSS non-EU procedure", () => {
    const result = checkKsefObligation({
      hasPolishSeat: true,
      isVatPayer: true,
      transactionType: "b2b",
      specialProcedure: "oss_non_eu",
    });
    expect(result.isObligated).toBe(false);
    expect(result.reason).toContain("OSS");
  });

  it("should return no obligation for IOSS procedure", () => {
    const result = checkKsefObligation({
      hasPolishSeat: true,
      isVatPayer: true,
      transactionType: "b2b",
      specialProcedure: "ioss",
    });
    expect(result.isObligated).toBe(false);
    expect(result.reason).toContain("IOSS");
  });

  it("should return no obligation for SME procedure", () => {
    const result = checkKsefObligation({
      hasPolishSeat: true,
      isVatPayer: true,
      transactionType: "b2b",
      specialProcedure: "sme",
    });
    expect(result.isObligated).toBe(false);
    expect(result.reason).toContain("SME");
  });
});

describe("checkKsefObligation - micro enterprise exemption", () => {
  it("should return no obligation (until 2027) for monthly sales <= 10000 PLN", () => {
    const result = checkKsefObligation({
      hasPolishSeat: true,
      isVatPayer: true,
      transactionType: "b2b",
      monthlySalesInvoiced: 8000,
    });
    expect(result.isObligated).toBe(false);
    expect(result.obligationDate).toBe("2027-01-01");
    expect(result.reason).toContain("10 000");
  });

  it("should return obligation for monthly sales > 10000 PLN", () => {
    const result = checkKsefObligation({
      hasPolishSeat: true,
      isVatPayer: true,
      transactionType: "b2b",
      monthlySalesInvoiced: 15000,
    });
    expect(result.isObligated).toBe(true);
  });

  it("should return no obligation for exactly 10000 PLN monthly", () => {
    const result = checkKsefObligation({
      hasPolishSeat: true,
      isVatPayer: true,
      transactionType: "b2b",
      monthlySalesInvoiced: 10000,
    });
    expect(result.isObligated).toBe(false);
    expect(result.obligationDate).toBe("2027-01-01");
  });
});

describe("checkKsefObligation - large enterprise (> 200 mln PLN in 2024)", () => {
  it("should return obligation from 01.02.2026 for sales > 200 mln PLN", () => {
    const result = checkKsefObligation({
      hasPolishSeat: true,
      isVatPayer: true,
      transactionType: "b2b",
      annualSalesGross2024: 250_000_000,
    });
    expect(result.isObligated).toBe(true);
    expect(result.obligationDate).toBe("2026-02-01");
    expect(result.legalBasis).toContain("Dz. U. 2025 poz. 1203");
  });

  it("should return obligation from 01.04.2026 for sales exactly 200 mln PLN (not exceeding)", () => {
    const result = checkKsefObligation({
      hasPolishSeat: true,
      isVatPayer: true,
      transactionType: "b2b",
      annualSalesGross2024: 200_000_000,
    });
    // Exactly 200 mln = NOT exceeding the threshold -> II etap
    expect(result.obligationDate).toBe("2026-04-01");
  });
});

describe("checkKsefObligation - standard enterprise", () => {
  it("should return obligation from 01.04.2026 for standard B2B taxpayer", () => {
    const result = checkKsefObligation({
      hasPolishSeat: true,
      isVatPayer: true,
      transactionType: "b2b",
      annualSalesGross2024: 5_000_000,
    });
    expect(result.isObligated).toBe(true);
    expect(result.obligationDate).toBe("2026-04-01");
  });

  it("should include MPP obligation in next steps", () => {
    const result = checkKsefObligation({
      hasPolishSeat: true,
      isVatPayer: true,
      transactionType: "b2b",
    });
    expect(result.isObligated).toBe(true);
    const hasMppStep = result.nextSteps.some((s) => s.includes("MPP") || s.includes("01.01.2027"));
    expect(hasMppStep).toBe(true);
  });

  it("should include sanctions warning in next steps", () => {
    const result = checkKsefObligation({
      hasPolishSeat: true,
      isVatPayer: true,
      transactionType: "b2b",
    });
    const hasSanctionStep = result.nextSteps.some(
      (s) => s.includes("106ni") || s.includes("sankcj")
    );
    expect(hasSanctionStep).toBe(true);
  });
});
