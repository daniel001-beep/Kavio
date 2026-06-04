import { db } from "@/src/db";
import { users, invoices, clients, payments, userActivityLogs } from "@/src/db/schema";
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

export async function GET(req: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    let csvContent = "";
    let filename = "";

    if (type === "users") {
      const data = await db.select().from(users);
      filename = "kavio_users_export.csv";
      csvContent = "User ID,Name,Email,Plan Type,Status,Created At,Last Login,Last Activity\n";
      data.forEach(u => {
        csvContent += `"${u.id}","${u.name || ''}","${u.email}","${u.planType || 'FREE'}","${u.status || 'ACTIVE'}","${u.createdAt ? u.createdAt.toISOString() : ''}","${u.lastLogin ? u.lastLogin.toISOString() : ''}","${u.lastActivity ? u.lastActivity.toISOString() : ''}"\n`;
      });
    } else if (type === "invoices") {
      const data = await db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          amount: invoices.amount,
          status: invoices.status,
          dueDate: invoices.dueDate,
          createdAt: invoices.createdAt,
          userEmail: users.email,
          clientName: clients.name
        })
        .from(invoices)
        .innerJoin(users, eq(invoices.userId, users.id))
        .innerJoin(clients, eq(invoices.clientId, clients.id));

      filename = "kavio_invoices_export.csv";
      csvContent = "Invoice ID,Invoice Number,Amount,Status,Due Date,Created At,User Email,Client Name\n";
      data.forEach(i => {
        csvContent += `"${i.id}","${i.invoiceNumber}",${i.amount},"${i.status}","${i.dueDate.toISOString()}","${i.createdAt ? i.createdAt.toISOString() : ''}","${i.userEmail}","${i.clientName}"\n`;
      });
    } else if (type === "revenue") {
      const data = await db
        .select({
          id: payments.id,
          amount: payments.amount,
          datePaid: payments.datePaid,
          reference: payments.reference,
          notes: payments.notes,
          userEmail: users.email,
          invoiceNumber: invoices.invoiceNumber
        })
        .from(payments)
        .innerJoin(users, eq(payments.userId, users.id))
        .innerJoin(invoices, eq(payments.invoiceId, invoices.id));

      filename = "kavio_revenue_export.csv";
      csvContent = "Payment ID,Amount,Date Paid,Reference,Notes,User Email,Invoice Number\n";
      data.forEach(p => {
        csvContent += `"${p.id}",${p.amount},"${p.datePaid ? p.datePaid.toISOString() : ''}","${p.reference || ''}","${p.notes || ''}","${p.userEmail}","${p.invoiceNumber}"\n`;
      });
    } else if (type === "activity") {
      const data = await db
        .select({
          id: userActivityLogs.id,
          eventType: userActivityLogs.eventType,
          metadata: userActivityLogs.metadata,
          timestamp: userActivityLogs.timestamp,
          userEmail: users.email
        })
        .from(userActivityLogs)
        .innerJoin(users, eq(userActivityLogs.userId, users.id))
        .orderBy(desc(userActivityLogs.timestamp));

      filename = "kavio_activity_export.csv";
      csvContent = "Log ID,User Email,Event Type,Timestamp,Metadata\n";
      data.forEach(log => {
        const metadataStr = JSON.stringify(log.metadata).replace(/"/g, '""');
        csvContent += `"${log.id}","${log.userEmail}","${log.eventType}","${log.timestamp ? log.timestamp.toISOString() : ''}","${metadataStr}"\n`;
      });
    } else {
      return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error: any) {
    console.error("GET /api/admin/export error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
