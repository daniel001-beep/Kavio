import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { invoices } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    // We only update if the current status is SENT
    // This is a public route, so we restrict it to just updating VIEWED status
    await db
      .update(invoices)
      .set({ 
        status: "VIEWED", 
        viewedAt: new Date() 
      })
      .where(and(eq(invoices.id, id), eq(invoices.status, "SENT")));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("POST /api/invoices/[id]/view error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
