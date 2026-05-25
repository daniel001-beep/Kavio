import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function check() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    return;
  }

  // 1. Check audit_log (singular)
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/audit_log?limit=1`, {
      method: "GET",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });
    console.log("audit_log (singular) response status:", res.status);
    if (res.ok) {
      console.log("audit_log (singular) exists! Data:", await res.json());
    } else {
      console.log("audit_log (singular) error content:", await res.text());
    }
  } catch (e: any) {
    console.error("audit_log fetch error:", e.message);
  }

  // 2. Check audit_logs (plural)
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/audit_logs?limit=1`, {
      method: "GET",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });
    console.log("audit_logs (plural) response status:", res.status);
    if (res.ok) {
      console.log("audit_logs (plural) exists! Data:", await res.json());
    } else {
      console.log("audit_logs (plural) error content:", await res.text());
    }
  } catch (e: any) {
    console.error("audit_logs fetch error:", e.message);
  }
}

check();
