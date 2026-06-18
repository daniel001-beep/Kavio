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
        <div className="bg-emerald-50 text-emerald-600 rounded-full px-4 py-2 mt-6 flex items-center gap-2 text-sm font-semibold animate-pulse border border-emerald-100 shadow-sm">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Redirecting to dashboard...
        </div>
      </div>
    </div>
  );
}
