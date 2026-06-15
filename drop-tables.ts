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
    console.log("Dropping tables entirely to avoid drizzle-kit rename prompts...");
    await pool.query('DROP TABLE IF EXISTS "audit_log" CASCADE;');
    await pool.query('DROP TABLE IF EXISTS "verification_attempt" CASCADE;');
    await pool.query('DROP TABLE IF EXISTS "receipt_upload" CASCADE;');
    console.log("Successfully dropped tables.");
  } catch (error) {
    console.error("Failed to execute DB preparation queries:", error);
  } finally {
    await pool.end();
  }
}

main();
