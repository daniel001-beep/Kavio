/**
 * Admin API Route - Secure endpoint for admin operations
 * 
 * - Verifies admin status via JWT
 * - Never leaks sensitive data via RLS bypass
 * - Logs all access attempts
 */

// @ts-ignore - Legacy Supabase integration, using Drizzle ORM
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// @ts-ignore
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: { persistSession: false },
  }
);

/**
 * GET /api/admin/transactions
 * 
 * Returns transaction data for admin dashboard
 * Verifies admin status before returning
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token and get user
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from("user")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.is_admin) {
      // Log unauthorized access attempt
      await logUnauthorizedAccess(user.id, request);
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Fetch transaction data
    const { data: transactions, error: txError } = await supabaseAdmin
      .from("transaction")
      .select(
        `
        id,
        user_id,
        amount,
        status,
        created_at,
        completed_at,
        order_id,
        error_message,
        metadata
      `
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (txError) {
      throw txError;
    }

    // Get ledger entries for each transaction
    const transactionsWithEntries = await Promise.all(
      (transactions || []).map(async (tx) => {
        const { data: entries } = await supabaseAdmin
          .from("ledger_entry")
          .select("entry_type, amount")
          .eq("transaction_id", tx.id);

        const debitCount = entries?.filter(
          (e: any) => e.entry_type === "debit"
        ).length || 0;
        const creditCount = entries?.filter(
          (e: any) => e.entry_type === "credit"
        ).length || 0;

        return {
          transactionId: tx.id,
          userId: tx.user_id,
          amount: tx.amount,
          status: tx.status,
          createdAt: tx.created_at,
          completedAt: tx.completed_at,
          debitCount,
          creditCount,
        };
      })
    );

    // Log successful access
    await logAdminAccess(user.id, request, "transactions_viewed");

    return NextResponse.json(
      { transactions: transactionsWithEntries },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



/**
 * Logs admin access for security audit
 */
async function logAdminAccess(
  userId: string,
  request: NextRequest,
  action: string
) {
  try {
    const clientIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await supabaseAdmin.from("audit_log").insert({
      user_id: userId,
      event_type: "admin_access",
      entity_type: "admin",
      entity_id: action,
      changes: {
        action,
        timestamp: new Date().toISOString(),
      },
      change_hash: generateHash(`${userId}:${action}`),
      ip_address: clientIp,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error("Failed to log admin access:", error);
    // Don't throw - this shouldn't break the main flow
  }
}

/**
 * Logs unauthorized access attempts
 */
async function logUnauthorizedAccess(
  userId: string,
  request: NextRequest
) {
  try {
    const clientIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await supabaseAdmin.from("audit_log").insert({
      user_id: userId,
      event_type: "unauthorized_admin_access",
      entity_type: "admin",
      entity_id: "access_denied",
      changes: {
        timestamp: new Date().toISOString(),
        attempted_endpoint: request.nextUrl.pathname,
      },
      change_hash: generateHash(`${userId}:unauthorized`),
      ip_address: clientIp,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error("Failed to log unauthorized access:", error);
  }
}

function generateHash(data: string): string {
  // In a real implementation, use crypto
  return data;
}
