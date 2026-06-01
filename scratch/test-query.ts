import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function testConcurrency() {
  console.log("Loading Drizzle with loaded environment...");
  const { db } = await import("../src/db");
  const { eq, desc } = await import("drizzle-orm");
  const { transactions } = await import("../src/db/schema");

  console.log("Simulating 10 concurrent dashboard relational queries...");
  
  const promises = Array.from({ length: 10 }).map(async (_, idx) => {
    try {
      const start = Date.now();
      const res = await db.query.transactions.findMany({
        where: eq(transactions.userId, "usr_6wshej3ht"),
        orderBy: [desc(transactions.createdAt)],
      });
      console.log(`[Query ${idx}] ✅ Success! Found ${res.length} transactions in ${Date.now() - start}ms.`);
    } catch (err: any) {
      console.error(`[Query ${idx}] ❌ Failed:`, err.message || err);
    }
  });

  await Promise.all(promises);
}

testConcurrency().then(() => process.exit(0));
