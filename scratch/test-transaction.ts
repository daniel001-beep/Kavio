import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { db } from '../src/db/index';
import { transactions, ledgerEntries } from '../src/db/schema';
import { eq, desc } from 'drizzle-orm';

async function main() {
  console.log("Loading DB...");
  const userId = 'usr_6wshej3ht'; // Admin ID
  const idempotencyKey = `test_idemp_${Date.now()}`;
  const amountBigInt = 1000;

  try {
    console.log("Starting db.transaction...");
    const result = await db.transaction(async (tx) => {
      console.log("1. Checking idempotency key...");
      const existingTx = await tx.query.transactions.findFirst({
        where: eq(transactions.idempotencyKey, idempotencyKey),
      });
      console.log("Existing tx:", existingTx);

      console.log("2. Checking last tx...");
      const lastTx = await tx.query.transactions.findFirst({
        where: eq(transactions.userId, userId),
        orderBy: [desc(transactions.createdAt)],
      });
      console.log("Last tx:", lastTx);

      const previousHash = lastTx?.hash || null;
      const timestamp = new Date();
      const hash = "dummy_hash_" + Math.random().toString(36).substring(2, 7);

      console.log("3. Inserting transaction...");
      const [newTx] = await tx.insert(transactions).values({
        userId,
        orderId: null,
        idempotencyKey,
        amount: amountBigInt,
        status: 'completed',
        hash,
        previousHash,
        metadata: {},
        createdAt: timestamp,
        completedAt: timestamp,
      }).returning();
      console.log("Inserted transaction:", newTx);

      console.log("4. Inserting ledger entry 1...");
      await tx.insert(ledgerEntries).values({
        transactionId: newTx.id,
        userId,
        accountType: 'MAIN',
        entryType: 'CREDIT',
        amount: amountBigInt,
        description: 'Test description',
        createdAt: timestamp,
      });

      console.log("5. Inserting ledger entry 2...");
      await tx.insert(ledgerEntries).values({
        transactionId: newTx.id,
        userId: 'SYSTEM',
        accountType: 'SETTLEMENT',
        entryType: 'DEBIT',
        amount: -amountBigInt,
        description: `Offset for transaction ${newTx.id}`,
        createdAt: timestamp,
      });

      return { success: true, transaction: newTx };
    });

    console.log("db.transaction finished successfully. Result:", result);
  } catch (err: any) {
    console.error("db.transaction FAILED!");
    console.error(err);
  }
}

main().catch(err => {
  console.error("Fatal:", err);
});
