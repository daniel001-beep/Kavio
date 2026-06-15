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
    await pool.query('ALTER TABLE "verification_attempt" DROP COLUMN IF EXISTS "extracted_date";');
    console.log("Successfully dropped extracted_date column.");
  } catch (error) {
    console.error("Failed to drop column:", error);
  } finally {
    await pool.end();
  }
}

main();
