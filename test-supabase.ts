import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('transaction').select('*').limit(5);
  console.log('Transactions:', data);
  console.log('Error:', error);
  
  const { data: invoices, error: invError } = await supabase.from('invoices').select('*').limit(5);
  console.log('Invoices:', invoices);
  console.log('Invoice Error:', invError);
}

main();
