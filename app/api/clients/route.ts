import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { clients } from "@/src/db/schema";
import { getResilientSession } from "@/src/lib/auth-session";
import { eq, desc } from "drizzle-orm";
import { trackEvent } from "@/utils/tracker";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getResilientSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientRecords = await db
      .select()
      .from(clients)
      .where(eq(clients.userId, userId))
      .orderBy(desc(clients.createdAt));

    return NextResponse.json(clientRecords, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/clients error:", error);
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
    const { name, email, phone, companyName, location, industry, notes } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Name, email, and phone number are required." },
        { status: 400 }
      );
    }

    const [newClient] = await db
      .insert(clients)
      .values({
        userId,
        name,
        email,
        phone,
        companyName: companyName || null,
        location: location || null,
        industry: industry || null,
        notes: notes || null,
      })
      .returning();

    // Log Client Activity
    const { clientActivities, clientRelationships } = await import("@/src/db/schema");
    await db.insert(clientActivities).values({
      clientId: newClient.id,
      eventType: "CLIENT_CREATED",
      description: `Client record created for ${name}.`
    });

    // Create default relationship
    await db.insert(clientRelationships).values({
      clientId: newClient.id,
      preferredMethod: "EMAIL"
    });

    await trackEvent({
      userId,
      eventType: "CLIENT_CREATED",
      metadata: { clientId: newClient.id, name, email },
    });

    return NextResponse.json(newClient, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/clients error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
