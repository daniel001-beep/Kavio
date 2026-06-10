process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { Pool } = require('pg');

const connectionString = "postgres://postgres.lyhgfezubrbgikuxhcug:Z9QZIS6lXSIBNBdR@44.216.29.125:5432/postgres?sslmode=require";

async function main() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Connecting to PG using IP direct host...");
    const client = await pool.connect();
    console.log("Connected successfully using IP direct host!");
    
    const res = await client.query("SELECT NOW()");
    console.log("Query result:", res.rows);
    
    client.release();
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await pool.end();
  }
}

main();
