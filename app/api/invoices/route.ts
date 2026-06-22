import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { invoices, clients } from "@/src/db/schema";
import { getResilientSession } from "@/src/lib/auth-session";
import { eq, desc } from "drizzle-orm";
import { trackEvent } from "@/utils/tracker";
import { getCached, setCached, deleteCached } from "@/src/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getResilientSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cacheKey = `invoices_${userId}`;
    const cachedData = await getCached(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, { status: 200, headers: { 'X-Cache': 'HIT' } });
    }

    const invoiceRecords = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        amount: invoices.amount,
        dueDate: invoices.dueDate,
        status: invoices.status,
        projectDescription: invoices.projectDescription,
        paymentInstructions: invoices.paymentInstructions,
        createdAt: invoices.createdAt,
        client: {
          id: clients.id,
          name: clients.name,
          email: clients.email,
          phone: clients.phone,
          companyName: clients.companyName,
          location: clients.location
        }
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt));

    // Cache the result for 60 seconds asynchronously
    setCached(cacheKey, invoiceRecords, 60);

    return NextResponse.json(invoiceRecords, { status: 200, headers: { 'X-Cache': 'MISS' } });
  } catch (error: any) {
    console.error("GET /api/invoices error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getResilientSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { clientId, invoiceNumber, amount, dueDate, projectDescription, paymentInstructions } = body;

    if (!clientId || !invoiceNumber || !amount || !dueDate || !projectDescription) {
      return NextResponse.json(
        { error: "Client, invoice number, amount, due date, and project description are required." },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a valid positive number." },
        { status: 400 }
      );
    }

    const [newInvoice] = await db
      .insert(invoices)
      .values({
        userId,
        clientId,
        invoiceNumber,
        projectDescription,
        amount: parsedAmount,
        dueDate: new Date(dueDate),
        status: "SENT",
        paymentInstructions: paymentInstructions || null,
      })
      .returning();

    // Track creation
    await trackEvent({
      userId,
      eventType: "INVOICE_CREATED",
      metadata: { invoiceId: newInvoice.id, invoiceNumber, amount: parsedAmount },
    });

    // Invalidate the cache
    await deleteCached(`invoices_${userId}`);

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/invoices error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
