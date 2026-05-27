import DashboardLayout from '@/app/components/DashboardLayout';
import LedgerClient from '@/app/components/LedgerClient';

export default async function LedgerPage() {
  // Returns immediately to bypass blocking DB fetches and timeout lag.
  // The client LedgerClient will immediately mount, parse from its local storage cache,
  // and load new entries in the background dynamically.
  return (
    <DashboardLayout>
      <LedgerClient initialTransactions={[]} />
    </DashboardLayout>
  );
}
