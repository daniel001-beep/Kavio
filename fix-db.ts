import { pgTable, text } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function fix() {
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  console.log("Connecting to:", connectionString?.split('@')[1]); // Log host only for safety

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  const db = drizzle(pool);

  console.log("Executing ALTER TABLE...");
  try {
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN "password" text;`);
    console.log("✅ Success! Password column added.");
  } catch (err: any) {
    console.log("Full Error:", JSON.stringify(err, null, 2));
    if (err.message && err.message.includes('already exists')) {
        console.log("✅ Column already exists, we are good!");
    } else {
        console.error("❌ Final Failure:", err.message || err);
    }
  } finally {
    await pool.end();
  }
  process.exit(0);
}

fix();
