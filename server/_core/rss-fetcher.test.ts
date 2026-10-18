import { describe, expect, it } from "vitest";
import { toOfficialPublicationDate } from "./rss-fetcher";

describe("toOfficialPublicationDate", () => {
  it("stores an ELI publication date as an unambiguous ISO calendar date", () => {
    expect(toOfficialPublicationDate(new Date(Date.UTC(2026, 9, 2)))).toBe(
      "2026-10-02"
    );
  });
});
