import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function runMigration() {
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ No connection string found. Set POSTGRES_URL or DATABASE_URL in .env.local");
    process.exit(1);
  }
  
  console.log("Connecting to Database host...");
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  const db = drizzle(pool);

  try {
    const migrationPath = path.join(process.cwd(), "supabase", "migrations", "20260615_verification_refactor.sql");
    console.log(`Reading migration file from ${migrationPath}...`);
    const sqlContent = fs.readFileSync(migrationPath, "utf8");

    console.log("Applying database migration...");
    // Split the SQL commands by semicolon (ignoring comments)
    const queries = sqlContent
      .split(";")
      .map(q => q.replace(/--.*$/gm, "").trim())
      .filter(q => q.length > 0);

    for (const query of queries) {
      console.log(`Executing: ${query.substring(0, 100)}...`);
      await db.execute(sql.raw(query));
    }

    console.log("🎉 Migration ran and applied successfully!");
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message || error);
  } finally {
    await pool.end();
  }
}

runMigration();
