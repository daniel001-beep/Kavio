"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GlobalAdminRootPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/fintech/admin");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
        <span>Redirecting to Super Admin Console...</span>
      </div>
    </div>
  );
}
