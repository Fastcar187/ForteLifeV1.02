import { Pool } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

export async function runMigrations() {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DIRECT_DATABASE_URL ||
    process.env.DATABASE_URL;

  if (!connectionString || connectionString.includes("sample-pooler")) {
    console.log("No live DATABASE_URL provided. Skipping Neon Postgres migration script.");
    return;
  }

  console.log("Connecting to Neon Postgres via direct unpooled connection...");
  const pool = new Pool({ connectionString });
  try {
    console.log("Applying RLS and role policies to Neon Postgres...");
    const sqlPath = path.join(__dirname, "migrations", "0001_rls_and_roles.sql");
    if (fs.existsSync(sqlPath)) {
      const sqlContent = fs.readFileSync(sqlPath, "utf-8");
      await pool.query(sqlContent);
      console.log("RLS, roles, and reporter views applied successfully to Neon!");
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
