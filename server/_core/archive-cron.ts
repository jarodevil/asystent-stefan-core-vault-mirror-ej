/**
 * Session archival task executed only by the platform Heartbeat.
 * The file name is retained for compatibility with existing imports.
 */

import { autoArchiveInactiveSessions } from "../db-sessions";

export async function archiveOldSessions(): Promise<number> {
  const archived = await autoArchiveInactiveSessions();
  console.log(`[SESSION ARCHIVE] Archived ${archived} inactive sessions.`);
  return archived;
}
