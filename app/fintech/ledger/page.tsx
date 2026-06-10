'use client';

import LedgerClient from '@/app/components/LedgerClient';

/**
 * Smart Ledger Page
 * Renders the full-featured LedgerClient which pulls real transactions
 * from the Drizzle/Supabase database, scoped to the logged-in user.
 * No mock data — all values come from the authenticated session's records.
 */
export default function LedgerPage() {
  return <LedgerClient />;
}
