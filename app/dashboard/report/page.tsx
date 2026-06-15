"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "@/app/context/AuthContext";
import { 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  Download, 
  Users, 
  Sparkles,
  FileText,
  BadgeAlert,
  ShieldCheck,
  Building2,
  CalendarCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ReportPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUsersCount, setTotalUsersCount] = useState(1);
  const [isFreePromo, setIsFreePromo] = useState(true);

  // Fetch real user invoices on mount with cache fallback
  useEffect(() => {
    if (userEmail) {
      const cached = localStorage.getItem(`velox_cached_invoices_${userEmail}`);
      if (cached) {
        try {
          setInvoices(JSON.parse(cached));
        } catch (e) {}
      }
    }

    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/invoices?_t=" + Date.now(), { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const invoicesData = Array.isArray(data) ? data : [];
          setInvoices(invoicesData);
          if (userEmail) {
            localStorage.setItem(`velox_cached_invoices_${userEmail}`, JSON.stringify(invoicesData));
          }
        }
      } catch (err) {
        console.error("Failed to fetch invoices for reports:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUserTier = async () => {
      try {
        const res = await fetch("/api/user/tier");
        if (res.ok) {
          const data = await res.json();
          setTotalUsersCount(data.totalUsers || 1);
          setIsFreePromo(data.isFreePromo !== false);
        }
      } catch (err) {
        console.error("Failed to fetch user count:", err);
      }
    };

    fetchInvoices();
    fetchUserTier();
  }, [userEmail]);

  // Calculations based on user's actual invoice states
  const totalPaidRevenue = useMemo(() => {
    return invoices
      .filter(inv => inv.status === "PAID")
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
  }, [invoices]);

  const totalOutstandingReceivables = useMemo(() => {
    return invoices
      .filter(inv => ["SENT", "VIEWED", "OVERDUE"].includes(inv.status))
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
  }, [invoices]);

  const estimatedTax = useMemo(() => {
    return totalPaidRevenue * 0.15; // 15% estimated freelancer tax on paid cash-basis income
  }, [totalPaidRevenue]);

  const netDisposableProfit = useMemo(() => {
    return totalPaidRevenue - estimatedTax;
  }, [totalPaidRevenue, estimatedTax]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Compute actual Revenue concentration shares per client
  const clientRevenueShares = useMemo(() => {
    const paidInvoices = invoices.filter(inv => inv.status === "PAID");
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    if (totalPaid === 0) return [];

    const shareMap: Record<string, number> = {};
    paidInvoices.forEach(inv => {
      const name = inv.client?.name || "Other Client";
      shareMap[name] = (shareMap[name] || 0) + (inv.amount || 0);
    });

    return Object.entries(shareMap)
      .map(([name, value]) => ({
        name,
        value,
        pctValue: (value / totalPaid) * 100,
        pctLabel: ((value / totalPaid) * 100).toFixed(0) + "%"
      }))
      .sort((a, b) => b.value - a.value);
  }, [invoices]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500 pb-24 relative print:p-0 print:space-y-4">
      {/* Decorative ambient glow */}
      <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-emerald-150/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[350px] h-[350px] bg-emerald-100/5 rounded-full blur-[90px] pointer-events-none" />
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white text-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden print:border-none print:shadow-none print:p-0 print:m-0 z-10">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Kavio Tax & Profitability Suite</span>
            {isFreePromo && (
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-black px-2.5 py-0.5 rounded-full text-[10px] tracking-wide shadow-sm flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
                Early Adopter Promo: Pro Free
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight print:text-xl">
            Profitability & Tax Hub
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-semibold print:hidden">
            Dynamic cash-basis statements calculated directly from your real client billing records.
          </p>
        </div>

        <div className="flex items-center gap-4 relative z-10 print:hidden">
          <Button
            onClick={handlePrintReport}
            className="py-5 px-5 text-xs font-bold rounded-xl bg-[#00B140] hover:bg-[#009933] text-white shadow-lg shadow-emerald-500/10 border-none transition-all duration-200 flex items-center gap-2 cursor-pointer hover:translate-y-[-1px] active:translate-y-[0px]"
          >
            <Download className="w-4 h-4" />
            Print / Save Statement PDF
          </Button>
        </div>
      </div>

      {isFreePromo && (
        <div className="bg-emerald-50/50 rounded-2xl p-5 flex items-start gap-3 border border-emerald-100/80 shadow-sm relative z-10 print:hidden">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-emerald-800">Early Adopter Pricing Activated</h4>
            <p className="text-[11px] text-emerald-600 leading-relaxed font-semibold">
              Kavio is 100% free and fully unlocked for our first 10 users! You are user #{totalUsersCount} in our database. All advanced PDF reporting, invoice tracking, and compliance toolsets are fully active on your account with zero paywalls.
            </p>
          </div>
        </div>
      )}

      {/* Section 1: Income vs Expenses Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        
        {/* Total Income Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 flex items-center justify-between shadow-sm border border-slate-100 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Total Paid Revenue</span>
            <h2 className="text-2xl font-black text-emerald-600 font-mono">{formatCurrency(totalPaidRevenue)}</h2>
            <p className="text-[10px] text-slate-450 font-semibold mt-1">Confirmed client cash receipts</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Total Outstanding Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 flex items-center justify-between shadow-sm border border-slate-100 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Accounts Receivable</span>
            <h2 className="text-2xl font-black text-amber-600 font-mono">{formatCurrency(totalOutstandingReceivables)}</h2>
            <p className="text-[10px] text-slate-450 font-semibold mt-1">Outstanding pending collections</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Net Reconciled Difference */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 flex items-center justify-between shadow-sm border border-slate-100 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Disposable Net Income</span>
            <h2 className="text-2xl font-black text-emerald-700 font-mono">{formatCurrency(netDisposableProfit)}</h2>
            <p className="text-[10px] text-slate-450 font-semibold mt-1">Cash profit minus estimated taxes</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Grid for Statement & Client share breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Left Side: Profit & Loss Statement Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 border border-slate-100 hover:shadow-md transition-all duration-300 print:border-none print:shadow-none print:p-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Statement of Revenue & Tax</h2>
            <p className="text-xs text-slate-450 font-semibold mt-1">Reconciled profit and loss details calculated for self-assessment reporting</p>
          </div>

          <div className="w-full border border-slate-100 rounded-2xl p-6 sm:p-8 space-y-6 bg-white print:border-none print:p-0">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Kavio Freelancer Ledger</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-1.5">Account Holder: {userEmail || "Registered User"}</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase">
                Cash Basis
              </Badge>
            </div>

            <div className="space-y-5">
              {/* Table Headers */}
              <div className="grid grid-cols-3 text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100/60">
                <div className="col-span-2">Line Item Detail</div>
                <div className="text-right">Total Amount</div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 text-xs font-bold text-slate-700">
                  <div className="col-span-2">Freelance Revenue (Settled Invoices)</div>
                  <div className="text-right font-mono text-emerald-600">{formatCurrency(totalPaidRevenue)}</div>
                </div>
                
                <div className="grid grid-cols-3 text-xs font-bold text-slate-700">
                  <div className="col-span-2">Accounts Receivable (Sent/Unpaid)</div>
                  <div className="text-right font-mono text-slate-500">{formatCurrency(totalOutstandingReceivables)}</div>
                </div>

                <div className="grid grid-cols-3 text-xs font-bold text-slate-700 pt-3 border-t border-slate-100/60">
                  <div className="col-span-2">Total Operating Revenue Base</div>
                  <div className="text-right font-mono text-slate-900">{formatCurrency(totalPaidRevenue)}</div>
                </div>

                <div className="grid grid-cols-3 text-xs font-bold text-slate-400">
                  <div className="col-span-2 pl-4">Operating Outflow Expenses</div>
                  <div className="text-right font-mono text-slate-400">₦ 0</div>
                </div>

                <div className="grid grid-cols-3 text-xs font-bold text-slate-700 pt-3 border-t border-slate-100/60">
                  <div className="col-span-2">Estimated Pre-Tax Income</div>
                  <div className="text-right font-mono text-slate-900">{formatCurrency(totalPaidRevenue)}</div>
                </div>

                <div className="grid grid-cols-3 text-xs font-bold text-slate-500">
                  <div className="col-span-2">Deductions: Est. Freelancer Tax (15%)</div>
                  <div className="text-right font-mono text-rose-500">-{formatCurrency(estimatedTax)}</div>
                </div>
              </div>

              {/* Net bottom line */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-3 text-xs font-black text-slate-900">
                <div className="col-span-2 text-slate-800 text-sm">Disposable Net Income</div>
                <div className="text-right text-sm font-mono text-emerald-600">{formatCurrency(netDisposableProfit)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Client Revenue Shares (dynamic categories replacement) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 border border-slate-100 hover:shadow-md transition-all duration-300 print:hidden">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Revenue Concentration</h2>
            <p className="text-xs text-slate-450 font-semibold mt-1">Breakdown of earnings distributed by client volume</p>
          </div>

          <div className="space-y-6">
            {clientRevenueShares.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-semibold space-y-2">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No paid revenue records found.</p>
                <p className="text-[10px] text-slate-350">Once invoices are marked PAID, client share distributions render here.</p>
              </div>
            ) : (
              clientRevenueShares.map((share, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="truncate max-w-[150px]">{share.name}</span>
                    <span className="font-mono text-slate-900">{formatCurrency(share.value)} ({share.pctLabel})</span>
                  </div>
                  <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-[#00B140] rounded-full"
                      style={{ width: `${share.pctValue}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Section 4: Paid Invoices Ledger Log */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 border border-slate-100 hover:shadow-md transition-all duration-300 relative z-10 print:border-none print:shadow-none print:p-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Audit Trail: Settled Ledger Credits</h2>
          <p className="text-xs text-slate-450 font-semibold mt-1 print:hidden">Verified log of all completed payments used in these calculations</p>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice No.</th>
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client Name</th>
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</th>
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Settled</th>
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Settled Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-650">
              {invoices.filter(inv => inv.status === "PAID").length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <CalendarCheck className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                    No settled invoices found. Mark an invoice as PAID on the dashboard to record taxable revenue.
                  </td>
                </tr>
              ) : (
                invoices
                  .filter(inv => inv.status === "PAID")
                  .map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-all duration-200">
                      <td className="py-4 px-4 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                      <td className="py-4 px-4 font-bold text-slate-900">{inv.client?.name || "Client"}</td>
                      <td className="py-4 px-4 text-slate-500 font-medium">{inv.projectDescription}</td>
                      <td className="py-4 px-4 text-slate-450 font-medium">
                        {inv.updatedAt ? new Date(inv.updatedAt).toLocaleDateString() : new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-emerald-600">
                        {formatCurrency(inv.amount)}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
