import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function runRawMigration() {
  let connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ No connection string found. Set POSTGRES_URL or DATABASE_URL in .env.local");
    process.exit(1);
  }

  connectionString = connectionString.trim().replace(/^["'()]+|["'()]+$/g, "").trim();

  console.log("Connecting to database using raw client...");
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const migrationPath = path.join(process.cwd(), "supabase", "migrations", "20260615_verification_refactor.sql");
    console.log(`Reading SQL file from ${migrationPath}...`);
    const sqlContent = fs.readFileSync(migrationPath, "utf8");

    console.log("Executing migration queries...");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      // Execute the entire SQL script as a single batch
      await client.query(sqlContent);
      
      await client.query("COMMIT");
      console.log("🎉 Raw SQL migration applied successfully!");
    } catch (err: any) {
      await client.query("ROLLBACK");
      console.error("❌ Database query error:", err.message || err);
      console.error(err);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("❌ Connection failed:", error.message || error);
  } finally {
    await pool.end();
  }
}

runRawMigration();
