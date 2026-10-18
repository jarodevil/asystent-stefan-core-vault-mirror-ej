import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { backupSecretHealthHandler } from "./backup-secret-health";

const servers: Array<ReturnType<ReturnType<typeof express>["listen"]>> = [];

afterEach(async () => {
  await Promise.all(
    servers
      .splice(0)
      .map(
        server => new Promise<void>(resolve => server.close(() => resolve()))
      )
  );
});

describe("backup secret health endpoint", () => {
  it("confirms that the configured dedicated backup secret is available without exposing it", async () => {
    const app = express();
    app.get("/api/health/backup-secret", backupSecretHealthHandler);
    const server = app.listen(0, "127.0.0.1");
    servers.push(server);
    await new Promise<void>(resolve =>
      server.once("listening", () => resolve())
    );
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Test server did not bind a TCP port.");

    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/health/backup-secret`
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
