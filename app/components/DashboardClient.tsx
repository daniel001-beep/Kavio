"use client";

import React, { useState } from "react";
import { 
  TrendingUp, 
  Activity, 
  ArrowDownRight, 
  ArrowUpRight, 
  RefreshCw, 
  Download, 
  ShieldCheck, 
  Zap, 
  Loader2, 
  BookOpen, 
  Plus, 
  Layers,
  ArrowRight,
  TrendingDown,
  Sparkles
} from "lucide-react";
import { useDashboardData } from "@/app/hooks/useDashboardData";
import { BlurredPaywall } from "@/app/components/BlurredPaywall";
import PortfolioPerformance from "@/app/components/PortfolioPerformance";
import RevenuePerformance from "@/app/components/RevenuePerformance";
import ExpenseAllocation from "@/app/components/ExpenseAllocation";
import AuditTimeline from "@/app/components/AuditTimeline";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardClientProps {
  totalBalanceUsd: number;
  dayChangeUsd: number;
  transactions: any[];
  isDemoData?: boolean;
}

export default function DashboardClient({
  totalBalanceUsd: initialBalance,
  dayChangeUsd: initialChange,
  transactions: initialTransactions = [],
}: DashboardClientProps) {
  // Use our custom data hook
  const {
    status,
    userEmail,
    currency,
    setCurrency,
    isExporting,
    transactions,
    gmvSum,
    gpSum,
    apSum,
    arSum,
    netProfit,
    formatCurrency,
    formatLiveCurrency,
    exportToCSV,
    todayFormatted,
    todayReadable,
  } = useDashboardData({
    initialBalance,
    initialChange,
    initialTransactions,
  });

  // Feature Flag: simulate Free vs Pro to test BlurredPaywall
  const [userTier, setUserTier] = useState<"FREE" | "PRO">("FREE");

  // Get name from email
  const displayName = userEmail 
    ? userEmail.split("@")[0].charAt(0).toUpperCase() + userEmail.split("@")[0].slice(1)
    : "Freelancer";

  const getTypeIcon = (type: string, amount: number) => {
    if (amount > 0) return <ArrowDownRight className="w-4 h-4 text-emerald-500" />;
    if (amount < 0) return <ArrowUpRight className="w-4 h-4 text-rose-500" />;
    return <RefreshCw className="w-4 h-4 text-blue-500" />;
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Securing Kavio Command Center...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* Top Banner: Greeting, Simulation Toggle & Primary CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium text-sm">Welcome back,</span>
            <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              {userTier === "FREE" ? "Free Tier" : "Pro Active"}
            </Badge>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Good morning, {displayName}.
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            Here is your financial command center for today, {todayReadable}.
          </p>
        </div>

        {/* Action Controls & Simulated Tier Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 relative z-10">
          
          {/* Simulation Toggle */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setUserTier("FREE")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                userTier === "FREE"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Simulate Free
            </button>
            <button
              onClick={() => setUserTier("PRO")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                userTier === "PRO"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Simulate Pro
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency Select */}
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-white font-semibold text-xs rounded-xl px-3 py-3 hover:bg-slate-700 transition-colors cursor-pointer focus:outline-none"
            >
              <option value="NGN">₦ NGN</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </select>

            {/* Create Invoice Primary Anchor */}
            <Link href="/dashboard/invoices/create" passHref legacyBehavior>
              <Button className="py-6 px-6 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/20 border-none transition-all duration-200 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Invoice
              </Button>
            </Link>
          </div>

        </div>
      </div>

      {/* Bento Grid — Metrics Row (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1: Total Invoices Unpaid (Amber alert `#F59E0B`) */}
        <div className="bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 hover:border-amber-500/20 rounded-3xl p-6 sm:p-8 transition-all group relative overflow-hidden shadow-sm">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">
              Total Invoices Unpaid
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 font-mono tracking-tight mb-2">
            {formatLiveCurrency(arSum)}
          </h2>
          <div className="flex items-center">
            <Badge className="bg-amber-500/10 border border-amber-500/20 text-amber-600 font-bold text-[10px] rounded-full px-2 py-0.5">
              Receivables Pending
            </Badge>
          </div>
        </div>

        {/* Metric 2: Monthly Revenue (Emerald growth `#10B981`) */}
        <div className="bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/20 rounded-3xl p-6 sm:p-8 transition-all group relative overflow-hidden shadow-sm">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">
              Monthly Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 font-mono tracking-tight mb-2">
            {formatLiveCurrency(gpSum)}
          </h2>
          <div className="flex items-center">
            <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold text-[10px] rounded-full px-2 py-0.5 flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" />
              Completed Earnings
            </Badge>
          </div>
        </div>

        {/* Metric 3: Net Profit (Blue trust `#3B82F6`) */}
        <div className="bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/20 rounded-3xl p-6 sm:p-8 transition-all group relative overflow-hidden shadow-sm">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">
              Net Profit
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 font-mono tracking-tight mb-2">
            {formatLiveCurrency(netProfit)}
          </h2>
          <div className="flex items-center">
            <Badge className="bg-blue-500/10 border border-blue-500/20 text-blue-600 font-bold text-[10px] rounded-full px-2 py-0.5 flex items-center gap-1">
              Revenue minus expenses
            </Badge>
          </div>
        </div>

      </div>

      {/* Row 2: Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col Span 2: Revenue Trend Chart (Gated with BlurredPaywall) */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl shadow-sm p-6 sm:p-8 flex flex-col justify-between min-h-[380px]">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Revenue Trajectory</h2>
            <p className="text-xs text-slate-400 font-medium">Real-time revenue growth and invoicing data</p>
          </div>
          
          <div className="flex-1 w-full relative">
            <BlurredPaywall
              isLocked={userTier === "FREE"}
              feature="Revenue Trends"
              description="Gain insight into your 12-month revenue trajectory, invoice collection latency, and monthly budgeting trends."
            >
              <div className="h-64 w-full">
                <PortfolioPerformance transactions={transactions} />
              </div>
            </BlurredPaywall>
          </div>
        </div>

        {/* Col Span 1: Recent Transactions Table */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl shadow-sm p-6 sm:p-8 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">Recent Activity</h2>
              <p className="text-[11px] text-slate-400 font-medium">Latest ledger updates</p>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>

          <div className="flex-1 overflow-y-auto max-h-[250px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full">
              <tbody className="divide-y divide-slate-50">
                {transactions.length === 0 ? (
                  <tr>
                    <td>
                      <div className="py-8 flex flex-col items-center gap-3 text-center">
                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-slate-300" />
                        </div>
                        <p className="text-slate-400 text-xs font-semibold">Your ledger is empty</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 5).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-3 pr-2">
                        <div className="w-7 h-7 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:border-emerald-500/50 transition-colors">
                          {getTypeIcon(tx.type, tx.amount)}
                        </div>
                      </td>
                      <td className="py-3 px-2 min-w-0">
                        <p className="text-slate-700 text-xs font-bold truncate max-w-[120px]">
                          {tx.description}
                        </p>
                        <p className="text-slate-400 text-[10px] font-semibold mt-0.5">
                          {tx.date ? new Date(tx.date).toLocaleDateString() : ""}
                        </p>
                      </td>
                      <td className="py-3 pl-2 text-right font-mono text-xs font-bold text-slate-800">
                        <span className={tx.amount > 0 ? "text-emerald-600" : "text-slate-800"}>
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <Link href="/fintech/journals" className="text-xs font-bold text-emerald-500 hover:text-emerald-600 transition-colors flex items-center gap-1 justify-center no-underline">
              View All Journals
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* Row 3: Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Col Span 1: Operating Expense Allocation Donut */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 sm:p-8 flex flex-col justify-between min-h-[300px]">
          <ExpenseAllocation transactions={transactions} />
        </div>

        {/* Col Span 1: Account Receivable Aging Table */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 sm:p-8 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-800 tracking-tight">Receivables Aging</h2>
                <p className="text-[10px] text-slate-400 font-medium">As of {todayReadable}</p>
              </div>
            </div>
            
            <div className="overflow-x-auto w-full mt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="text-left py-2 px-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Invoice</th>
                    <th className="text-right py-2 px-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="text-right py-2 px-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[11px]">
                  {transactions.filter(tx => tx.status === "PENDING" && tx.amount > 0).length === 0 ? (
                    <tr>
                      <td colSpan={3}>
                        <div className="py-8 flex flex-col items-center gap-2 text-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          </div>
                          <p className="text-slate-500 text-xs font-semibold">No unpaid invoices</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions
                      .filter(tx => tx.status === "PENDING" && tx.amount > 0)
                      .slice(0, 4)
                      .map((tx, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-600 truncate max-w-[100px]">
                            {tx.id ? `TX-${tx.id.toString().substring(0, 6).toUpperCase()}` : "TX/SLS/001"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-400">
                            Pending
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Col Span 1: Quick Actions & Tools */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 sm:p-8 flex flex-col justify-between min-h-[300px]">
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight mb-4">Quick Tools</h2>
            <div className="space-y-3">
              <Link href="/dashboard/invoices/create" className="no-underline">
                <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-50 hover:bg-slate-50 cursor-pointer transition-all group">
                  <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 group-hover:text-emerald-500 transition-colors">
                      New Invoice Factory
                    </h4>
                    <p className="text-[10px] text-slate-400">Draft or send a new client invoice</p>
                  </div>
                </div>
              </Link>

              <Link href="/fintech/financial-documents" className="no-underline">
                <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-50 hover:bg-slate-50 cursor-pointer transition-all group">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 group-hover:text-blue-500 transition-colors">
                      Financial Documents
                    </h4>
                    <p className="text-[10px] text-slate-400">Analyze Profit & Loss statement</p>
                  </div>
                </div>
              </Link>

              <button
                onClick={exportToCSV}
                disabled={isExporting}
                className="w-full text-left bg-transparent border-none p-0 focus:outline-none"
              >
                <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-50 hover:bg-slate-50 cursor-pointer transition-all group">
                  <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500">
                    {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 group-hover:text-purple-500 transition-colors">
                      Export Verified Audit
                    </h4>
                    <p className="text-[10px] text-slate-400">Download ledger details as CSV</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Row 4: Immutable Audit Trail */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">Immutable Audit Trail</h2>
            <p className="text-xs text-slate-400 mt-1">Cryptographically verified logs & ledger audits</p>
          </div>
        </div>
        <AuditTimeline transactions={transactions} />
      </div>

    </div>
  );
}
