import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { invoices, payments, receiptSubmissions, clients } from "@/src/db/schema";
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
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, submissionId, notes } = body; // action is "APPROVE", "REJECT", or "REQUEST_NEW"

    // Verify invoice exists and belongs to the freelancer
    const invoiceRecord = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .limit(1);

    if (invoiceRecord.length === 0) {
      return NextResponse.json({ error: "Invoice not found or unauthorized" }, { status: 404 });
    }

    const invoice = invoiceRecord[0];

    // Find the active receipt submission
    let submissionQuery = db
      .select()
      .from(receiptSubmissions)
      .where(eq(receiptSubmissions.invoiceId, id));

    if (submissionId) {
      submissionQuery = db
        .select()
        .from(receiptSubmissions)
        .where(eq(receiptSubmissions.id, submissionId));
    } else {
      // Default to the latest active submission
      submissionQuery = db
        .select()
        .from(receiptSubmissions)
        .where(and(eq(receiptSubmissions.invoiceId, id), eq(receiptSubmissions.status, "VERIFIED"))); // or UNDER_REVIEW
    }

    const submissions = await submissionQuery.limit(1);
    const submission = submissions[0];

    if (action === "APPROVE") {
      // 1. Insert payment record into payments table
      const [newPayment] = await db
        .insert(payments)
        .values({
          invoiceId: invoice.id,
          userId,
          amount: invoice.amount,
          datePaid: new Date(),
          reference: submission?.extractedRef || "AI-VERIFIED-APPROVED",
          notes: notes || `Approved by freelancer. AI Confidence: ${submission?.confidenceScore || "N/A"}%`,
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

      // 3. Update receipt submission status to APPROVED
      if (submission) {
        await db
          .update(receiptSubmissions)
          .set({
            status: "APPROVED",
            reason: notes || `Approved by freelancer. AI Confidence: ${submission.confidenceScore}%`,
            updatedAt: new Date(),
          })
          .where(eq(receiptSubmissions.id, submission.id));
      }

      // Track event
      const { trackEvent } = await import("@/utils/tracker");
      await trackEvent({
        userId,
        eventType: "INVOICE_PAID",
        metadata: { invoiceId: invoice.id, paymentId: newPayment.id, amount: invoice.amount, approvedViaQueue: true },
      });

      // Client Notification System:
      // "Your payment has been confirmed by [Business Name]. Invoice INV-XXX is now marked as Paid."
      const freelancerName = session?.user?.name || "the business owner";
      const notificationText = `Your payment has been confirmed by ${freelancerName}. Invoice ${invoice.invoiceNumber} is now marked as Paid.`;

      return NextResponse.json({ 
        success: true, 
        message: "Payment approved and invoice marked as PAID",
        notificationText 
      });

    } else if (action === "REJECT" || action === "REQUEST_NEW") {
      // 1. Reset invoice status back to SENT (or OVERDUE if past due)
      const now = new Date();
      const isPastDue = new Date(invoice.dueDate) < now;
      const newStatus = isPastDue ? "OVERDUE" : "SENT";

      await db
        .update(invoices)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, id));

      // 2. Update receipt submission status to REJECTED
      if (submission) {
        await db
          .update(receiptSubmissions)
          .set({
            status: "REJECTED",
            reason: notes || `Rejected by freelancer: ${action === "REQUEST_NEW" ? "Requesting a new receipt." : "Invalid proof of payment."}`,
            updatedAt: new Date(),
          })
          .where(eq(receiptSubmissions.id, submission.id));
      }

      // Track event
      const { trackEvent } = await import("@/utils/tracker");
      await trackEvent({
        userId,
        eventType: "RECEIPT_REJECTED",
        metadata: { invoiceId: invoice.id, action, submissionId: submission?.id },
      });

      return NextResponse.json({ 
        success: true, 
        message: `Payment receipt rejected. Status reset to ${newStatus}` 
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/invoices/[id]/confirm-payment error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
