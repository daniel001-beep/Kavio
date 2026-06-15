import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;

async function main() {
  if (!dbUrl) {
    console.error("No database URL found");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Truncating audit_log, verification_attempt, and receipt_upload tables...");
    await pool.query('TRUNCATE TABLE "audit_log" CASCADE;');
    await pool.query('TRUNCATE TABLE "verification_attempt" CASCADE;');
    await pool.query('TRUNCATE TABLE "receipt_upload" CASCADE;');
    
    console.log("Dropping problematic columns...");
    await pool.query('ALTER TABLE "invoice" DROP COLUMN IF EXISTS "transaction_reference";');
    await pool.query('ALTER TABLE "audit_log" DROP COLUMN IF EXISTS "event_type", DROP COLUMN IF EXISTS "entity_type", DROP COLUMN IF EXISTS "entity_id", DROP COLUMN IF EXISTS "changes", DROP COLUMN IF EXISTS "change_hash", DROP COLUMN IF EXISTS "timestamp";');
    
    console.log("Successfully prepared database for Drizzle push.");
  } catch (error) {
    console.error("Failed to execute DB preparation queries:", error);
  } finally {
    await pool.end();
  }
}

main();
