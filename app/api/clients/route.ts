import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { clients } from "@/src/db/schema";
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
    const { name, email, phone, companyName, location } = body;

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
      })
      .returning();

    return NextResponse.json(newClient, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/clients error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
