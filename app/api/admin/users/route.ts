import { db } from "@/src/db";
import { users, invoices, clients, payments, userActivityLogs, loginLogs, featureUsageEvents } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getResilientSession } from "@/src/lib/auth-session";

async function verifyAdmin() {
  const session = await getResilientSession();
  return !!session?.user?.isAdmin;
}

export async function PUT(req: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId, action } = await req.json();
    if (!userId || !action) {
      return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
    }

    if (action === "suspend") {
      await db.update(users).set({ status: "SUSPENDED" }).where(eq(users.id, userId));
      return NextResponse.json({ success: true, message: "User suspended successfully" });
    } else if (action === "reactivate") {
      await db.update(users).set({ status: "ACTIVE" }).where(eq(users.id, userId));
      return NextResponse.json({ success: true, message: "User reactivated successfully" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("PUT /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userIdToDelete = searchParams.get("id");

    if (!userIdToDelete) {
      return NextResponse.json({ error: "Missing User ID parameter" }, { status: 400 });
    }

    // Cascade delete user data
    await db.delete(payments).where(eq(payments.userId, userIdToDelete));
    await db.delete(invoices).where(eq(invoices.userId, userIdToDelete));
    await db.delete(clients).where(eq(clients.userId, userIdToDelete));
    await db.delete(userActivityLogs).where(eq(userActivityLogs.userId, userIdToDelete));
    await db.delete(loginLogs).where(eq(loginLogs.userId, userIdToDelete));
    await db.delete(featureUsageEvents).where(eq(featureUsageEvents.userId, userIdToDelete));
    await db.delete(users).where(eq(users.id, userIdToDelete));

    return NextResponse.json({ success: true, message: "User purged successfully" });
  } catch (error: any) {
    console.error("DELETE /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
