/**
 * Admin Audit Logs API Route
 * GET /api/admin/audit-logs
 * 
 * Returns audit logs for admin dashboard
 */

// @ts-ignore - Legacy Supabase integration, using Drizzle ORM
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cleanUrl = url?.replace(/['"]/g, "").trim();
  if (cleanUrl && (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://"))) {
    try {
      new URL(cleanUrl);
      if (!cleanUrl.includes("YOUR_SUPABASE_URL") && !cleanUrl.includes("placeholder")) {
        return cleanUrl;
      }
    } catch {}
  }
  return "https://placeholder.supabase.co";
};

const getSupabaseKey = () => {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";
};

let supabaseAdminInstance: any = null;

const getSupabaseAdmin = () => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(
      getSupabaseUrl(),
      getSupabaseKey(),
      {
        auth: { persistSession: false },
      }
    );
  }
  return supabaseAdminInstance;
};

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const client = getSupabaseAdmin();

    // Get user from token
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Verify admin status
    const { data: userData, error: userError } = await client
      .from("user")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.is_admin) {
      await logUnauthorizedAccess(user.id, request, "audit_logs");
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const eventType = searchParams.get("event_type");

    // Fetch audit logs
    let query = client
      .from("audit_log")
      .select("*", { count: "exact" })
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventType && eventType !== "all") {
      query = query.eq("event_type", eventType);
    }

    const { data: logs, count, error: logsError } = await query;

    if (logsError) {
      throw logsError;
    }

    // Get event type counts for filtering
    const { data: eventCounts } = await client
      .from("audit_log")
      .select("event_type", { count: "exact" });

    const countsByType: Record<string, number> = {};
    (eventCounts || []).forEach((log: any) => {
      countsByType[log.event_type] =
        (countsByType[log.event_type] || 0) + 1;
    });

    // Log successful access
    await logAdminAccess(user.id, request, "audit_logs_viewed");

    return NextResponse.json(
      {
        logs: logs || [],
        total: count || 0,
        limit,
        offset,
        eventTypeCounts: countsByType,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Audit logs API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/audit-logs
 * Create audit logs manually (internal use, not for client)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, eventType, entityType, entityId, changes } = body;

    const clientIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const client = getSupabaseAdmin();

    const { data, error } = await client.rpc("create_audit_log", {
      p_user_id: userId,
      p_event_type: eventType,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_changes: changes,
      p_ip_address: clientIp,
      p_user_agent: userAgent,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ id: data }, { status: 201 });
  } catch (error) {
    console.error("Create audit log error:", error);
    return NextResponse.json(
      { error: "Failed to create audit log" },
      { status: 500 }
    );
  }
}

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

    const client = getSupabaseAdmin();

    await client.from("audit_log").insert({
      user_id: userId,
      event_type: "admin_action",
      entity_type: "admin",
      entity_id: action,
      change_hash: createHash(JSON.stringify({ userId, action })),
      ip_address: clientIp,
    });
  } catch (error) {
    console.error("Failed to log admin access:", error);
  }
}

async function logUnauthorizedAccess(
  userId: string,
  request: NextRequest,
  resource: string
) {
  try {
    const clientIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const client = getSupabaseAdmin();

    await client.from("audit_log").insert({
      user_id: userId,
      event_type: "unauthorized_access_attempt",
      entity_type: "admin",
      entity_id: resource,
      change_hash: createHash(JSON.stringify({ userId, resource })),
      ip_address: clientIp,
    });
  } catch (error) {
    console.error("Failed to log unauthorized access:", error);
  }
}

function createHash(data: string): string {
  // In production, use crypto module
  return Buffer.from(data).toString("base64");
}
