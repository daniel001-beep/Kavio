import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { invoices, reminders } from "@/src/db/schema";
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
    const { templateType, channel } = body;

    if (!templateType) {
      return NextResponse.json({ error: "Template type is required." }, { status: 400 });
    }

    // Verify invoice exists and belongs to active user
    const invoiceRecord = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .limit(1);

    if (invoiceRecord.length === 0) {
      return NextResponse.json({ error: "Invoice not found or unauthorized" }, { status: 404 });
    }

    // Insert reminder log
    const [newReminder] = await db
      .insert(reminders)
      .values({
        invoiceId: id,
        templateType,
        channel: channel || "WHATSAPP",
        sentDate: new Date(),
        reminderCount: 1,
        status: "SENT",
      })
      .returning();

    return NextResponse.json({ success: true, reminder: newReminder }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/invoices/[id]/remind error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
