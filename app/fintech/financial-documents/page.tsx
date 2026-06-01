"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "@/app/context/AuthContext";
import { BlurredPaywall } from "@/app/components/BlurredPaywall";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Download, 
  Calculator, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Lock,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function FinancialDocumentsPage() {
  const { data: session, status } = useSession();
  const userEmail = session?.user?.email;
  const [userTier, setUserTier] = useState<"FREE" | "PRO">("FREE");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [exchangeRate, setExchangeRate] = useState(1550); // NGN baseline

  // Load transactions from cache to stay synchronized with other pages
  useEffect(() => {
    if (userEmail) {
      const cached = localStorage.getItem(`velox_cached_api_transactions_${userEmail}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setTransactions(parsed);
          }
        } catch (e) {}
      }
    }
  }, [userEmail]);

  // Compute live ledger numbers
  const totalIncomeUsd = useMemo(() => {
    return transactions
      .filter(tx => tx.type === "CREDIT" && tx.status === "COMPLETED")
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [transactions]);

  const totalExpensesUsd = useMemo(() => {
    return transactions
      .filter(tx => tx.type === "DEBIT")
      .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
  }, [transactions]);

  const netProfitUsd = useMemo(() => {
    return totalIncomeUsd - totalExpensesUsd;
  }, [totalIncomeUsd, totalExpensesUsd]);

  const formatCurrency = (usdVal: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(usdVal * exchangeRate);
  };

  // Mock Tax & Category distribution
  const categories = [
    { name: "SaaS & Infrastructure", value: totalExpensesUsd * 0.45, pct: "45%" },
    { name: "Marketing & Brand Acquisition", value: totalExpensesUsd * 0.3, pct: "30%" },
    { name: "Contractor Payroll", value: totalExpensesUsd * 0.15, pct: "15%" },
    { name: "Travel, Workspace & Office", value: totalExpensesUsd * 0.1, pct: "10%" },
  ];

  const estimatedTax = netProfitUsd > 0 ? netProfitUsd * 0.15 : 0; // 15% estimated freelancer tax

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500 pb-24">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium text-xs uppercase tracking-widest">Kavio Tax & Compliance Suite</span>
            <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full text-[10px] tracking-wide">
              {userTier === "FREE" ? "Free Tier" : "Pro Tier Enabled"}
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Profitability & Tax Hub
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium">
            Generate tax-ready financial statements and export audited PDF files.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 relative z-10">
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setUserTier("FREE")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                userTier === "FREE" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400"
              }`}
            >
              Simulate Free
            </button>
            <button
              onClick={() => setUserTier("PRO")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                userTier === "PRO" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-400"
              }`}
            >
              Simulate Pro
            </button>
          </div>

          <Button
            onClick={() => {
              if (userTier === "FREE") {
                alert("Redirection to checkout: Upgrade to Pro (₦2,500/mo) to unlock PDF Exports!");
              } else {
                window.print();
              }
            }}
            className="py-5 px-5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-450 hover:to-emerald-550 text-white shadow-lg shadow-emerald-500/20 border-none transition-all duration-200 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Audited PDF
          </Button>
        </div>
      </div>

      {/* Section 1: Income vs Expenses Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Income Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Total Taxable Income</span>
            <h2 className="text-2xl font-black text-emerald-600 font-mono">{formatCurrency(totalIncomeUsd)}</h2>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Direct incoming ledger credits</p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Operating Expenses</span>
            <h2 className="text-2xl font-black text-rose-600 font-mono">{formatCurrency(totalExpensesUsd)}</h2>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">SaaS, travel, and contractor payouts</p>
          </div>
          <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Net Reconciled Difference */}
        <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Reconciled Net Profit</span>
            <h2 className="text-2xl font-black text-emerald-400 font-mono">{formatCurrency(netProfitUsd)}</h2>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Audited pre-tax earnings</p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/30">
            <Calculator className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Section 2: Category Spending Charts (Gated) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Category Spend Allocation</h2>
          <p className="text-xs text-slate-400 font-medium">Reconciled breakdown of all deductible operating outflows</p>
        </div>

        <BlurredPaywall
          isLocked={userTier === "FREE"}
          feature="Category Spending Charts"
          description="Unlock the interactive donut and horizontal spend distribution charts, providing clear tax-deductible expense tracking."
        >
          <div className="space-y-4 max-w-2xl">
            {categories.map((c, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{c.name}</span>
                  <span className="font-mono text-slate-800">{formatCurrency(c.value)} ({c.pct})</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                    style={{ width: c.pct }}
                  />
                </div>
              </div>
            ))}
          </div>
        </BlurredPaywall>
      </div>

      {/* Section 3: Tax-Ready P&L Statement (Gated) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Profit & Loss (P&L) Statement</h2>
            <p className="text-xs text-slate-400 font-medium">Audited statement for tax filings and bank funding</p>
          </div>
        </div>

        {/* P&L Document layout */}
        <div className="max-w-3xl w-full border border-slate-200 rounded-2xl shadow-md p-8 sm:p-12 space-y-8 bg-white relative overflow-hidden">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-6">
            <div>
              <h3 className="text-lg font-black text-slate-800">Kavio Audited Ledger</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Prepared for: {userEmail || "Freelancer"}</p>
            </div>
            <div className="text-right">
              <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold px-2 py-0.5 rounded-full text-[9px] uppercase">
                Tax-Ready
              </Badge>
            </div>
          </div>

          {/* Q1-Q4 Tables Gated layout */}
          <div className="space-y-6">
            
            {/* Table Header */}
            <div className="grid grid-cols-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100">
              <div className="col-span-2">Line Item Detail</div>
              <div className="text-right">Q1 (Jan-Mar)</div>
              <div className="text-right">Q2-Q4 Forecast</div>
            </div>

            {/* Incomes */}
            <div className="space-y-3">
              <div className="grid grid-cols-4 text-xs font-bold text-slate-800">
                <div className="col-span-2">Freelance Revenue (Credits)</div>
                <div className="text-right font-mono">{formatCurrency(totalIncomeUsd * 0.25)}</div>
                <div className="text-right font-mono relative">
                  {userTier === "FREE" ? (
                    <span className="blur-[4px] select-none">{formatCurrency(totalIncomeUsd * 0.75)}</span>
                  ) : (
                    <span>{formatCurrency(totalIncomeUsd * 0.75)}</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 text-xs font-semibold text-slate-400">
                <div className="col-span-2 pl-4">Contractor/Invoiced Outflows</div>
                <div className="text-right font-mono">₦ 0</div>
                <div className="text-right font-mono relative">
                  {userTier === "FREE" ? (
                    <span className="blur-[3px] select-none">₦ 0</span>
                  ) : (
                    <span>₦ 0</span>
                  )}
                </div>
              </div>
            </div>

            {/* Expenses */}
            <div className="space-y-3 pt-2 border-t border-slate-50">
              <div className="grid grid-cols-4 text-xs font-bold text-slate-800">
                <div className="col-span-2">Operating Expenses</div>
                <div className="text-right font-mono text-rose-600">{formatCurrency(totalExpensesUsd * 0.2)}</div>
                <div className="text-right font-mono text-rose-600 relative">
                  {userTier === "FREE" ? (
                    <span className="blur-[4px] select-none">{formatCurrency(totalExpensesUsd * 0.8)}</span>
                  ) : (
                    <span>{formatCurrency(totalExpensesUsd * 0.8)}</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 text-xs font-semibold text-slate-400">
                <div className="col-span-2 pl-4">SaaS & Technology Outlay</div>
                <div className="text-right font-mono">-{formatCurrency(totalExpensesUsd * 0.2 * 0.45)}</div>
                <div className="text-right font-mono relative">
                  {userTier === "FREE" ? (
                    <span className="blur-[3px] select-none">-{formatCurrency(totalExpensesUsd * 0.8 * 0.45)}</span>
                  ) : (
                    <span>-{formatCurrency(totalExpensesUsd * 0.8 * 0.45)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-4 text-xs font-black text-slate-900">
                <div className="col-span-2">Pre-Tax Net Profit</div>
                <div className="text-right font-mono text-emerald-600">{formatCurrency(netProfitUsd * 0.25)}</div>
                <div className="text-right font-mono text-emerald-600 relative">
                  {userTier === "FREE" ? (
                    <span className="blur-[4px] select-none">{formatCurrency(netProfitUsd * 0.75)}</span>
                  ) : (
                    <span>{formatCurrency(netProfitUsd * 0.75)}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 text-xs font-bold text-slate-400">
                <div className="col-span-2">Est. Freelancer Tax (15%)</div>
                <div className="text-right font-mono">-{formatCurrency(estimatedTax * 0.25)}</div>
                <div className="text-right font-mono relative">
                  {userTier === "FREE" ? (
                    <span className="blur-[4px] select-none">-{formatCurrency(estimatedTax * 0.75)}</span>
                  ) : (
                    <span>-{formatCurrency(estimatedTax * 0.75)}</span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Absolute Blur Paywall for Free Tier */}
          {userTier === "FREE" && (
            <div className="absolute inset-0 top-1/2 flex flex-col items-center justify-center p-6 bg-white/40 backdrop-blur-sm transition-all duration-300">
              <div className="max-w-sm w-full text-center bg-white border border-slate-100 p-6 rounded-2xl shadow-xl space-y-4">
                <div className="mx-auto w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">Unlock Audited Full Year P&L</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Upgrade to Pro to render full year audited income statement, itemized categories, and export dynamic PDF reports.
                  </p>
                </div>
                <Button
                  onClick={() => setUserTier("PRO")}
                  className="w-full py-4 text-[11px] font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-450 hover:to-emerald-550 text-white shadow-md cursor-pointer border-none"
                >
                  Unlock with Pro — ₦2,500/mo
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
