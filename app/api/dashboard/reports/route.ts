import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { businesses } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { getProfitAndLoss } from "@/src/services/ledgerFacade";

async function getActiveBusinessId(userId: string) {
  const results = await db
    .select()
    .from(businesses)
    .where(eq(businesses.userId, userId))
    .limit(1);
  return results.length > 0 ? results[0].id : null;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized access blocked" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let businessId = searchParams.get("businessId");

    if (!businessId) {
      businessId = await getActiveBusinessId(session.user.id);
    }

    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const plReport = await getProfitAndLoss(session.user.id, businessId);
    return NextResponse.json(plReport);
  } catch (error: any) {
    console.error("Failed to load profit and loss analytics:", error);
    return NextResponse.json({ error: error.message || "Failed to load report analysis" }, { status: 500 });
  }
}
