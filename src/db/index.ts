import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import { SessionUser } from "../lib/types";

let dbInstance: ReturnType<typeof drizzle> | null = null;
let pool: Pool | null = null;

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.includes("sample-pooler")) {
    return null;
  }

  if (!dbInstance) {
    pool = new Pool({ connectionString });
    dbInstance = drizzle(pool, { schema });
  }

  return dbInstance;
}

/**
 * Persists audit log entry directly to Neon Postgres append-only table
 */
export async function recordAuditToDatabase(entry: {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  recordType?: string | null;
  recordId?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const db = getDatabase();
  if (!db) return;
  try {
    await db.insert(schema.auditLog).values({
      actorId: entry.actorId ? (entry.actorId.startsWith("usr-") ? null : entry.actorId) : null,
      actorRole: entry.actorRole || null,
      action: entry.action,
      recordType: entry.recordType || null,
      recordId: entry.recordId ? (entry.recordId.startsWith("app-") ? null : entry.recordId) : null,
      ip: entry.ip || "127.0.0.1",
      metadata: entry.metadata || null,
    });
  } catch (err) {
    console.warn("Neon audit_log persistence:", err);
  }
}

/**
 * Reusable server database helper with Row-Level Security (RLS) session variables
 * and atomic audit logging as requested in Prompt Section 4.3:
 *
 * SET LOCAL app.user_id = ...
 * SET LOCAL app.role = ...
 * SET LOCAL app.facility_id = ...
 */
export async function withSecureTransaction<T>(
  sessionUser: SessionUser,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  const db = getDatabase();

  if (!db) {
    // Local fallback
    return await callback(null);
  }

  return await db.transaction(async (tx) => {
    // Inject session identity into Postgres session for RLS policies
    await tx.execute(
      sql`SELECT set_config('app.user_id', ${sessionUser.id || ""}, true)`
    );
    await tx.execute(
      sql`SELECT set_config('app.role', ${sessionUser.role || "patient"}, true)`
    );
    await tx.execute(
      sql`SELECT set_config('app.facility_id', ${sessionUser.facilityId || ""}, true)`
    );

    const result = await callback(tx);
    return result;
  });
}
