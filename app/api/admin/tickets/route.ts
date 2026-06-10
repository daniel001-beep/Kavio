import { db } from "@/src/db";
import { supportTickets, users } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
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

export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const tickets = await db
      .select({
        id: supportTickets.id,
        title: supportTickets.title,
        description: supportTickets.description,
        category: supportTickets.category,
        priority: supportTickets.priority,
        status: supportTickets.status,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(supportTickets)
      .innerJoin(users, eq(supportTickets.userId, users.id))
      .orderBy(desc(supportTickets.createdAt));

    return NextResponse.json(tickets);
  } catch (error: any) {
    console.error("GET /api/admin/tickets error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { ticketId, status, priority } = await req.json();
    if (!ticketId) {
      return NextResponse.json({ error: "Missing ticketId" }, { status: 400 });
    }

    const updateValues: Record<string, any> = {
      updatedAt: new Date()
    };

    if (status) updateValues.status = status;
    if (priority) updateValues.priority = priority;

    const [updated] = await db
      .update(supportTickets)
      .set(updateValues)
      .where(eq(supportTickets.id, ticketId))
      .returning();

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error: any) {
    console.error("PUT /api/admin/tickets error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

// User-facing route to submit support tickets
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const localUserCookie = cookieStore.get('velox-local-user')?.value;
    let userId = '';

    if (localUserCookie) {
      try {
        let val = decodeURIComponent(localUserCookie).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        const localUser = JSON.parse(val);
        userId = localUser.id;
      } catch {}
    }

    if (!userId) {
      const supabase = await createClient();
      const { data: { user } } = await supabase ? await supabase.auth.getUser() : { data: { user: null } };
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, category, priority } = await req.json();

    if (!title || !description || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [newTicket] = await db
      .insert(supportTickets)
      .values({
        userId,
        title,
        description,
        category,
        priority: priority || "MEDIUM",
        status: "OPEN"
      })
      .returning();

    // Trigger admin notification
    const { adminNotifications } = await import("@/src/db/schema");
    await db.insert(adminNotifications).values({
      title: "New Support Request",
      message: `User submitted a support ticket: "${title}" (Category: ${category})`,
      category: "SUPPORT_REQUEST"
    });

    return NextResponse.json(newTicket, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/tickets error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
