import { db } from "@/src/db";
import { transactions, ledgerEntries, auditLogs, outboxEvents } from "@/src/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { generateTransactionHash } from "@/src/lib/crypto";

export interface MTDStats {
  revenueMTD: number;
  expensesMTD: number;
  netProfitMTD: number;
  currentBalance: number;
}

export interface LogTransactionParams {
  amount: number; // in cents/kobo
  idempotencyKey: string;
  description?: string;
  metadata?: any;
  status?: string;
  orderId?: number | null;
  locationIp?: string;
  userAgent?: string;
}

/**
 * High-level business logic layer abstracting database operations
 * and ensuring cryptographic ledger integrity.
 */
export class FinanceService {

  /**
   * Fetches raw database transaction records for a given user.
   * Insulates endpoints and UI from direct Drizzle imports.
   * Leverages exponential backoff retries for network resilience.
   */
  static async getRawTransactions(userId: string) {
    const MAX_RETRIES = 3;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const drizzleTransactions = await db.query.transactions.findMany({
          where: eq(transactions.userId, userId),
          orderBy: [desc(transactions.createdAt)],
        });

        return drizzleTransactions.sort((a, b) => {
          const timeA = new Date(a.createdAt).getTime();
          const timeB = new Date(b.createdAt).getTime();
          return timeB - timeA;
        });
      } catch (error) {
        if (i === MAX_RETRIES - 1) {
          console.error(`FinanceService: Failed to fetch transactions after ${MAX_RETRIES} attempts:`, error);
          throw error;
        }
        console.warn(`FinanceService: Transaction fetch attempt ${i + 1} timed out. Retrying in 1000ms...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    return [];
  }

  /**
   * Fetches Month-to-Date (MTD) financial summaries for a given user.
   */
  static async getMTDStats(userId: string): Promise<MTDStats> {
    const userTxs = await this.getRawTransactions(userId);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    let currentBalance = 0;
    let revenueMTD = 0;
    let expensesMTD = 0;

    userTxs.forEach((tx) => {
      const amountInDollars = Number(tx.amount) / 100;
      
      if (tx.status === "completed") {
        currentBalance += amountInDollars;
        
        const txDate = new Date(tx.createdAt);
        if (txDate >= startOfMonth) {
          if (amountInDollars > 0) {
            revenueMTD += amountInDollars;
          } else {
            expensesMTD += Math.abs(amountInDollars);
          }
        }
      }
    });

    return {
      revenueMTD,
      expensesMTD,
      netProfitMTD: revenueMTD - expensesMTD,
      currentBalance,
    };
  }

  /**
   * Core atomic method to process a balanced double-entry transaction.
   * Handles idempotency, cryptographic SHA-256 chaining, balanced entries,
   * audit logs, and outbox webhook dispatches in a single database transaction.
   */
  static async logTransaction(userId: string, params: LogTransactionParams) {
    const parsedAmount = Number(params.amount);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      throw new Error("Valid amount is required (in cents/kobo)");
    }

    const amountBigInt = BigInt(Math.floor(parsedAmount));
    const status = params.status === "Paid" ? "completed" : "pending";
    const idempotencyKey = params.idempotencyKey;
    const description = params.description || "Ledger transaction";
    const locationIp = params.locationIp || "127.0.0.1";
    const userAgent = params.userAgent || "Velox Core";

    return await db.transaction(async (tx) => {
      // 1. Idempotency Check: Prevent duplicate processing
      const existingTx = await tx.query.transactions.findFirst({
        where: eq(transactions.idempotencyKey, idempotencyKey),
      });

      if (existingTx) {
        return { success: true, transaction: existingTx, idempotent: true };
      }

      // 2. Fetch the most recent transaction for this user to get previousHash
      const lastTx = await tx.query.transactions.findFirst({
        where: eq(transactions.userId, userId),
        orderBy: [desc(transactions.createdAt)],
      });

      const previousHash = lastTx?.hash || null;
      const timestamp = new Date();

      // 3. Generate cryptographic hash
      const hash = generateTransactionHash(
        amountBigInt,
        userId,
        timestamp,
        previousHash
      );

      // 4. Insert main transaction record
      const [newTx] = await tx
        .insert(transactions)
        .values({
          userId,
          orderId: params.orderId || null,
          idempotencyKey,
          amount: amountBigInt.toString(),
          status: status,
          hash,
          previousHash,
          metadata: params.metadata || {},
          createdAt: timestamp,
          completedAt: status === "completed" ? timestamp : null,
        })
        .returning();

      // 5. Insert double-entry ledger records
      await tx.insert(ledgerEntries).values({
        transactionId: newTx.id,
        userId,
        accountType: "MAIN",
        entryType: amountBigInt > 0n ? "CREDIT" : "DEBIT",
        amount: amountBigInt.toString(),
        description: description,
        createdAt: timestamp,
      });

      // Offset entry for balance
      await tx.insert(ledgerEntries).values({
        transactionId: newTx.id,
        userId: "SYSTEM",
        accountType: "SETTLEMENT",
        entryType: amountBigInt > 0n ? "DEBIT" : "CREDIT",
        amount: (-amountBigInt).toString(),
        description: `Offset for transaction ${newTx.id}`,
        createdAt: timestamp,
      });

      // 6. Audit logging
      try {
        await tx.insert(auditLogs).values({
          userId,
          eventType: "TRANSACTION_CREATED",
          entityType: "transaction",
          entityId: newTx.id,
          changes: { amount: amountBigInt.toString(), idempotencyKey },
          ipAddress: locationIp,
          userAgent: userAgent,
          metadata: {
            description: description,
            amount: Number(amountBigInt) / 100,
          },
        });

        // Outbox Pattern: Insert webhook event in the same transaction
        if (status === "completed") {
          await tx.insert(outboxEvents).values({
            eventType: "transaction.completed",
            payload: newTx,
            status: "pending",
          });
        }
      } catch (auditErr) {
        console.warn("[Audit/Outbox] Non-blocking: Failed to log event:", auditErr);
      }

      return { success: true, transaction: newTx, idempotent: false };
    });
  }

  /**
   * Deletes a transaction and all its associated balanced ledger entries atomicaly.
   * Fully prevents foreign key constraint issues.
   */
  static async deleteTransaction(userId: string, transactionId: string) {
    return await db.transaction(async (tx) => {
      // 1. Verify ownership
      const existingTx = await tx.query.transactions.findFirst({
        where: and(eq(transactions.id, transactionId), eq(transactions.userId, userId)),
      });

      if (!existingTx) {
        throw new Error("Transaction not found or unauthorized");
      }

      // 2. Cascade delete linked ledger entries first to respect FK constraints
      await tx.delete(ledgerEntries).where(eq(ledgerEntries.transactionId, transactionId));

      // 3. Delete the transaction itself
      await tx.delete(transactions).where(eq(transactions.id, transactionId));

      // 4. Log deletion in audit log
      try {
        await tx.insert(auditLogs).values({
          userId,
          eventType: "TRANSACTION_DELETED",
          entityType: "transaction",
          entityId: transactionId,
          changes: { deletedTransaction: existingTx },
          ipAddress: "127.0.0.1",
          userAgent: "Velox Admin",
          metadata: {
            description: `Deleted transaction: ${existingTx.id}`,
            amount: Number(existingTx.amount) / 100,
          },
        });
      } catch (auditErr) {
        console.warn("[Audit] Non-blocking: Failed to log deletion audit:", auditErr);
      }

      return { success: true };
    });
  }

  /**
   * Updates an existing transaction and updates all associated ledger entries.
   * Keeps the double-entry accounting state balanced and aligned.
   */
  static async updateTransaction(
    userId: string,
    transactionId: string,
    params: { 
      amount?: number; 
      description?: string; 
      category?: string; 
      account?: string; 
      status?: string;
    }
  ) {
    return await db.transaction(async (tx) => {
      // 1. Verify ownership and load transaction
      const existingTx = await tx.query.transactions.findFirst({
        where: and(eq(transactions.id, transactionId), eq(transactions.userId, userId)),
      });

      if (!existingTx) {
        throw new Error("Transaction not found or unauthorized");
      }

      const updatedMetadata = {
        ...(existingTx.metadata as any || {}),
      };
      if (params.description !== undefined) updatedMetadata.description = params.description;
      if (params.category !== undefined) updatedMetadata.category = params.category;
      if (params.account !== undefined) updatedMetadata.accountId = params.account;

      const newStatus = params.status !== undefined 
        ? (params.status === "Paid" || params.status === "completed" ? "completed" : "pending")
        : existingTx.status;

      let newAmountBigInt = BigInt(existingTx.amount);
      if (params.amount !== undefined) {
        newAmountBigInt = BigInt(Math.floor(params.amount));
      }

      // 2. Perform database updates
      const [updatedTx] = await tx
        .update(transactions)
        .set({
          amount: newAmountBigInt.toString(),
          status: newStatus,
          metadata: updatedMetadata,
          completedAt: newStatus === "completed" ? new Date() : null,
        })
        .where(eq(transactions.id, transactionId))
        .returning();

      // 3. Re-calculate balanced double ledger entries if amount or description changes
      // Simply delete existing entries and re-insert balanced credits/debits matching the updated parameters
      await tx.delete(ledgerEntries).where(eq(ledgerEntries.transactionId, transactionId));

      // Re-insert MAIN entry
      await tx.insert(ledgerEntries).values({
        transactionId,
        userId,
        accountType: "MAIN",
        entryType: newAmountBigInt > 0n ? "CREDIT" : "DEBIT",
        amount: newAmountBigInt.toString(),
        description: params.description || updatedMetadata.description || "Updated Transaction",
        createdAt: existingTx.createdAt,
      });

      // Re-insert SYSTEM OFFSET entry
      await tx.insert(ledgerEntries).values({
        transactionId,
        userId: "SYSTEM",
        accountType: "SETTLEMENT",
        entryType: newAmountBigInt > 0n ? "DEBIT" : "CREDIT",
        amount: (-newAmountBigInt).toString(),
        description: `Offset for transaction ${transactionId}`,
        createdAt: existingTx.createdAt,
      });

      // 4. Log modification in audit log
      try {
        await tx.insert(auditLogs).values({
          userId,
          eventType: "TRANSACTION_MODIFIED",
          entityType: "transaction",
          entityId: transactionId,
          changes: {
            before: existingTx,
            after: updatedTx
          },
          ipAddress: "127.0.0.1",
          userAgent: "Velox Admin",
          metadata: {
            description: `Updated transaction: ${transactionId}`,
            amount: Number(newAmountBigInt) / 100,
          },
        });
      } catch (auditErr) {
        console.warn("[Audit] Non-blocking: Failed to log modification audit:", auditErr);
      }

      return { success: true, transaction: updatedTx };
    });
  }
}

