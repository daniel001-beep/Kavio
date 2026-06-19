"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UpgradeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [notified, setNotified] = useState(false);

  if (!isOpen) return null;

  const tiers = [
    {
      name: "Starter",
      price: "Free",
      features: ["Max 3 workers", "Basic reminders", "Dashboard", "Payment history"],
      buttonText: "Current Plan",
      disabled: true,
    },
    {
      name: "Team",
      price: "₦10,000",
      period: "/month",
      features: ["Max 20 workers", "Calendar", "Receipt uploads", "Analytics"],
      buttonText: "Notify me when available",
      highlight: true,
    },
    {
      name: "Business",
      price: "₦25,000",
      period: "/month",
      features: ["Max 100 workers", "Multi-business support", "Advanced analytics"],
      buttonText: "Notify me when available",
    },
    {
      name: "Growth",
      price: "₦50,000",
      period: "/month",
      features: ["Unlimited workers", "Future API access", "Priority support"],
      buttonText: "Notify me when available",
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-emerald-500 fill-emerald-500" />
              Upgrade Your Plan
            </h2>
            <p className="text-slate-500 mt-1 font-medium">Unlock more power for your growing team.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - scrollable if needed on small screens */}
        <div className="p-6 md:p-8 overflow-y-auto">
          {notified && (
            <div className="mb-8 p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-center font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Thanks! We'll let you know as soon as paid plans are available. You're still on the free Early Access Beta!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier, idx) => (
              <div 
                key={idx} 
                className={`relative flex flex-col p-6 bg-white rounded-3xl border-2 transition-all duration-300 ${
                  tier.highlight 
                    ? "border-emerald-500 shadow-xl shadow-emerald-500/10 scale-105 z-10" 
                    : "border-slate-100 hover:border-slate-200 shadow-sm"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900">{tier.name}</h3>
                  <div className="mt-4 flex items-baseline text-slate-900">
                    <span className="text-3xl font-black tracking-tight">{tier.price}</span>
                    {tier.period && <span className="ml-1 text-sm font-semibold text-slate-500">{tier.period}</span>}
                  </div>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {tier.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start text-sm font-medium text-slate-600">
                      <CheckCircle2 className={`w-4 h-4 mr-3 shrink-0 ${tier.highlight ? 'text-emerald-500' : 'text-slate-400'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  disabled={tier.disabled}
                  onClick={() => {
                    if (!tier.disabled) setNotified(true);
                  }}
                  className={`w-full font-bold rounded-xl h-11 ${
                    tier.disabled 
                      ? "bg-slate-100 text-slate-400 hover:bg-slate-100" 
                      : tier.highlight
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  {tier.buttonText}
                </Button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
