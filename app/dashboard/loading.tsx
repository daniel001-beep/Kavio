export default function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col gap-2 pt-6 md:pt-0">
        <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
        <div className="h-8 w-48 bg-slate-200 rounded-md"></div>
      </div>

      {/* Hero Stats Card Skeleton */}
      <div className="h-40 w-full bg-slate-100 rounded-[24px] border border-slate-200"></div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="h-[300px] bg-slate-100 rounded-3xl border border-slate-200"></div>
        <div className="h-[300px] bg-slate-100 rounded-3xl border border-slate-200"></div>
        <div className="h-[300px] bg-slate-100 rounded-3xl border border-slate-200"></div>
      </div>
    </div>
  );
}
