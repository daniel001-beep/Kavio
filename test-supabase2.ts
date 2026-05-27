import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('transaction').select('*');
  console.log('Total transactions:', data?.length);
  
  if (data) {
    const userIds = [...new Set(data.map((tx: any) => tx.user_id))];
    console.log('Distinct user IDs in transactions:', userIds);
    const danielsTxs = data.filter((tx: any) => tx.user_id === 'usr_6wshej3ht');
    console.log('Daniels transactions:', danielsTxs.length);
  }
}

main();
