import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function listTables() {
  let connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (connectionString) {
    connectionString = connectionString.trim().replace(/^["'()]+|["'()]+$/g, "").trim();
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log("Tables in public schema:");
    res.rows.forEach(row => console.log(`- ${row.table_name}`));
  } catch (err: any) {
    console.error("❌ Failed to list tables:", err.message || err);
  } finally {
    await pool.end();
  }
}

listTables();
