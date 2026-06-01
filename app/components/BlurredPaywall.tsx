"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface BlurredPaywallProps {
  isLocked: boolean;
  feature: string;
  description: string;
  children: React.ReactNode;
}

export function BlurredPaywall({
  isLocked,
  feature,
  description,
  children,
}: BlurredPaywallProps) {
  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full h-full min-h-[250px] overflow-hidden rounded-xl border border-slate-100">
      {/* Blurred Content */}
      <div className="w-full h-full select-none pointer-events-none filter blur-[6px] opacity-40">
        {children}
      </div>

      {/* Paywall Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-50/40 backdrop-blur-md z-10 transition-all duration-300">
        <div className="max-w-md w-full text-center bg-white border border-slate-100 p-8 rounded-2xl shadow-xl space-y-6 transform scale-100 transition-all">
          <div className="mx-auto w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
            <Lock className="w-6 h-6" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Unlock {feature}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
              {description}
            </p>
          </div>

          <div className="pt-2">
            <Button
              className="w-full py-6 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 border-none transition-all duration-200"
              onClick={() => {
                alert("Redirection to checkout: ₦2,500/month");
              }}
            >
              Upgrade to Pro — ₦2,500/mo
            </Button>
            <p className="text-[11px] text-slate-400 mt-3">
              Cancel anytime • Instant activation • Full financial suit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
