import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { getResilientSession } from "@/src/lib/auth-session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getResilientSession();
    const email = session?.user?.email?.toLowerCase().trim();

    // Select all user IDs to count them
    const allUsers = await db.select({ id: users.id }).from(users);
    const totalUsers = allUsers.length;

    let isFreePromo = totalUsers <= 10;

    // Exclude idowuisdaniel1@gmail.com and demo@velox.com from the promo
    if (email === "idowuisdaniel1@gmail.com" || email === "demo@velox.com") {
      isFreePromo = false;
    }

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
      isFreePromo: false,
      tier: "FREE"
    });
  }
}
