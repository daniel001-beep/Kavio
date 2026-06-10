const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://lyhgfezubrbgikuxhcug.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5aGdmZXp1YnJiZ2lrdXhoY3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTA5MzUsImV4cCI6MjA5MDIyNjkzNX0.5NVruxDA8pV5zjzjIGY6aTScaLa6EiJu2cmCzcjuaSM";

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Fetching invoices from Supabase...");
  try {
    const { data, error } = await supabase.from('invoices').select('*').limit(5);
    if (error) {
      console.error("Supabase REST API Error:", error);
    } else {
      console.log("Supabase REST API Invoices:", data);
    }
  } catch (err) {
    console.error("Supabase fetch failed:", err);
  }
}

main();
