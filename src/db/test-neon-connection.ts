import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";
import fs from "fs";
import path from "path";
import { sql } from "drizzle-orm";

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

async function verifyNeonServices() {
  console.log("=== Testing Neon Database Connection & Services ===");

  const pooledUrl = process.env.DATABASE_URL;
  const unpooledUrl = process.env.DATABASE_URL_UNPOOLED;

  console.log(`Pooled URL Host: ${pooledUrl ? new URL(pooledUrl).hostname : "Missing"}`);
  console.log(`Unpooled URL Host: ${unpooledUrl ? new URL(unpooledUrl).hostname : "Missing"}`);

  if (!pooledUrl || !unpooledUrl) {
    throw new Error("Missing DATABASE_URL or DATABASE_URL_UNPOOLED in environment");
  }

  // 1. Test Pooled Connection (Application Runtime)
  console.log("\n1. Testing Pooled Connection (@neondatabase/serverless)...");
  const pooledPool = new Pool({ connectionString: pooledUrl });
  const db = drizzle(pooledPool, { schema });

  const facilities = await db.select().from(schema.facilities);
  console.log(`✓ Successfully queried ${facilities.length} healthcare facilities from Neon!`);
  facilities.forEach((f) => {
    console.log(`   - [${f.region}] ${f.name} (Address: ${f.locationAddress})`);
  });

  const services = await db.select().from(schema.services);
  console.log(`✓ Successfully queried ${services.length} clinical services from Neon!`);

  const users = await db.select().from(schema.users);
  console.log(`✓ Successfully queried ${users.length} clinical & administrative users across roles!`);

  // 2. Test Transaction & Session Variables (RLS setup)
  console.log("\n2. Testing Postgres Session Variables & Transaction...");
  await pooledPool.query("BEGIN;");
  await pooledPool.query("SELECT set_config('app.user_id', '00000000-0000-0000-0000-000000000001', true);");
  const configRes = await pooledPool.query("SELECT current_setting('app.user_id', true) as user_id;");
  console.log(`✓ Session variable app.user_id active: ${configRes.rows[0].user_id}`);
  await pooledPool.query("COMMIT;");

  // 3. Test View view_operational_metrics
  console.log("\n3. Testing Reporting View (view_operational_metrics)...");
  const metricsRes = await pooledPool.query("SELECT * FROM view_operational_metrics LIMIT 3;");
  console.log(`✓ Reporting view query returned ${metricsRes.rows.length} rows:`);
  metricsRes.rows.forEach((r) => {
    console.log(`   - Facility: ${r.facility_name} | Total: ${r.total_appointments} | No-shows: ${r.no_show_count}`);
  });

  await pooledPool.end();
  console.log("\n=== ALL NEON SERVICES VERIFIED END-TO-END! ===");
}

verifyNeonServices().catch((err) => {
  console.error("Neon verification failed:", err);
  process.exit(1);
});
