import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { backupSecretHealthHandler } from "./backup-secret-health";
import { performDatabaseBackup } from "./backup-cron";
import { archiveOldSessions } from "./archive-cron";
import { refreshKsefSources } from "./ksef-refresh";
import { refreshLegalNews } from "./legal-news-refresh";
import { runModelCompatibilityProbe } from "./model-compatibility";
import { createScheduledTaskHandler } from "./scheduled-tasks";
import { registerStorageProxy } from "./storageProxy";
import { releaseVersionHandler } from "./release-version";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  app.get("/api/health/backup-secret", backupSecretHealthHandler);
  app.get("/api/app-version", releaseVersionHandler);

  app.post(
    "/api/scheduled/model-compatibility",
    createScheduledTaskHandler("model-compatibility", async () => ({
      report: await runModelCompatibilityProbe(),
    }))
  );
  app.post(
    "/api/scheduled/legal-news-refresh",
    createScheduledTaskHandler("legal-news-refresh", async () => ({
      refresh: await refreshLegalNews(),
    }))
  );
  app.post(
    "/api/scheduled/ksef-refresh",
    createScheduledTaskHandler("ksef-refresh", async () => ({
      refresh: await refreshKsefSources(),
    }))
  );
  app.post(
    "/api/scheduled/session-archive",
    createScheduledTaskHandler("session-archive", async () => ({
      archived: await archiveOldSessions(),
    }))
  );
  app.post(
    "/api/scheduled/database-backup",
    createScheduledTaskHandler("database-backup", async () => {
      const backup = await performDatabaseBackup();
      return {
        encryptedBytes: backup.encryptedBytes,
        checksumSha256: backup.checksumSha256,
      };
    })
  );

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
