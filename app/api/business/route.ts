import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { businesses, businessAccounts } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { createBusiness, getBusinessAccounts } from "@/src/services/ledgerFacade";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized access blocked" }, { status: 401 });
    }

    // Get user's businesses
    const bizs = await db
      .select()
      .from(businesses)
      .where(eq(businesses.userId, session.user.id));

    if (bizs.length === 0) {
      return NextResponse.json({ business: null, accounts: [] });
    }

    const business = bizs[0];
    const accounts = await getBusinessAccounts(business.id);

    return NextResponse.json({ business, accounts });
  } catch (error: any) {
    console.error("Failed to load business profile:", error);
    return NextResponse.json({ error: error.message || "Failed to load business" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized access blocked" }, { status: 401 });
    }

    const body = await request.json();
    const { name, industry, accounts } = body;

    if (!name) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }

    const accountsToSeed = accounts && accounts.length > 0 
      ? accounts 
      : ["Main Checking", "Business Savings", "Petty Cash"];

    const result = await createBusiness(
      session.user.id,
      name,
      industry || "General Agency",
      accountsToSeed
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Failed to onboard business profile:", error);
    return NextResponse.json({ error: error.message || "Failed to create business" }, { status: 500 });
  }
}
