'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/app/components/Navbar';
import { 
  FileSpreadsheet, 
  TrendingUp, 
  AlertOctagon, 
  CheckCircle2, 
  HelpCircle,
  BarChart3,
  RefreshCw,
  TrendingDown,
  DollarSign,
  Plus,
  ShieldCheck,
  Calendar,
  User,
  ArrowRight
} from 'lucide-react';
import { useSession } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Invoice {
  id: string;
  clientName: string;
  amount: number;
  createdAt: string;
  daysPastDue: number;
}

export default function ARAgingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingAllowance, setBookingAllowance] = useState(false);
  const [allowanceBookedSuccess, setAllowanceBookedSuccess] = useState(false);

  // Auth Protection
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/fintech/ar-aging');
    }
  }, [status, router]);

  // Load chronologically spaced invoices (mix of database + realistic mock items)
  const fetchOpenInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ledger/transaction?status=pending');
      
      // Compute realistic past due dates
      const now = new Date();

      if (res.ok) {
        const dbTxsResponse = await res.json();
        const dbTxs = Array.isArray(dbTxsResponse) ? dbTxsResponse : dbTxsResponse.transactions || [];
        const pendingTxs = dbTxs.filter((tx: any) => tx.status === 'pending' || tx.status === 'PENDING');
        
        const mappedDbInvoices = pendingTxs.map((tx: any) => {
          const txDate = new Date(tx.createdAt || tx.created_at);
          const daysPast = Math.max(0, Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24)));
          
          let client = "Fintech Client";
          if (tx.metadata) {
            let meta = tx.metadata;
            if (typeof meta === 'string') {
              try { meta = JSON.parse(meta); } catch (e) {}
            }
            client = meta.client_name || meta.clientName || client;
          }

          return {
            id: tx.id.substring(0, 8).toUpperCase(),
            clientName: client,
            amount: Number(tx.amount) / 100,
            createdAt: tx.createdAt || tx.created_at,
            daysPastDue: daysPast
          };
        });

        setInvoices(mappedDbInvoices);
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchOpenInvoices();
    }
  }, [session]);

  // Aging Bucket Math (0-30, 31-60, 61-90, 90+)
  const buckets = useMemo(() => {
    const b = {
      current: { amount: 0, count: 0, rate: 0.01 }, // 1% GAAP bad debt rate
      medium: { amount: 0, count: 0, rate: 0.05 },  // 5%
      high: { amount: 0, count: 0, rate: 0.20 },    // 20%
      critical: { amount: 0, count: 0, rate: 0.50 }  // 50%
    };

    invoices.forEach(inv => {
      if (inv.daysPastDue <= 30) {
        b.current.amount += inv.amount;
        b.current.count++;
      } else if (inv.daysPastDue <= 60) {
        b.medium.amount += inv.amount;
        b.medium.count++;
      } else if (inv.daysPastDue <= 90) {
        b.high.amount += inv.amount;
        b.high.count++;
      } else {
        b.critical.amount += inv.amount;
        b.critical.count++;
      }
    });

    return b;
  }, [invoices]);

  const totals = useMemo(() => {
    const totalAR = invoices.reduce((sum, item) => sum + item.amount, 0);
    const requiredAllowance = 
      (buckets.current.amount * buckets.current.rate) + 
      (buckets.medium.amount * buckets.medium.rate) + 
      (buckets.high.amount * buckets.high.rate) + 
      (buckets.critical.amount * buckets.critical.rate);

    return {
      totalAR,
      requiredAllowance,
      weightedRisk: totalAR > 0 ? (requiredAllowance / totalAR) * 100 : 0
    };
  }, [invoices, buckets]);

  // Book GAAP Bad Debt Allowance adjusting entry
  const handleBookAllowance = async () => {
    try {
      setBookingAllowance(true);
      const allowanceCents = Math.floor(totals.requiredAllowance * 100);

      // Book transaction representing dynamic bad debt allowance provisioning
      const idempotencyKey = `bad_debt_${Date.now()}`;
      const response = await fetch('/api/ledger/transaction', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          amount: -allowanceCents,
          idempotencyKey: idempotencyKey,
          description: "GAAP Provision: Allowance for Doubtful Accounts Adjustment",
          metadata: {
            client_name: "GAAP Bad Debt Provision",
            type: "BAD_DEBT",
            allowance_amount: totals.requiredAllowance,
            reconciled: true,
          },
          status: "Paid"
        })
      });

      if (response.ok) {
        setAllowanceBookedSuccess(true);
        setTimeout(() => setAllowanceBookedSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBookingAllowance(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100 rounded-full tracking-wider uppercase">
                  GAAP Compliance Schedule
                </span>
              </div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <BarChart3 className="w-9 h-9 text-teal-600 animate-pulse" />
                AR Aging & Provisioning
              </h1>
              <p className="text-slate-400 text-sm mt-1">Audit outstanding invoices, bucket bad debt risk, and post doubtful account allowances</p>
            </div>
            
            <button
              onClick={fetchOpenInvoices}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-md hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Recalculate Schedule
            </button>
          </div>

          {/* AR Aging Dashboard HUD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100/50">
                <DollarSign className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Accounts Receivable</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">
                  ${totals.totalAR.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{invoices.length} outstanding invoices</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100/50">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Required Provisioning Allowance</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">
                  ${totals.requiredAllowance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Calculated GAAP bad debt balance</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/50">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weighted Collection Risk</p>
                <h3 className="text-3xl font-black text-indigo-600 mt-1">
                  {totals.weightedRisk.toFixed(1)}%
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Average probability of default</p>
              </div>
            </div>

          </div>

          {/* Dribbble-Style Outstanding Risk Visual Chart */}
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-4 tracking-tight uppercase tracking-wider text-slate-400">Past Due Aging Buckets</h2>
            <div className="h-6 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
              {totals.totalAR > 0 ? (
                <>
                  <div 
                    style={{ width: `${(buckets.current.amount / totals.totalAR) * 100}%` }}
                    className="bg-emerald-500 hover:opacity-90 transition-opacity duration-300 relative group cursor-pointer"
                    title={`0-30 Days: $${buckets.current.amount.toFixed(2)}`}
                  />
                  <div 
                    style={{ width: `${(buckets.medium.amount / totals.totalAR) * 100}%` }}
                    className="bg-blue-500 hover:opacity-90 transition-opacity duration-300 relative group cursor-pointer"
                    title={`31-60 Days: $${buckets.medium.amount.toFixed(2)}`}
                  />
                  <div 
                    style={{ width: `${(buckets.high.amount / totals.totalAR) * 100}%` }}
                    className="bg-amber-500 hover:opacity-90 transition-opacity duration-300 relative group cursor-pointer"
                    title={`61-90 Days: $${buckets.high.amount.toFixed(2)}`}
                  />
                  <div 
                    style={{ width: `${(buckets.critical.amount / totals.totalAR) * 100}%` }}
                    className="bg-rose-500 hover:opacity-90 transition-opacity duration-300 relative group cursor-pointer"
                    title={`90+ Days: $${buckets.critical.amount.toFixed(2)}`}
                  />
                </>
              ) : (
                <div className="w-full flex items-center justify-center text-xs text-slate-400">No data available</div>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700">0-30 Days (Current)</h4>
                  <p className="text-[11px] font-mono text-slate-500 font-bold mt-0.5">${buckets.current.amount.toLocaleString()}</p>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 border border-emerald-100 rounded-sm">1% Provision</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded bg-blue-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700">31-60 Days past due</h4>
                  <p className="text-[11px] font-mono text-slate-500 font-bold mt-0.5">${buckets.medium.amount.toLocaleString()}</p>
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 border border-blue-100 rounded-sm">5% Provision</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded bg-amber-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700">61-90 Days past due</h4>
                  <p className="text-[11px] font-mono text-slate-500 font-bold mt-0.5">${buckets.high.amount.toLocaleString()}</p>
                  <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 border border-amber-100 rounded-sm">20% Provision</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded bg-rose-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700">90+ Days (Critical)</h4>
                  <p className="text-[11px] font-mono text-slate-500 font-bold mt-0.5">${buckets.critical.amount.toLocaleString()}</p>
                  <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 border border-rose-100 rounded-sm">50% Provision</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Bad Debt Provisioning Panel */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-[24px] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 text-white">
            <div className="space-y-2">
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400 animate-pulse" />
                GAAP-Compliant Allowance Adjuster
              </h2>
              <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
                Under GAAP (ASC 326 / CECL), organizations must regularly record bad debt provisioning reserves based on chronologically bucketed defaults. Click the **Book Allowance** button to automatically post the double-entry adjustments: `Debit Bad Debt Expense` and `Credit Allowance for Doubtful Accounts` into the ledger.
              </p>
            </div>
            
            <div className="shrink-0">
              {allowanceBookedSuccess ? (
                <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 font-bold text-xs font-mono animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  GAAP Adjustment Posted!
                </div>
              ) : (
                <button
                  onClick={handleBookAllowance}
                  disabled={bookingAllowance || totals.requiredAllowance === 0}
                  className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs active:scale-95 transition-all shadow-md shadow-teal-600/10 disabled:opacity-50"
                >
                  {bookingAllowance ? 'Posting Adjustments...' : 'Book Doubtful Debt Allowance ⚡'}
                </button>
              )}
            </div>
          </div>

          {/* Accounts Receivable Detailed Ledger */}
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-md font-black text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                Accounts Receivable Subledger Schedule
              </h2>
              <p className="text-slate-400 text-xs mt-1">Detailed list of outstanding invoices and client default risk profiles</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs text-slate-500 min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-black tracking-widest text-[9px]">
                    <th className="py-4 px-6">Invoice ID</th>
                    <th className="py-4 px-6">Client Name</th>
                    <th className="py-4 px-6">Invoice Date</th>
                    <th className="py-4 px-6 text-center">Days Overdue</th>
                    <th className="py-4 px-6 text-right">0-30 Days</th>
                    <th className="py-4 px-6 text-right">31-60 Days</th>
                    <th className="py-4 px-6 text-right">61-90 Days</th>
                    <th className="py-4 px-6 text-right">90+ Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">Loading aging subledger...</td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">No open accounts receivable located.</td>
                    </tr>
                  ) : (
                    invoices.map((inv) => {
                      const days = inv.daysPastDue;
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-slate-400 select-all">{inv.id}</td>
                          <td className="py-4 px-6 font-bold text-slate-700 flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {inv.clientName}
                          </td>
                          <td className="py-4 px-6 text-slate-400 font-medium font-mono">{new Date(inv.createdAt).toLocaleDateString()}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                              days <= 30 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : days <= 60 
                                  ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                  : days <= 90 
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {days} Days past
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right font-mono font-bold text-slate-800">
                            {days <= 30 ? `$${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="py-4 px-6 text-right font-mono font-bold text-slate-800">
                            {(days > 30 && days <= 60) ? `$${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="py-4 px-6 text-right font-mono font-bold text-slate-800">
                            {(days > 60 && days <= 90) ? `$${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="py-4 px-6 text-right font-mono font-bold text-slate-800">
                            {days > 90 ? `$${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
  );
}
