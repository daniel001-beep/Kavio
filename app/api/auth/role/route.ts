import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress || '';

    const body = await req.json();
    const { role } = body;

    if (role !== "freelancer" && role !== "employer") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    await db.insert(users)
      .values({
        id: userId,
        email: email,
        name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : email.split('@')[0],
        role: role,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: { role: role }
      });

    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error("Failed to update role:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
