import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function fetchLogs() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    return;
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/audit_log?select=*`, {
      method: "GET",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });
    console.log("Response status:", res.status);
    if (res.ok) {
      const data = await res.json();
      console.log(`Fetched ${data.length} logs from audit_log table:`, JSON.stringify(data, null, 2));
    } else {
      console.log("Error details:", await res.text());
    }
  } catch (e: any) {
    console.error("Fetch error:", e.message);
  }
}

fetchLogs();
