import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];

// Explicit entry files prevent Vite from mixing a stale optimized React module
// with a directory-resolved React module after sandbox hibernation.
const reactPath = path.resolve(import.meta.dirname, "node_modules/react");
const reactDomPath = path.resolve(import.meta.dirname, "node_modules/react-dom");

export default defineConfig({
  plugins,
  resolve: {
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    alias: [
      // Exact matches prevent a generic "react" alias from catching sub-paths
      // and causing the optimizer to emit another runtime chunk.
      { find: /^react$/, replacement: path.resolve(reactPath, "index.js") },
      { find: /^react\/jsx-runtime$/, replacement: path.resolve(reactPath, "jsx-runtime.js") },
      { find: /^react\/jsx-dev-runtime$/, replacement: path.resolve(reactPath, "jsx-dev-runtime.js") },
      { find: /^react-dom$/, replacement: path.resolve(reactDomPath, "index.js") },
      { find: /^react-dom\/client$/, replacement: path.resolve(reactDomPath, "client.js") },
      { find: "@", replacement: path.resolve(import.meta.dirname, "client", "src") },
      { find: "@shared", replacement: path.resolve(import.meta.dirname, "shared") },
      { find: "@assets", replacement: path.resolve(import.meta.dirname, "attached_assets") },
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@trpc/react-query",
      "@tanstack/react-query",
    ],
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    hmr: {
      // Vite w middlewareMode zawsze inicjalizuje WebSocket.
      // Ustawiamy port:3000 (ten sam co HTTP) i clientPort:443 (port proxy Manus).
      // Dzięki temu przeglądarka próbuje połączyć się przez właściwy adres.
      // overlay:false ukrywa pop-up błędu jeśli WebSocket nadal nie działa.
      port: 3000,
      clientPort: 443,
      protocol: "wss",
      overlay: false,
    },
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
