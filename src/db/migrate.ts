import { Pool } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

export async function runMigrations() {
  const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes("sample-pooler")) {
    console.log("No live DATABASE_URL provided. Skipping Neon Postgres migration script.");
    return;
  }

  const pool = new Pool({ connectionString });
  try {
    console.log("Applying RLS and role migrations to Neon Postgres...");
    const sqlPath = path.join(__dirname, "migrations", "0001_rls_and_roles.sql");
    if (fs.existsSync(sqlPath)) {
      const sqlContent = fs.readFileSync(sqlPath, "utf-8");
      await pool.query(sqlContent);
      console.log("Migrations applied successfully!");
    }
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

