import { db } from "@/src/db";
import { transactions, users } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Service to handle all ledger-related database operations.
 * Includes built-in retry logic for network resilience.
 */

export async function getTransactionsForUser(userId: string) {
  const MAX_RETRIES = 2;
  let dbTx = [];

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      dbTx = await db.query.transactions.findMany({
        where: eq(transactions.userId, userId),
        orderBy: [desc(transactions.createdAt)],
      });
      return dbTx;
    } catch (error) {
      if (i === MAX_RETRIES - 1) {
        console.error(`Ledger service fetch failed after ${MAX_RETRIES} attempts:`, error);
        return [];
      }
      // Delay before retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return [];
}

export async function getDashboardStats(userId: string) {
  const dbTx = await getTransactionsForUser(userId);
  
  let totalBalanceCents = 0n;
  let dayChangeCents = 0n;
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const mappedTx = dbTx.map((tx) => {
    const meta = (tx.metadata as any) || {};
    totalBalanceCents += tx.amount;

    if (tx.createdAt && new Date(tx.createdAt) > oneDayAgo) {
      dayChangeCents += tx.amount;
    }

    return {
      id: tx.id,
      type: meta.type || (tx.amount > 0n ? 'DEPOSIT' : 'TRANSFER'),
      description: meta.description || `Transaction ${tx.id.substring(0, 8)}`,
      date: tx.createdAt ? new Date(tx.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      amount: Number(tx.amount) / 100,
      status: tx.status.toUpperCase(),
    };
  });

  return {
    totalBalanceUsd: Number(totalBalanceCents) / 100,
    dayChangeUsd: Number(dayChangeCents) / 100,
    transactions: mappedTx,
  };
}

export async function getRealUsers() {
  const MAX_RETRIES = 2;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const dbUsers = await db.query.users.findMany({
        orderBy: [desc(users.id)],
      });
      return dbUsers.map(u => ({
        id: u.id,
        name: u.name || 'Anonymous User',
        email: u.email,
        role: u.isAdmin ? 'Super Admin' : 'User',
        status: 'Active', // Default for now
        kyc: 'Verified', // Default for now
        lastLogin: 'Just now',
      }));
    } catch (error) {
      if (i === MAX_RETRIES - 1) {
        console.error(`Ledger service fetch users failed:`, error);
        return [];
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return [];
}
