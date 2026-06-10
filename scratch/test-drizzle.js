process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Force POSTGRES_URL to use the supabase connection string from env
process.env.POSTGRES_URL = "postgres://postgres.lyhgfezubrbgikuxhcug:Z9QZIS6lXSIBNBdR@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require";

async function main() {
  try {
    const { db } = require('../src/db/index');
    console.log("Drizzle db loaded.");
    
    console.log("Running Drizzle findFirst query...");
    const res = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, 'test@example.com')
    });
    console.log("Drizzle query result:", res);
    } catch (err) {
    console.error("Drizzle query failed with raw error:");
    console.dir(err, { depth: null });
  }
}

main();
