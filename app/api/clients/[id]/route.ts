import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { 
  clients, 
  invoices, 
  clientNotes, 
  clientTags, 
  clientActivities, 
  clientScores, 
  clientRelationships, 
  payments 
} from "@/src/db/schema";
import { getResilientSession } from "@/src/lib/auth-session";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await props.params;
    const session = await getResilientSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // We implement a retry block to handle Vercel serverless idle connection drops
    let clientRecord = [];
    let clientInvoices = [];
    let notes = [];
    let tags = [];
    let activities = [];
    let relationship = [];

    let retries = 2;
    while (retries > 0) {
      try {
        // 1. Fetch client record first to ensure they exist
        clientRecord = await db
          .select()
          .from(clients)
          .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
          .limit(1);

        if (clientRecord.length === 0) {
          return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        // Fetch everything else in parallel to prevent connection timeouts and speed up response
        [clientInvoices, notes, tags, activities, relationship] = await Promise.all([
          db.select().from(invoices).where(eq(invoices.clientId, clientId)).orderBy(desc(invoices.createdAt)),
          db.select().from(clientNotes).where(eq(clientNotes.clientId, clientId)).orderBy(desc(clientNotes.createdAt)),
          db.select().from(clientTags).where(eq(clientTags.clientId, clientId)).orderBy(desc(clientTags.createdAt)),
          db.select().from(clientActivities).where(eq(clientActivities.clientId, clientId)).orderBy(desc(clientActivities.createdAt)),
          db.select().from(clientRelationships).where(eq(clientRelationships.clientId, clientId)).limit(1)
        ]);

        // If we get here, queries succeeded
        break;
      } catch (err: any) {
        retries--;
        if (retries === 0) throw err;
        // Wait 200ms before retry
        await new Promise(r => setTimeout(r, 200));
      }
    }

    // ==========================================
    // Calculate Financial and Behavior Analytics
    const client = clientRecord[0];

    // ==========================================
    const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    
    const paidInvoices = clientInvoices.filter(inv => inv.status === "PAID");
    const openInvoices = clientInvoices.filter(inv => ["SENT", "VIEWED"].includes(inv.status));
    const overdueInvoices = clientInvoices.filter(inv => inv.status === "OVERDUE");

    const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const outstandingAmount = openInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // Calculate Payment Speed (Average Payment Time in days)
    let avgPaymentTime = 0;
    if (paidInvoices.length > 0) {
      // Find matching payment timestamps
      const invoiceIds = paidInvoices.map(i => i.id);
      const paidRecords = await db
        .select()
        .from(payments)
        .where(eq(payments.userId, userId));
      
      let totalDays = 0;
      let count = 0;
      paidInvoices.forEach(inv => {
        const matchingPay = paidRecords.find(p => p.invoiceId === inv.id);
        if (matchingPay && matchingPay.datePaid && inv.createdAt) {
          const delayMs = new Date(matchingPay.datePaid).getTime() - new Date(inv.createdAt).getTime();
          const delayDays = Math.max(0, delayMs / (1000 * 60 * 60 * 24));
          totalDays += delayDays;
          count++;
        }
      });
      avgPaymentTime = count > 0 ? Math.round(totalDays / count) : 0;
    }

    // Calculate Reliability Score & Rating (Excellent, Good, Warning, Critical)
    // 🟢 Reliable: Avg delay <= 3 days, no overdue invoices
    // 🟡 Moderate Risk: Avg delay 4-10 days, or <= 1 overdue invoice
    // 🔴 High Risk: Avg delay > 10 days, or multiple overdue invoices
    let reliabilityStatus = "Reliable";
    let healthScore = 100;

    if (overdueInvoices.length > 1 || avgPaymentTime > 10) {
      reliabilityStatus = "High Risk";
      healthScore = Math.max(0, 100 - (overdueInvoices.length * 15) - (avgPaymentTime * 2.5));
    } else if (overdueInvoices.length === 1 || avgPaymentTime > 3) {
      reliabilityStatus = "Moderate Risk";
      healthScore = Math.max(0, 100 - (overdueInvoices.length * 15) - (avgPaymentTime * 2.5));
    } else {
      reliabilityStatus = "Reliable";
      healthScore = Math.max(0, 100 - (avgPaymentTime * 1.5));
    }

    let healthStatus = "Excellent";
    if (healthScore >= 80) healthStatus = "Excellent";
    else if (healthScore >= 60) healthStatus = "Good";
    else if (healthScore >= 40) healthStatus = "Warning";
    else healthStatus = "Critical";

    return NextResponse.json({
      client,
      financials: {
        totalInvoiced,
        totalPaid,
        outstandingAmount,
        overdueAmount
      },
      behavior: {
        avgPaymentTime,
        paidInvoicesCount: paidInvoices.length,
        openInvoicesCount: openInvoices.length,
        overdueInvoicesCount: overdueInvoices.length,
        reliabilityStatus,
        healthScore,
        healthStatus
      },
      notes,
      tags,
      activities,
      relationship: relationship[0] || null
    }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/clients/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await props.params;
    const session = await getResilientSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, companyName, email, phone, location, industry, notes } = body;

    const [updatedClient] = await db
      .update(clients)
      .set({
        name,
        companyName: companyName || null,
        email,
        phone,
        location: location || null,
        industry: industry || null,
        notes: notes || null
      })
      .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
      .returning();

    // Log Activity
    await db.insert(clientActivities).values({
      clientId,
      eventType: "CLIENT_UPDATED",
      description: `Client profile details updated.`
    });

    return NextResponse.json(updatedClient, { status: 200 });
  } catch (error: any) {
    console.error("PUT /api/clients/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await props.params;
    const session = await getResilientSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await db
      .delete(clients)
      .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Client not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Client purged successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE /api/clients/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
