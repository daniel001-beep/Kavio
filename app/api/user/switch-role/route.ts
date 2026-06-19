import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetRole } = await req.json();

    if (targetRole !== "freelancer" && targetRole !== "employer") {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    // Ensure the user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify admin access
    const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "admin@kavio.co").toLowerCase().trim();
    if (user.email.toLowerCase().trim() !== adminEmail) {
      return NextResponse.json({ error: "Forbidden: Only admins can switch account roles." }, { status: 403 });
    }

    // Update the role
    await db.update(users)
      .set({ role: targetRole })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true, role: targetRole });
  } catch (error: any) {
    console.error("Failed to switch role:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
