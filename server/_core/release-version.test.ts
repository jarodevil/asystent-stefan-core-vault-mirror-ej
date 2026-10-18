import { describe, expect, it, vi } from "vitest";
import { releaseVersionHandler, SERVER_RELEASE_ID } from "./release-version";

describe("release version endpoint", () => {
  it("returns the server release without allowing HTTP cache storage", () => {
    const response = {
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    releaseVersionHandler({} as never, response as never);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.set).toHaveBeenCalledWith(
      expect.objectContaining({ "Cache-Control": "no-store, max-age=0" })
    );
    expect(response.json).toHaveBeenCalledWith({ release: SERVER_RELEASE_ID });
  });
});
