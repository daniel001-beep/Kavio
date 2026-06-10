"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PaymentsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/invoices?tab=payments");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          Redirecting to ledger...
        </p>
      </div>
    </div>
  );
}
