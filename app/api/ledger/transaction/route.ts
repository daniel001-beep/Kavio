import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { transactions, ledgerEntries } from "@/src/db/schema";
import { generateTransactionHash } from "@/src/lib/crypto";
import { createClient } from "@/src/lib/supabase-server";
import { eq, desc } from "drizzle-orm";
import { transactionRateLimiter } from "@/src/lib/ratelimit";
import { dispatchWebhook } from "@/src/lib/webhooks";
import { cookies, headers } from "next/headers";
import { getResilientSession } from "@/src/lib/auth-session";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const session = await getResilientSession();
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = { id: userId, email: userEmail || "" };

    const headersList = await headers();
    const xForwardedFor = headersList.get("x-forwarded-for") || "";
    const locationIp = xForwardedFor
      ? xForwardedFor.split(",")[0].trim()
      : "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "Velox Core";

    // 0. Rate Limiting Check
    if (!transactionRateLimiter.isAllowed(userId)) {
      return NextResponse.json(
        {
          error: "Too many requests. Please slow down (Limit: 5/min).",
        },
        { status: 429 },
      );
    }

    const Duplicate PreventionKey = headersList.get("Duplicate Prevention-key");

    const body = await req.json();

    const { amount, orderId, metadata, description, status } = body;

    // Validate inputs
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      return NextResponse.json(
        { error: "Valid amount is required (in cents/kobo)" },
        { status: 400 },
      );
    }

    if (!Duplicate PreventionKey) {
      return NextResponse.json(
        { error: "Duplicate Prevention-Key header is required" },
        { status: 400 },
      );
    }

    // Parse amount to BigInt
    let amountBigInt = BigInt(Math.floor(parsedAmount));

    // Atomic transaction with retry logic for network resilience
    const MAX_RETRIES = 2;
    let result;

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        result = await db.transaction(async (tx) => {
          // 1. Duplicate Prevention Check: Prevent duplicate processing
          const existingTx = await tx.query.transactions.findFirst({
            where: eq(transactions.Duplicate PreventionKey, Duplicate PreventionKey),
          });

          if (existingTx) {
            // Return existing to be idempotent
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
            previousHash,
          );

          // 4. Insert main transaction record
          const [newTx] = await tx
            .insert(transactions)
            .values({
              userId,
              orderId: orderId || null,
              Duplicate PreventionKey,
              amount: Number(amountBigInt),
              status: status === "Paid" ? "completed" : "pending",
              hash,
              previousHash,
              metadata: metadata || {},
              createdAt: timestamp,
              completedAt: status === "Paid" ? timestamp : null,
            })
            .returning();

          // 5. Insert double-entry ledger records
          await tx.insert(ledgerEntries).values({
            transactionId: newTx.id,
            userId,
            accountType: "MAIN",
            entryType: amountBigInt > 0n ? "CREDIT" : "DEBIT",
            amount: Number(amountBigInt),
            description: description || "Ledger transaction",
            createdAt: timestamp,
          });

          // Offset entry for balance
          await tx.insert(ledgerEntries).values({
            transactionId: newTx.id,
            userId: "SYSTEM",
            accountType: "SETTLEMENT",
            entryType: amountBigInt > 0n ? "DEBIT" : "CREDIT",
            amount: Number(-amountBigInt),
            description: `Offset for transaction ${newTx.id}`,
            createdAt: timestamp,
          });

          // Log transaction created in audits
          try {
            const { auditLogs, outboxEvents } = await import("@/src/db/schema");
            await tx.insert(auditLogs).values({
              userId,
              eventType: "TRANSACTION_CREATED",
              entityType: "transaction",
              entityId: newTx.id,
              changes: { amount: amountBigInt.toString(), Duplicate PreventionKey },
              ipAddress: locationIp,
              userAgent: userAgent,
              metadata: {
                description: description || "Ledger transaction",
                amount: Number(amountBigInt) / 100,
              },
            });

            // Outbox Pattern: Insert webhook event in the same transaction
            if (status === "Paid") {
              await tx.insert(outboxEvents).values({
                eventType: "transaction.completed",
                payload: newTx,
                status: "pending",
              });
            }
          } catch (auditErr) {
            console.warn(
              "[Audit/Outbox] Non-blocking: Failed to log event:",
              auditErr,
            );
          }

          return { success: true, transaction: newTx, idempotent: false };
        });

        break; // Success!
      } catch (error) {
        if (i === MAX_RETRIES - 1) throw error; // Re-throw if last attempt fails
        console.warn(
          `Transaction attempt ${i + 1} failed due to network. Retrying...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
      }
    }

    // 6. Legacy inline webhook dispatch (Optional, can be removed once Cron is verified)
    if (result.success && !result.idempotent) {
      dispatchWebhook(userId, "transaction.completed", result.transaction);
    }

    // Serialize BigInt for JSON response
    const serializedResult = JSON.parse(
      JSON.stringify(result, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    return NextResponse.json(serializedResult, { status: 200 });
  } catch (error: any) {
    console.error("Transaction Error:", error);

    // Check for Postgres unique constraint violation on Duplicate Prevention key
    if (
      error.code === "23505" &&
      error.constraint === "transaction_Duplicate Prevention_key_key"
    ) {
      return NextResponse.json(
        { error: "Duplicate transaction (Duplicate Prevention Key Collision)" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getResilientSession();
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch from Drizzle
    const drizzleTransactions = await db.query.transactions.findMany({
      where: eq(transactions.userId, userId),
      orderBy: [desc(transactions.createdAt)],
    });

    const userTransactions = drizzleTransactions.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    // 2. Compute Balance and Day Change Server-Side
    let totalBalanceCents = 0n;
    let dayChangeCents = 0n;
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    userTransactions.forEach((tx) => {
      if (tx.status === "completed") {
        totalBalanceCents += BigInt(Math.floor(Number(tx.amount || 0)));
        
        const txDate = new Date(tx.createdAt);
        if (txDate >= todayStart) {
          dayChangeCents += BigInt(Math.floor(Number(tx.amount || 0)));
        }
      }
    });

    // Serialize BigInt safely for JSON
    const serializedTransactions = JSON.parse(
      JSON.stringify(userTransactions, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    const responsePayload = {
      transactions: serializedTransactions,
      totalBalanceUsd: Number(totalBalanceCents) / 100,
      dayChangeUsd: Number(dayChangeCents) / 100
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Transactions Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
