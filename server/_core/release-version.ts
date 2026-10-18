import type { Request, Response } from "express";

/**
 * Wartość jest wstrzykiwana przez scripts/build-release.mjs do pakietu serwera.
 * Endpoint nie zawiera danych użytkownika ani konfiguracji środowiska.
 */
export const SERVER_RELEASE_ID = process.env.STEFAN_BUILD_ID || "development";

export function releaseVersionHandler(_req: Request, res: Response) {
  res
    .status(200)
    .set({
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
      Vary: "Accept",
    })
    .json({ release: SERVER_RELEASE_ID });
}
