import { createClient } from "@/src/lib/supabase-server";
import { db } from "@/src/db";
import { users, transactions, ledgerEntries } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const localUserCookie = cookieStore.get('velox-local-user')?.value;
  let userId = '';
  let userEmail = '';

  if (localUserCookie) {
    try {
      let val = decodeURIComponent(localUserCookie).trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      if (val.includes('%')) {
        val = decodeURIComponent(val);
      }
      let localUser = JSON.parse(val);
      if (typeof localUser === 'string') {
        localUser = JSON.parse(localUser);
      }
      userId = localUser.id;
      userEmail = localUser.email;
    } catch (e) {
      try {
        let val = localUserCookie.trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        let localUser = JSON.parse(val);
        if (typeof localUser === 'string') {
          localUser = JSON.parse(localUser);
        }
        userId = localUser.id;
        userEmail = localUser.email;
      } catch (innerErr) {}
    }
  }

  if (!userId) {
    const supabase = await createClient();
    const { data: { user: cloudUser } } = await supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (cloudUser) {
      userId = cloudUser.id;
      userEmail = cloudUser.email || '';
    }
  }

  if (!userId) return null;
  return { id: userId, email: userEmail };
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - not authenticated" },
        { status: 401 }
      );
    }

    // Fetch current user and verify isAdmin
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.email, user.email))
      .limit(1);

    const adminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "idowuisdaniel1@gmail.com").toLowerCase().trim();
    const isSuperAdmin = user.email.toLowerCase().trim() === adminEmail || user.email.toLowerCase().trim() === "admin@velox.com";

    if (!currentUser[0]?.isAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - not an admin" },
        { status: 403 }
      );
    }

    // 1. Fetch all registered users (platform-wide visibility for admin console)
    let allUsers = [];
    try {
      allUsers = await db.select().from(users);
    } catch (usersErr) {
      console.error("Error fetching users for admin:", usersErr);
    }

    // 2. Fetch all system transactions with associated user details
    let allTransactions = [];
    try {
      allTransactions = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          status: transactions.status,
          createdAt: transactions.createdAt,
          metadata: transactions.metadata,
          userId: transactions.userId,
          userName: users.name,
          userEmail: users.email,
        })
        .from(transactions)
        .leftJoin(users, eq(transactions.userId, users.id))
        .orderBy(desc(transactions.createdAt));
    } catch (txErr) {
      console.error("Error fetching transactions for admin:", txErr);
    }

    // 3. Fetch all system audit logs with associated user details
    let allAuditLogs: any[] = [];
    try {
      const { auditLogs } = await import("@/src/db/schema");
      allAuditLogs = await db
        .select({
          id: auditLogs.id,
          userId: auditLogs.userId,
          eventType: auditLogs.eventType,
          ipAddress: auditLogs.ipAddress,
          userAgent: auditLogs.userAgent,
          timestamp: auditLogs.timestamp,
          metadata: auditLogs.metadata,
          userName: users.name,
          userEmail: users.email,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .orderBy(desc(auditLogs.timestamp))
        .limit(100);
    } catch (auditErr) {
      console.error("Error fetching audit logs for admin:", auditErr);
    }

    // Safely serialize BigInt values to JSON-friendly structures
    const serializedTransactions = JSON.parse(
      JSON.stringify(allTransactions, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    return NextResponse.json({
      users: allUsers,
      transactions: serializedTransactions,
      auditLogs: allAuditLogs,
      totalUsers: allUsers.length,
      totalTransactions: allTransactions.length,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - not authenticated" },
        { status: 401 }
      );
    }

    // Verify current user is admin
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.email, user.email))
      .limit(1);

    const adminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "idowuisdaniel1@gmail.com").toLowerCase().trim();
    const isSuperAdmin = user.email.toLowerCase().trim() === adminEmail || user.email.toLowerCase().trim() === "admin@velox.com";

    if (!currentUser[0]?.isAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - not an admin" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userIdToDelete = searchParams.get("id");

    if (!userIdToDelete) {
      return NextResponse.json({ error: "Missing User ID parameter" }, { status: 400 });
    }

    // Block deleting your own account
    if (userIdToDelete === currentUser[0].id) {
      return NextResponse.json({ error: "Cannot delete your own active admin account!" }, { status: 400 });
    }

    // Cascade deletion: Delete dependent ledger records and transactions first to protect constraint schemas
    await db.delete(ledgerEntries).where(eq(ledgerEntries.userId, userIdToDelete));
    await db.delete(transactions).where(eq(transactions.userId, userIdToDelete));
    await db.delete(users).where(eq(users.id, userIdToDelete));

    return NextResponse.json({ success: true, message: "User deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Admin delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
