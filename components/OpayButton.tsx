"use client";

import React, { useState, useEffect } from "react";
import { X, Smartphone } from "lucide-react";

interface OpayButtonProps {
  invoiceAmount: number;
  freelancerAccount: string;
  freelancerBank?: string;
  freelancerName?: string;
}

export default function OpayButton({
  invoiceAmount,
  freelancerAccount,
  freelancerBank = "OPay",
  freelancerName = "the freelancer"
}: OpayButtonProps) {
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Show a skeleton while loading to avoid SSR mismatches
    return (
      <div className="w-full h-14 bg-slate-100 animate-pulse rounded-xl" />
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full h-14 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-sm font-bold rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 hover:scale-[0.99] active:scale-[0.98] cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-emerald-500" />
          <span>OPay Integration (Coming Soon)</span>
          <span className="ml-1 px-2.5 py-1 bg-emerald-200/50 text-emerald-900 text-[9px] font-black uppercase tracking-wider rounded-md">
            Roadmap
          </span>
        </button>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1 pr-6">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block font-mono">Development Roadmap</span>
              <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">OPay Integration Coming Soon</h3>
            </div>

            {/* Content */}
            <div className="space-y-4 pt-1">
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                We're currently working on direct OPay payment integration. For now, please complete payment via bank transfer and upload your payment receipt for verification.
              </p>
              
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                  Receipt verification is fully supported through Kavio's payment confirmation workflow.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-sm cursor-pointer hover:scale-[0.99] active:scale-[0.98]"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
