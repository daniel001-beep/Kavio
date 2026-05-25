import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    // Lazily instantiate Supabase client inside the handler body.
    // This prevents module-level execution crashes during Next.js build-time page collection on Vercel.
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co").trim();
    const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    const supabaseKey = supabaseServiceKey || (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key").trim();

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 1. Parse request body and validate types
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Malformed JSON payload" },
        { status: 400 }
      );
    }

    const { user_tenant, action_event } = body;

    if (!user_tenant || typeof user_tenant !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'user_tenant' string in body" },
        { status: 400 }
      );
    }

    if (!action_event || typeof action_event !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'action_event' string in body" },
        { status: 400 }
      );
    }

    // 2. Extract client IP and Browser User Agent from request headers
    // In Next.js 15, headers() is asynchronous and should be awaited
    const headersList = await headers();
    
    // Check multiple headers for resilience (x-forwarded-for is standard for Vercel/proxies)
    const xForwardedFor = headersList.get("x-forwarded-for") || req.headers.get("x-forwarded-for") || "";
    const locationIp = xForwardedFor ? xForwardedFor.split(",")[0].trim() : "127.0.0.1";
    
    const device_info = headersList.get("user-agent") || req.headers.get("user-agent") || "Unknown Device/Browser";

    // 3. Asynchronously insert the event into Supabase audit_logs table
    const { data, error } = await supabase
      .from("audit_logs")
      .insert([
        {
          user_tenant: user_tenant.trim().toLowerCase(),
          action_event: action_event.trim(),
          location_ip: locationIp,
          device_info: device_info,
        },
      ])
      .select();

    if (error) {
      console.error("❌ [Audit Webhook] Supabase insertion failed:", error.message);
      return NextResponse.json(
        { error: "Database insertion failed", details: error.message },
        { status: 500 }
      );
    }

    // 4. Return success response with inserted record
    return NextResponse.json(
      {
        success: true,
        message: "Audit security event logged successfully",
        data: data?.[0] || null,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("❌ [Audit Webhook] Uncaught serverless execution error:", err.message);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}
