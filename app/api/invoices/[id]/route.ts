import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { invoices, clients, users } from "@/src/db/schema";
import { getResilientSession } from "@/src/lib/auth-session";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET a single invoice (Public route for invoice checkout page)
export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const invoiceRecords = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        amount: invoices.amount,
        dueDate: invoices.dueDate,
        status: invoices.status,
        projectDescription: invoices.projectDescription,
        paymentInstructions: invoices.paymentInstructions,
        bankName: invoices.bankName,
        accountName: invoices.accountName,
        accountNumber: invoices.accountNumber,
        createdAt: invoices.createdAt,
        client: {
          id: clients.id,
          name: clients.name,
          email: clients.email,
          phone: clients.phone,
          companyName: clients.companyName
        },
        user: {
          name: users.name,
          email: users.email
        }
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .innerJoin(users, eq(invoices.userId, users.id))
      .where(eq(invoices.id, id))
      .limit(1);

    if (invoiceRecords.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoiceRecords[0], { status: 200 });
  } catch (error: any) {
    console.error("GET /api/invoices/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

// PUT (edit invoice details)
export async function PUT(
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
    const { amount, dueDate, projectDescription, status, paymentInstructions, bankName, accountName, accountNumber } = body;

    const invoiceToUpdate = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .limit(1);

    if (invoiceToUpdate.length === 0) {
      return NextResponse.json({ error: "Invoice not found or unauthorized" }, { status: 404 });
    }

    const updateValues: Partial<typeof invoices.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ error: "Invalid amount value." }, { status: 400 });
      }
      updateValues.amount = parsedAmount;
    }
    if (dueDate !== undefined) updateValues.dueDate = new Date(dueDate);
    if (projectDescription !== undefined) updateValues.projectDescription = projectDescription;
    if (status !== undefined) updateValues.status = status;
    if (paymentInstructions !== undefined) updateValues.paymentInstructions = paymentInstructions;
    if (bankName !== undefined) updateValues.bankName = bankName;
    if (accountName !== undefined) updateValues.accountName = accountName;
    if (accountNumber !== undefined) updateValues.accountNumber = accountNumber;

    const [updatedInvoice] = await db
      .update(invoices)
      .set(updateValues)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();

    const { trackEvent } = await import("@/utils/tracker");
    await trackEvent({
      userId,
      eventType: "INVOICE_UPDATED",
      metadata: { invoiceId: updatedInvoice.id, status: updatedInvoice.status, amount: updatedInvoice.amount },
    });

    return NextResponse.json(updatedInvoice, { status: 200 });
  } catch (error: any) {
    console.error("PUT /api/invoices/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE invoice
export async function DELETE(
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

    const deleted = await db
      .delete(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Invoice not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Invoice deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE /api/invoices/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
