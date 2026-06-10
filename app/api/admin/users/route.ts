import { db } from "@/src/db";
import { users, invoices, clients, payments, userActivityLogs, loginLogs, featureUsageEvents } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase-server";

export const dynamic = "force-dynamic";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const localUserCookie = cookieStore.get('velox-local-user')?.value;
  let userEmail = '';

  if (localUserCookie) {
    try {
      let val = decodeURIComponent(localUserCookie).trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      const localUser = JSON.parse(val);
      userEmail = localUser.email;
    } catch {}
  }

  if (!userEmail) {
    const supabase = await createClient();
    const { data: { user } } = await supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (user) {
      userEmail = user.email || '';
    }
  }

  if (!userEmail) return false;

  const adminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase().trim();
  const isSuperAdmin = userEmail.toLowerCase().trim() === adminEmail;

  if (isSuperAdmin) return true;

  const dbUser = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
  return !!dbUser[0]?.isAdmin;
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
