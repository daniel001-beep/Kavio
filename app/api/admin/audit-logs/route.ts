import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { auditLogs } from "@/src/db/schema";
import { sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    // Admin gate validation
    if (!session || !session.user || !session.user.isAdmin) {
      return NextResponse.json({ error: "Access Denied: Admin role required" }, { status: 403 });
    }

    // Retrieve latest 50 audit logs
    const logs = await db
      .select()
      .from(auditLogs)
      .orderBy(sql`${auditLogs.timestamp} DESC`)
      .limit(50);

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("Failed to query audit logs:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve logs" }, { status: 500 });
  }
}
