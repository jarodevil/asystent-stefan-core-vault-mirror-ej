/**
 * Logical database backup for the platform Heartbeat handler.
 *
 * It uses mysql2 rather than a container binary so the backup remains valid in
 * WebDev's production Node-only runtime. The artifact is compressed, encrypted
 * with the managed application secret, and stored under one rotating key.
 */

import { createCipheriv, createHash, randomBytes } from "crypto";
import { gzipSync } from "zlib";
import mysql from "mysql2/promise";
import { storagePut } from "../storage";
import { ENV } from "./env";
import { cacheSet } from "./system-cache";

const MAX_BACKUP_BYTES = 32 * 1024 * 1024;
const BACKUP_STORAGE_KEY = "system-backups/database/latest.sql.gz.enc";
const BACKUP_MAGIC = Buffer.from("STEFAN_DB_BACKUP_V1\n", "utf8");

export type DatabaseBackupResult = {
  key: string;
  encryptedBytes: number;
  checksumSha256: string;
};

function escapeIdentifier(identifier: string): string {
  if (!/^[A-Za-z0-9_$]+$/.test(identifier)) {
    throw new Error("Unexpected database identifier in backup export.");
  }
  return `\`${identifier}\``;
}

function appendChunk(
  chunks: string[],
  value: string,
  total: { bytes: number }
): void {
  total.bytes += Buffer.byteLength(value, "utf8");
  if (total.bytes > MAX_BACKUP_BYTES) {
    throw new Error(
      `Logical backup exceeded ${MAX_BACKUP_BYTES} bytes safety limit.`
    );
  }
  chunks.push(value);
}

/** Builds a restorable SQL export using the production-safe mysql2 dependency. */
export async function createLogicalDatabaseBackup(
  databaseUrl: string
): Promise<Buffer> {
  const connection = await mysql.createConnection(databaseUrl);
  try {
    await connection.query(
      "SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ"
    );
    await connection.beginTransaction();

    const [tableRows] = await connection.query<mysql.RowDataPacket[]>(
      "SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'"
    );
    const chunks: string[] = ["SET FOREIGN_KEY_CHECKS=0;\n"];
    const total = { bytes: Buffer.byteLength(chunks[0], "utf8") };

    for (const tableRow of tableRows) {
      const table = Object.values(tableRow)[0];
      if (typeof table !== "string") {
        throw new Error("Unable to determine table name during backup export.");
      }
      const quotedTable = escapeIdentifier(table);
      const [createRows] = await connection.query<mysql.RowDataPacket[]>(
        `SHOW CREATE TABLE ${quotedTable}`
      );
      const createStatement = createRows[0]?.["Create Table"];
      if (typeof createStatement !== "string") {
        throw new Error(`Unable to read schema for table ${table}.`);
      }

      appendChunk(
        chunks,
        `DROP TABLE IF EXISTS ${quotedTable};\n${createStatement};\n`,
        total
      );
      const [rows] = await connection.query<mysql.RowDataPacket[]>(
        `SELECT * FROM ${quotedTable}`
      );
      if (rows.length === 0) continue;

      const columns = Object.keys(rows[0]);
      const quotedColumns = columns.map(escapeIdentifier).join(", ");
      for (const row of rows) {
        const values = columns
          .map(column => connection.escape(row[column]))
          .join(", ");
        appendChunk(
          chunks,
          `INSERT INTO ${quotedTable} (${quotedColumns}) VALUES (${values});\n`,
          total
        );
      }
    }

    appendChunk(chunks, "SET FOREIGN_KEY_CHECKS=1;\n", total);
    await connection.commit();
    return Buffer.from(chunks.join(""), "utf8");
  } catch (error) {
    await connection.rollback().catch(() => undefined);
    throw error;
  } finally {
    await connection.end();
  }
}

export function encryptDatabaseBackup(
  plaintext: Buffer,
  secret: string
): Buffer {
  if (secret.length < 32) {
    throw new Error("Managed backup encryption secret is unavailable.");
  }

  const compressed = gzipSync(plaintext, { level: 9 });
  const key = createHash("sha256").update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
  return Buffer.concat([BACKUP_MAGIC, iv, cipher.getAuthTag(), encrypted]);
}

export function getManagedBackupEncryptionSecret(
  secret = ENV.backupEncryptionKey
): string {
  if (secret.length < 32) {
    throw new Error("Managed backup encryption secret is unavailable.");
  }
  return secret;
}

/** Executes one encrypted, rotating database backup. Throws on failure for Heartbeat retry. */
export async function performDatabaseBackup(): Promise<DatabaseBackupResult> {
  if (!ENV.databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const dump = await createLogicalDatabaseBackup(ENV.databaseUrl);
  const encrypted = encryptDatabaseBackup(
    dump,
    getManagedBackupEncryptionSecret()
  );
  const checksumSha256 = createHash("sha256").update(encrypted).digest("hex");
  const { key } = await storagePut(
    BACKUP_STORAGE_KEY,
    encrypted,
    "application/octet-stream"
  );

  await cacheSet(
    "database_backup_last_success",
    new Date().toISOString(),
    null,
    {
      key,
      encryptedBytes: encrypted.length,
      checksumSha256,
    }
  );

  console.log(
    `[BACKUP] Encrypted database backup completed (${encrypted.length} bytes).`
  );
  return { key, encryptedBytes: encrypted.length, checksumSha256 };
}
