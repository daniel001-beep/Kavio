import { Pool } from "pg";

async function testDirect() {
  const connectionString = "postgres://postgres.lyhgfezubrbgikuxhcug:Z9QZIS6lXSIBNBdR@aws-0-us-east-1.pooler.supabase.com:5432/postgres";
  console.log("Connecting directly to aws-0-us-east-1.pooler.supabase.com:5432...");

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
    console.log("✅ Direct Connection Success! Tables in public schema:");
    res.rows.forEach(row => console.log(`- ${row.table_name}`));
  } catch (err: any) {
    console.error("❌ Direct Connection Failed:", err.message || err);
  } finally {
    await pool.end();
  }
}

testDirect();
