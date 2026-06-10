const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkData() {
  console.log("Supabase URL:", supabaseUrl);
  
  // Fetch users
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/user?select=*`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });
    const users = await res.json();
    console.log(`Fetched ${users.length} users:`, users.map(u => ({ id: u.id, name: u.name, email: u.email })));
  } catch (err) {
    console.error("Failed to fetch users:", err.message);
  }

  // Fetch transactions
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/transaction?select=*`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });
    const txs = await res.json();
    console.log(`Fetched ${txs.length} transactions:`, txs);
  } catch (err) {
    console.error("Failed to fetch transactions:", err.message);
  }

  // Fetch invoices
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/invoices?select=*`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });
    const invs = await res.json();
    console.log(`Fetched ${invs.length} invoices:`, invs);
  } catch (err) {
    console.error("Failed to fetch invoices:", err.message);
  }
}

checkData();
