import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { businesses } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { logBusinessTransaction, getBusinessTransactions } from "@/src/services/ledgerFacade";

// Helper to get user's first business ID if not specified
async function getActiveBusinessId(userId: string) {
  const results = await db
    .select()
    .from(businesses)
    .where(eq(businesses.userId, userId))
    .limit(1);
  return results.length > 0 ? results[0].id : null;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized access blocked" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let businessId = searchParams.get("businessId");

    if (!businessId) {
      businessId = await getActiveBusinessId(session.user.id);
    }

    if (!businessId) {
      return NextResponse.json({ error: "No active business profile found. Onboarding required." }, { status: 404 });
    }

    const txs = await getBusinessTransactions(session.user.id, businessId);
    return NextResponse.json({ transactions: txs });
  } catch (error: any) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json({ error: error.message || "Failed to load transactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized access blocked" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, type, category, accountId, description, date, targetAccountId } = body;

    // Validate inputs
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valid transaction amount is required" }, { status: 400 });
    }
    if (!type || !['income', 'expense', 'transfer'].includes(type)) {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
    }
    if (!accountId) {
      return NextResponse.json({ error: "Source financial account is required" }, { status: 400 });
    }
    if (!category && type !== 'transfer') {
      return NextResponse.json({ error: "Category is required for deposits or expenses" }, { status: 400 });
    }

    let businessId = body.businessId;
    if (!businessId) {
      businessId = await getActiveBusinessId(session.user.id);
    }

    if (!businessId) {
      return NextResponse.json({ error: "No active business profile found." }, { status: 404 });
    }

    const txRecord = await logBusinessTransaction({
      userId: session.user.id,
      businessId,
      accountId,
      amount: parseFloat(amount),
      type,
      category: category || "Transfer",
      description: description || `${type.charAt(0).toUpperCase() + type.slice(1)} transaction`,
      date: date ? new Date(date) : undefined,
      targetAccountId,
    });

    return NextResponse.json({ success: true, transaction: txRecord });
  } catch (error: any) {
    console.error("Failed to log transaction:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
