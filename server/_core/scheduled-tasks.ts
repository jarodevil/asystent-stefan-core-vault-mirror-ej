import type { Request, Response } from "express";
import { sdk } from "./sdk";

export type ScheduledTaskResult = Record<string, unknown>;
export type ScheduledTask = () => Promise<ScheduledTaskResult>;

/**
 * Creates a cron-only HTTP handler. The Manus scheduler identity, not request
 * payload, is the sole authorization source; failed work returns 5xx for retry.
 */
export function createScheduledTaskHandler(name: string, task: ScheduledTask) {
  return async (req: Request, res: Response): Promise<void> => {
    let taskUid: string | undefined;
    try {
      const user = await sdk.authenticateRequest(req);
      taskUid = user.taskUid;
      if (!user.isCron || !taskUid) {
        res.status(403).json({ error: "cron-only" });
        return;
      }

      const result = await task();
      res.json({ ok: true, task: name, result });
    } catch (error) {
      console.error(`[ScheduledTask:${name}] failed`, error);
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
        context: { task: name, taskUid: taskUid ?? null, url: req.originalUrl },
        timestamp: new Date().toISOString(),
      });
    }
  };
}
