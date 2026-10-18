import { describe, expect, it } from "vitest";
import { parsePublicationDate } from "./publicationDate";

describe("parsePublicationDate", () => {
  it("parses an official ISO publication date in the local calendar", () => {
    const result = parsePublicationDate("2026-10-02");
    expect(result).not.toBeNull();
    expect(result?.getFullYear()).toBe(2026);
    expect(result?.getMonth()).toBe(9);
    expect(result?.getDate()).toBe(2);
  });

  it("keeps legacy Polish records readable until the next refresh", () => {
    const result = parsePublicationDate("2.10.2026");
    expect(result).not.toBeNull();
    expect(result?.getFullYear()).toBe(2026);
    expect(result?.getMonth()).toBe(9);
    expect(result?.getDate()).toBe(2);
  });
});
