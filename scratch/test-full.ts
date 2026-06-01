import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { db } from '../src/db/index';
import { users, transactions } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log("Database environment loaded.");
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("Supabase Service Key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  const testEmail = 'temilayoidowu7@gmail.com';

  console.log(`\n--- 1. Testing user query for ${testEmail} ---`);
  try {
    const res = await db.query.users.findFirst({
      where: (u: any, { eq }: any) => eq(u.email, testEmail)
    });
    console.log("User query result:", res);
  } catch (err: any) {
    console.error("User query failed!");
    console.error(err);
  }

  console.log("\n--- 2. Testing user insert ---");
  try {
    const userId = `usr_test_${Math.random().toString(36).substring(2, 7)}`;
    const [newUser] = await db.insert(users).values({
      id: userId,
      email: `test-${userId}@example.com`,
      name: 'Test User',
      password: 'testpassword',
      isAdmin: false,
    }).returning();
    console.log("User insert result:", newUser);
  } catch (err: any) {
    console.error("User insert failed!");
    console.error(err);
  }

  console.log("\n--- 3. Testing transaction insert (with BigInt amount) ---");
  try {
    const txId = `tx_test_${Math.random().toString(36).substring(2, 7)}`;
    const [newTx] = await db.insert(transactions).values({
      userId: 'usr_test_123',
      idempotencyKey: `idemp_${Date.now()}`,
      amount: 5000, // 50.00 dollars
      status: 'completed',
    }).returning();
    console.log("Transaction insert result:", newTx);
  } catch (err: any) {
    console.error("Transaction insert failed!");
    console.error(err);
  }
}

main().catch(err => {
  console.error("Unhanlded script error:", err);
});
