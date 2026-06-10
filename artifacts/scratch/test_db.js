const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function test() {
  const url = process.env.POSTGRES_URL_NON_POOLING;
  console.log("Connecting to:", url ? url.substring(0, 50) + "..." : "undefined");
  
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("✅ Connected!");

    // Check users
    const usersRes = await client.query('SELECT * FROM "user";');
    console.log("Found users count:", usersRes.rows.length);
    console.log("Users:", usersRes.rows);

    await client.end();
  } catch (err) {
    console.error("❌ SQL Query failed:", err.message, err.stack);
  }
}

test();
