import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { clientNotes, clientActivities } from "@/src/db/schema";
import { getResilientSession } from "@/src/lib/auth-session";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await props.params;
    const session = await getResilientSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await db
      .select()
      .from(clientNotes)
      .where(eq(clientNotes.clientId, clientId))
      .orderBy(desc(clientNotes.createdAt));

    return NextResponse.json(notes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await props.params;
    const session = await getResilientSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { note, category } = await req.json();
    if (!note) {
      return NextResponse.json({ error: "Note text is required" }, { status: 400 });
    }

    const [newNote] = await db
      .insert(clientNotes)
      .values({
        clientId,
        note,
        category: category || "MEETING"
      })
      .returning();

    // Log Activity
    await db.insert(clientActivities).values({
      clientId,
      eventType: "NOTE_ADDED",
      description: `Note added under category: ${category || "MEETING"}`
    });

    return NextResponse.json(newNote, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
