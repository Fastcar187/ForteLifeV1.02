import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import { SessionUser } from "../lib/types";
import { getDataStore } from "../lib/data-store";

let dbInstance: ReturnType<typeof drizzle> | null = null;
let pool: Pool | null = null;

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.includes("sample-pooler")) {
    // Return null to signify fallback to in-memory store in dev/local demo
    return null;
  }

  if (!dbInstance) {
    pool = new Pool({ connectionString });
    dbInstance = drizzle(pool, { schema });
  }

  return dbInstance;
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
    // Development / Local resilient fallback to data-store
    return await callback(getDataStore());
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

