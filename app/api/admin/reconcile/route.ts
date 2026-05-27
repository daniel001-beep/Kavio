import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { transactions, users } from "@/src/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getResilientSession } from "@/src/lib/auth-session";

// 1. POST: Match and categorize bank statement transactions against DB records
export async function POST(req: Request) {
  try {
    const session = await getResilientSession();
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const bankEntries: any[] = body.entries || [];

    console.log(`[Reconciliation Engine] Matching ${bankEntries.length} statement entries...`);

    // Fetch all internal transactions for this user only
    const internalTxList = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, user.id))
      .orderBy(desc(transactions.createdAt));

    const matchedResults = bankEntries.map((bankItem: any, idx: number) => {
      const bankAmt = Number(bankItem.amount);
      const bankDate = new Date(bankItem.date);

      // Filtering criteria: search internal transactions
      const matches = internalTxList.filter((tx: any) => {
        const txAmt = Number(tx.amount) / 100;
        const txDate = new Date(tx.createdAt);
        
        let meta = tx.metadata as any;
        if (typeof meta === "string") {
          try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
        }

        // Amount must match
        const isAmountMatch = Math.abs(txAmt) === Math.abs(bankAmt);
        if (!isAmountMatch) return false;

        // Skip if already reconciled
        if (meta?.reconciled) return false;

        return true;
      });

      // Find perfect match (Amount match and date within 3 days window)
      const perfectMatch = matches.find((tx: any) => {
        const txDate = new Date(tx.createdAt);
        const dayDifference = Math.abs(txDate.getTime() - bankDate.getTime()) / (1000 * 60 * 60 * 24);
        return dayDifference <= 3;
      });

      if (perfectMatch) {
        let meta = perfectMatch.metadata as any;
        if (typeof meta === "string") {
          try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
        }
        return {
          bankItem,
          status: "MATCHED",
          match: {
            id: perfectMatch.id,
            description: meta?.description || "Invoice Payment",
            amount: Number(perfectMatch.amount) / 100,
            createdAt: perfectMatch.createdAt,
          }
        };
      }

      // Find fuzzy match (Amount match but date window is wider, e.g., up to 10 days)
      const fuzzyMatch = matches.find((tx: any) => {
        const txDate = new Date(tx.createdAt);
        const dayDifference = Math.abs(txDate.getTime() - bankDate.getTime()) / (1000 * 60 * 60 * 24);
        return dayDifference <= 10;
      });

      if (fuzzyMatch) {
        let meta = fuzzyMatch.metadata as any;
        if (typeof meta === "string") {
          try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
        }
        return {
          bankItem,
          status: "FUZZY",
          match: {
            id: fuzzyMatch.id,
            description: meta?.description || "Invoice Payment",
            amount: Number(fuzzyMatch.amount) / 100,
            createdAt: fuzzyMatch.createdAt,
          }
        };
      }

      return {
        bankItem,
        status: "UNMATCHED",
        match: null
      };
    });

    return NextResponse.json({
      status: "SUCCESS",
      reconciliationList: matchedResults,
    }, { status: 200 });

  } catch (err: any) {
    console.error("❌ Bank Reconciliation matching failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. PATCH: Finalize clearing of matched transactions (write status to DB metadata)
export async function PATCH(req: Request) {
  try {
    const session = await getResilientSession();
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactionId } = await req.json();
    if (!transactionId) {
      return NextResponse.json({ error: "Missing Transaction ID" }, { status: 400 });
    }

    // Retrieve target transaction securely belonging to the logged-in user
    const targetArray = await db.select().from(transactions).where(and(eq(transactions.id, transactionId), eq(transactions.userId, user.id))).limit(1);
    if (targetArray.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const tx = targetArray[0];
    let meta = tx.metadata as any;
    if (typeof meta === "string") {
      try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
    } else if (!meta) {
      meta = {};
    }

    // Update metadata properties
    meta.reconciled = true;
    meta.reconciled_at = new Date().toISOString();

    // Update in DB
    await db.update(transactions)
      .set({ metadata: meta })
      .where(eq(transactions.id, transactionId));

    console.log(`[Reconciliation Engine] Reconciled transaction: ${transactionId}`);

    return NextResponse.json({
      status: "SUCCESS",
      message: "Transaction cleared successfully.",
      transactionId,
    }, { status: 200 });

  } catch (err: any) {
    console.error("❌ Bank Reconciliation clearing failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
