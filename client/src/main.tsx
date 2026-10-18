import { trpc } from "@/lib/trpc";
import { queryClient, trpcClient } from "@/lib/trpcClient";
import { startReleaseConsistencyCheck } from "@/lib/releaseConsistency";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);

startReleaseConsistencyCheck();
