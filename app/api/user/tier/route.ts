import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Select all user IDs to count them
    const allUsers = await db.select({ id: users.id }).from(users);
    const totalUsers = allUsers.length;
    const isFreePromo = totalUsers <= 10;

    return NextResponse.json({
      totalUsers,
      isFreePromo,
      tier: isFreePromo ? "PRO" : "FREE"
    });
  } catch (error: any) {
    console.error("GET /api/user/tier error:", error);
    // Safe fallback if database is loading or offline
    return NextResponse.json({
      totalUsers: 1,
      isFreePromo: true,
      tier: "PRO"
    });
  }
}
