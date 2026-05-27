import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function testAdmin() {
  console.log("Loading modules...");
  const { db } = await import("./src/db");
  const { users, transactions, auditLogs } = await import("./src/db/schema");
  
  console.log("Testing Drizzle queries on Supabase database...");
  try {
    console.log("1. Querying users table...");
    const allUsers = await db.select().from(users).limit(5);
    console.log(`✅ Success! Found ${allUsers.length} users.`);
    allUsers.forEach(u => console.log(` - ${u.name} (${u.email})`));

    console.log("2. Querying transactions table...");
    const allTransactions = await db.select().from(transactions).limit(5);
    console.log(`✅ Success! Found ${allTransactions.length} transactions.`);

    console.log("3. Querying auditLogs table...");
    const allAuditLogs = await db.select().from(auditLogs).limit(5);
    console.log(`✅ Success! Found ${allAuditLogs.length} audit logs.`);
  } catch (err: any) {
    console.error("❌ Drizzle Query Failed:", err);
    console.error("  -> Cause:", err.cause || "None");
  }
}

testAdmin().then(() => process.exit(0));
