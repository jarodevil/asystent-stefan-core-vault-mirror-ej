import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const authenticatedUser: AuthenticatedUser = {
  id: 7,
  openId: "oauth-user-7",
  email: "user@example.test",
  name: "Przykładowy użytkownik",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date("2026-10-09T00:00:00.000Z"),
  updatedAt: new Date("2026-10-09T00:00:00.000Z"),
  lastSignedIn: new Date("2026-10-09T00:00:00.000Z"),
};

describe("auth.me", () => {
  it("returns null for an anonymous request without leaking another user", async () => {
    const caller = appRouter.createCaller(createContext(null));

    await expect(caller.auth.me()).resolves.toBeNull();
  });

  it("returns the authenticated user bound by the OAuth session context", async () => {
    const caller = appRouter.createCaller(createContext(authenticatedUser));

    await expect(caller.auth.me()).resolves.toEqual(authenticatedUser);
  });

  it("does not allow an anonymous request to address a chat history by session id", async () => {
    const caller = appRouter.createCaller(createContext(null));

    await expect(caller.sessions.getMessages({ sessionId: 1 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
