import DashboardClient from "@/app/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Return the client shell instantly. Perceived loading is sub-1ms
  // as the client-side DashboardClient mounts, loads local cache, and fetches in the background.
  return (
    <DashboardClient 
      totalBalanceUsd={0}
      dayChangeUsd={0}
      transactions={[]}
      isDemoData={false}
    />
  );
}
