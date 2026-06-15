import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { invoices } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allInvoices = await db.query.invoices.findMany();
    let updatedCount = 0;

    for (const invoice of allInvoices) {
      if (invoice.paymentInstructions && invoice.paymentInstructions.includes("When making payment, include")) {
        const newInstructions = invoice.paymentInstructions.replace(
          /\n*When making payment, include .*? in your transfer narration\/reference\./,
          ""
        );

        await db.update(invoices).set({ paymentInstructions: newInstructions }).where(eq(invoices.id, invoice.id));
        updatedCount++;
      }
    }

    return NextResponse.json({ success: true, updatedCount, message: `Removed narration from ${updatedCount} invoices.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
