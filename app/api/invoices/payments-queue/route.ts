import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { invoices, receiptSubmissions, clients } from "@/src/db/schema";
import { getResilientSession } from "@/src/lib/auth-session";
import { eq, and, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getResilientSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Query receipt submissions belonging to this freelancer's invoices
    const queueItems = await db
      .select({
        id: receiptSubmissions.id,
        status: receiptSubmissions.status,
        confidenceScore: receiptSubmissions.confidenceScore,
        fraudFlags: receiptSubmissions.fraudFlags,
        receiptImageBase64: receiptSubmissions.receiptImageBase64,
        extractedAmount: receiptSubmissions.extractedAmount,
        extractedDate: receiptSubmissions.extractedDate,
        extractedRef: receiptSubmissions.extractedRef,
        reason: receiptSubmissions.reason,
        createdAt: receiptSubmissions.createdAt,
        senderName: receiptSubmissions.senderName,
        receiverName: receiptSubmissions.receiverName,
        transactionTime: receiptSubmissions.transactionTime,
        narration: receiptSubmissions.narration,
        bankName: receiptSubmissions.bankName,
        sessionId: receiptSubmissions.sessionId,
        senderAccountLast4: receiptSubmissions.senderAccountLast4,
        submittedRef: receiptSubmissions.submittedRef,
        invoice: {
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          amount: invoices.amount,
          projectDescription: invoices.projectDescription,
        },
        client: {
          id: clients.id,
          name: clients.name,
          email: clients.email,
        }
      })
      .from(receiptSubmissions)
      .innerJoin(invoices, eq(receiptSubmissions.invoiceId, invoices.id))
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .where(
        and(
          eq(receiptSubmissions.userId, userId),
          sql`${receiptSubmissions.status} IN ('VERIFIED', 'UNDER_REVIEW', 'FAILED')`
        )
      )
      .orderBy(desc(receiptSubmissions.createdAt));

    // 2. Fetch all submissions to compute stats metrics
    const allSubmissions = await db
      .select()
      .from(receiptSubmissions)
      .where(eq(receiptSubmissions.userId, userId));

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let pendingVerification = 0;
    let awaitingApproval = 0;
    let verifiedToday = 0;
    let rejectedReceipts = 0;
    let fraudAlerts = 0;

    allSubmissions.forEach(sub => {
      // Pending Verification (AI under review)
      if (sub.status === "UNDER_REVIEW") {
        pendingVerification++;
      }
      // Awaiting Approval (AI verified)
      if (sub.status === "VERIFIED") {
        awaitingApproval++;
      }
      // Verified Today (Approved today)
      if (sub.status === "APPROVED" && sub.updatedAt && new Date(sub.updatedAt) >= startOfToday) {
        verifiedToday++;
      }
      // Rejected Receipts (Rejected this month)
      if (sub.status === "REJECTED" && sub.updatedAt && new Date(sub.updatedAt) >= startOfMonth) {
        rejectedReceipts++;
      }
      // Fraud Alerts (Submissions containing active fraud alerts flags)
      const flags = sub.fraudFlags as string[] | null;
      if (flags && Array.isArray(flags) && flags.length > 0) {
        fraudAlerts++;
      }
    });

    return NextResponse.json({
      queueItems,
      metrics: {
        pendingVerification,
        awaitingApproval,
        verifiedToday,
        rejectedReceipts,
        fraudAlerts
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("GET /api/invoices/payments-queue error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
