"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, RotateCcw } from "lucide-react";

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-6 text-center select-none animate-in fade-in duration-300">
      <div className="bg-white border border-slate-200 rounded-[30px] p-8 max-w-sm w-full shadow-lg flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100 animate-pulse">
          <WifiOff className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Connection Lost</h1>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            Kavio is offline. Please check your internet connection and try again.
          </p>
        </div>

        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98"
        >
          <RotateCcw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
          {isRetrying ? "Checking Network..." : "Retry Connection"}
        </button>
      </div>
      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-8">
        Kavio Business Finance OS
      </p>
    </div>
  );
}
