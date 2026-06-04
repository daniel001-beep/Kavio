import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { clientTags } from "@/src/db/schema";
import { getResilientSession } from "@/src/lib/auth-session";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

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

    const { tag } = await req.json();
    if (!tag) {
      return NextResponse.json({ error: "Tag string is required" }, { status: 400 });
    }

    // Check if tag already exists for this client to prevent duplicates
    const existing = await db
      .select()
      .from(clientTags)
      .where(and(eq(clientTags.clientId, clientId), eq(clientTags.tag, tag)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(existing[0], { status: 200 });
    }

    const [newTag] = await db
      .insert(clientTags)
      .values({
        clientId,
        tag
      })
      .returning();

    return NextResponse.json(newTag, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await props.params;
    const session = await getResilientSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag");

    if (!tag) {
      return NextResponse.json({ error: "Tag parameter is required" }, { status: 400 });
    }

    await db
      .delete(clientTags)
      .where(and(eq(clientTags.clientId, clientId), eq(clientTags.tag, tag)));

    return NextResponse.json({ success: true, message: "Tag removed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
