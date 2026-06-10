process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { Pool } = require('pg');

const regions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ca-central-1',
  'sa-east-1',
];

async function testRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const connectionString = `postgres://postgres.lyhgfezubrbgikuxhcug:Z9QZIS6lXSIBNBdR@${host}:6543/postgres?sslmode=require&prepareThreshold=0&connection_timeout=5`;
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    const client = await pool.connect();
    client.release();
    await pool.end();
    return { success: true, message: "Connected successfully!" };
  } catch (err) {
    await pool.end();
    return { success: false, code: err.code, message: err.message };
  }
}

async function main() {
  console.log("Starting region discovery scan for Supabase pooler...");
  for (const r of regions) {
    console.log(`Testing region: ${r}...`);
    const res = await testRegion(r);
    console.log(`Region ${r}:`, res.success ? "✅ SUCCESS" : `❌ FAILED - ${res.message}`);
    if (res.success || !res.message.includes("Tenant or user not found")) {
      console.log(`\n🎉 FOUND POTENTIAL REGION: ${r}! (Message: ${res.message})\n`);
    }
  }
}

main();
