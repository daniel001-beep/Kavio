import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { clientRelationships, clientActivities } from "@/src/db/schema";
import { getResilientSession } from "@/src/lib/auth-session";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await props.params;
    const session = await getResilientSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { preferredMethod, lastContactDate, nextFollowUpDate, notes } = await req.json();

    // Try finding existing relationship record
    const existing = await db
      .select()
      .from(clientRelationships)
      .where(eq(clientRelationships.clientId, clientId))
      .limit(1);

    const updateObj: Record<string, any> = {};
    if (preferredMethod) updateObj.preferredMethod = preferredMethod;
    if (lastContactDate) updateObj.lastContactDate = new Date(lastContactDate);
    if (nextFollowUpDate) updateObj.nextFollowUpDate = new Date(nextFollowUpDate);
    if (notes !== undefined) updateObj.notes = notes;

    let result;
    if (existing.length > 0) {
      const results = await db
        .update(clientRelationships)
        .set(updateObj)
        .where(eq(clientRelationships.clientId, clientId))
        .returning();
      result = results[0];
    } else {
      const results = await db
        .insert(clientRelationships)
        .values({
          clientId,
          preferredMethod: preferredMethod || "EMAIL",
          lastContactDate: lastContactDate ? new Date(lastContactDate) : null,
          nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
          notes: notes || null
        })
        .returning();
      result = results[0];
    }

    // Log Activity
    await db.insert(clientActivities).values({
      clientId,
      eventType: "CRM_UPDATED",
      description: `CRM relationship parameters updated. Preferred communication: ${preferredMethod || "EMAIL"}`
    });

    return NextResponse.json({ success: true, relationship: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
