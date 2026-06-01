import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { businesses } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { createCollection } from "@/src/services/ledgerFacade";

async function getActiveBusinessId(userId: string) {
  const results = await db
    .select()
    .from(businesses)
    .where(eq(businesses.userId, userId))
    .limit(1);
  return results.length > 0 ? results[0].id : null;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized access blocked" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, currency, customerName, customerEmail, externalReference, idempotencyKey } = body;

    // Validate inputs
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valid invoicing amount is required" }, { status: 400 });
    }
    if (!customerName || !customerEmail) {
      return NextResponse.json({ error: "Customer details (name and email) are required" }, { status: 400 });
    }
    if (!externalReference) {
      return NextResponse.json({ error: "Invoice external reference ID is required" }, { status: 400 });
    }
    if (!idempotencyKey) {
      return NextResponse.json({ error: "Client-side idempotencyKey is required" }, { status: 400 });
    }

    let businessId = body.businessId;
    if (!businessId) {
      businessId = await getActiveBusinessId(session.user.id);
    }

    if (!businessId) {
      return NextResponse.json({ error: "No active business profile found." }, { status: 404 });
    }

    // Call facade logic
    const result = await createCollection({
      userId: session.user.id,
      businessId,
      amount: parseFloat(amount),
      currency: currency || "NGN",
      customerName,
      customerEmail,
      externalReference,
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      collection: result.collection,
      paymentLink: result.paymentLink,
      message: result.isDuplicate ? "Retrieved existing collection request." : "New collection invoice generated successfully."
    });
  } catch (error: any) {
    console.error("Failed to generate collection link:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
