import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { invoices, payments } from "@/src/db/schema";
import { getResilientSession } from "@/src/lib/auth-session";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const session = await getResilientSession();
    const sessionUserId = session?.user?.id;

    const body = await req.json();
    const { amount, reference, notes, datePaid } = body;

    // Verify invoice exists
    const invoiceRecord = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    if (invoiceRecord.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const invoice = invoiceRecord[0];

    // If freelancer is authenticated, check ownership. If public client check-in, bypass ownership check.
    if (sessionUserId && invoice.userId !== sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const paymentAmount = amount !== undefined ? Number(amount) : invoice.amount;
    const finalUserId = sessionUserId || invoice.userId; // Use owner's ID if public client check-in

    // 1. Insert payment record
    const [newPayment] = await db
      .insert(payments)
      .values({
        invoiceId: invoice.id,
        userId: finalUserId,
        amount: paymentAmount,
        datePaid: datePaid ? new Date(datePaid) : new Date(),
        reference: reference || null,
        notes: notes || (sessionUserId ? "Manually recorded by freelancer" : "Payment confirmed by client"),
      })
      .returning();

    // 2. Update invoice status to PAID
    await db
      .update(invoices)
      .set({
        status: "PAID",
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id));

    const { trackEvent } = await import("@/utils/tracker");
    await trackEvent({
      userId: finalUserId,
      eventType: "INVOICE_PAID",
      metadata: { invoiceId: invoice.id, paymentId: newPayment.id, amount: paymentAmount },
    });

    return NextResponse.json({ success: true, payment: newPayment }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/invoices/[id]/pay error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
