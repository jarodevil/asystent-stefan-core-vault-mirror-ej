import type { Request, Response } from "express";
import { getManagedBackupEncryptionSecret } from "./backup-cron";

/** Lightweight operational check; it never returns the secret or derived key. */
export function backupSecretHealthHandler(_req: Request, res: Response): void {
  try {
    getManagedBackupEncryptionSecret();
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
}
