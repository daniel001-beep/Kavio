import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { reminders, invoices, clients } from "@/src/db/schema";
import { getResilientSession } from "@/src/lib/auth-session";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getResilientSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reminderLogs = await db
      .select({
        id: reminders.id,
        templateType: reminders.templateType,
        channel: reminders.channel,
        sentDate: reminders.sentDate,
        reminderCount: reminders.reminderCount,
        status: reminders.status,
        invoice: {
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          amount: invoices.amount,
          dueDate: invoices.dueDate,
        },
        client: {
          id: clients.id,
          name: clients.name,
        },
      })
      .from(reminders)
      .innerJoin(invoices, eq(reminders.invoiceId, invoices.id))
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.userId, userId))
      .orderBy(desc(reminders.sentDate));

    return NextResponse.json(reminderLogs, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/reminders error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
