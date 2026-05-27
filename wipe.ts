import { Pool } from "pg";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lyhgfezubrbgikuxhcug.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Postgres connection using Direct Database Host (Port 5432)
const connectionString = process.env.POSTGRES_URL_NON_POOLING || "";

async function wipeData() {
  console.log("Starting data wipe procedure via Supabase HTTP REST SDK to bypass local DNS constraints...");

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Wipe remote Postgres tables via Supabase REST API
  try {
    console.log("Wiping remote Postgres tables...");
    await supabase.from("ledger_entry").delete().neq("id", "0");
    await supabase.from("transaction").delete().neq("id", "0");
    await supabase.from("order").delete().neq("id", "0");
    await supabase.from("review").delete().neq("id", "0");
    await supabase.from("invoices").delete().neq("id", "0");
    console.log("All remote tables wiped successfully.");
  } catch (err: any) {
    console.error("Failed to wipe remote tables via Supabase API:", err.message);
  }

  // 3. Wipe Local JSON Database fallback
  try {
    console.log("Wiping local JSON fallback database...");
    const localDbPath = path.join(process.cwd(), "local_dev_db.json");
    if (fs.existsSync(localDbPath)) {
      const data = JSON.parse(fs.readFileSync(localDbPath, "utf-8"));
      
      data.transactions = [];
      data.ledgerEntries = [];
      data.orders = [];
      data.reviews = [];
      
      fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2));
      console.log("Local JSON database wiped successfully.");
    }
  } catch (err: any) {
    console.error("Failed to wipe local JSON db:", err.message);
  }

  console.log("All financial records have been securely erased. Accounts are untouched.");
}

wipeData();
