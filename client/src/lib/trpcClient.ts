import { UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import superjson from "superjson";
import { getLoginUrl } from "../const";
import { trpc } from "./trpc";

export const queryClient = new QueryClient();

function redirectToLoginIfUnauthorized(error: unknown) {
  if (!(error instanceof TRPCClientError) || typeof window === "undefined") {
    return;
  }

  if (error.message === UNAUTHED_ERR_MSG) {
    window.location.assign(getLoginUrl());
  }
}

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    redirectToLoginIfUnauthorized(event.query.state.error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    redirectToLoginIfUnauthorized(event.mutation.state.error);
  }
});

/**
 * Jeden współdzielony klient tRPC. Bezpośrednie wywołanie procedury może dostać
 * AbortSignal, więc przycisk STOP odcina także zapytanie HTTP do modelu.
 */
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});
