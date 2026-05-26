'use server';

import { createClient } from '@/src/lib/supabase-server';
import { revalidatePath } from 'next/cache';

/**
 * SECURE LEDGER TRANSACTION ACTION
 * 
 * Demonstrates B2B Multi-Tenancy Defense-in-Depth:
 * 1. Auth check is performed server-side.
 * 2. 'tenant_id' is NOT passed from the client; it is assigned by DB default (auth.uid()).
 * 3. RLS policies prevent any cross-tenant data leakage if header tampering occurs.
 */
export async function createTransaction(formData: FormData) {
  const supabase = await createClient();
  
  if (!supabase) {
    return { success: false, error: 'System configuration error: Supabase keys missing.' };
  }

  // 1. Verify Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: No valid session found.');
  }

  // 2. Extract Business Data
  const amount = parseFloat(formData.get('amount') as string);
  const description = formData.get('description') as string;
  const type = formData.get('type') as string;

  // 3. Database Insertion
  // Note: We EXCLUDE 'tenant_id'. The DB handles this via:
  // DEFAULT auth.uid() and strictly enforces it via RLS policies.
  const { data, error } = await supabase
    .from('transaction')
    .insert({
      amount: BigInt(Math.round(amount * 100)), // Store in cents
      status: 'pending',
      metadata: { 
        description, 
        type,
        ip_address: 'LOGGED_BY_RLS' 
      }
    })
    .select()
    .single();

  if (error) {
    console.error('Multi-tenant insertion error:', error.message);
    return { success: false, error: 'Database isolation policy violation or connection error.' };
  }

  // 4. Invalidate cache for relevant tenant pages
  revalidatePath('/dashboard');
  revalidatePath('/fintech/ledger');

  return { success: true, data };
}
