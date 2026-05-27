import RunwayClient from "@/app/components/RunwayClient";

export default async function RunwayPage() {
  // Return the client shell instantly to avoid blocking server-side DB queries.
  // RunwayClient will handle initial cache mounting and background data sync.
  return (
    <RunwayClient initialTransactions={[]} />
  );
}
