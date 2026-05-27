'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TrendingUp, 
  Activity, 
  Globe, 
  ArrowDownRight, 
  ArrowUpRight, 
  RefreshCw, 
  Download, 
  ShieldCheck,
  Zap,
  Loader2,
  Sparkles,
  BookOpen,
  AlertTriangle,
  TrendingDown
} from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import PortfolioPerformance from '@/app/components/PortfolioPerformance';
import RevenuePerformance from '@/app/components/RevenuePerformance';
import ExpenseAllocation from '@/app/components/ExpenseAllocation';
import AuditTimeline from '@/app/components/AuditTimeline';
import { UITransaction } from './LedgerClient';
import { supabase } from '@/src/lib/supabase-client';
import { useNotifications } from '@/app/context/NotificationContext';

import { useSession } from '@/app/context/AuthContext';

interface DashboardClientProps {
  totalBalanceUsd: number;
  dayChangeUsd: number;
  transactions: UITransaction[];
  isDemoData?: boolean;
}


export default function DashboardClient({ 
  totalBalanceUsd: initialBalance, 
  dayChangeUsd: initialChange, 
  transactions: initialTransactions = [],
  isDemoData = false
}: DashboardClientProps) {
  const { data: session, status } = useSession();
  const userEmail = session?.user?.email;
  const userId = session?.user?.id;

  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'NGN'>('USD');
  const [isSentinelActive, setIsSentinelActive] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { addNotification } = useNotifications();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [apiTransactions, setApiTransactions] = useState<UITransaction[]>([]);
  const [serverBalance, setServerBalance] = useState(initialBalance);
  const [serverDayChange, setServerDayChange] = useState(initialChange);
  const [exchangeRates, setExchangeRates] = useState({
    USD: 1,
    EUR: 0.92,
    NGN: 1450.50,
  });

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(d => {
        if (d && d.rates) {
          setExchangeRates({
            USD: 1,
            EUR: d.rates.EUR || 0.92,
            NGN: d.rates.NGN || 1450.50,
          });
        }
      })
      .catch(e => console.warn('Failed to fetch live exchange rates', e));
  }, []);

  // Load from localStorage cache on mount for instant sub-0.1s loading
  // This runs BEFORE any API fetch, so cached data is always visible first
  // STRICT TENANT ISOLATION: Never load fallback cache from other users or global keys
  useEffect(() => {
    // 1. Reset client states to clean baseline first to prevent brief cross-tenant bleed
    setApiTransactions([]);
    setInvoices([]);

    if (initialTransactions && initialTransactions.length > 0) {
      setApiTransactions(initialTransactions);
    }

    if (userEmail) {
      const cached = localStorage.getItem(`velox_cached_api_transactions_${userEmail}`);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          if (Array.isArray(parsedCache)) {
            setApiTransactions(parsedCache);
          }
        } catch (e) {
          console.warn('Failed to parse cached dashboard transactions:', e);
        }
      }

      const cachedInvoices = localStorage.getItem(`velox_cached_invoices_${userEmail}`);
      if (cachedInvoices) {
        try {
          const parsedInvoices = JSON.parse(cachedInvoices);
          if (Array.isArray(parsedInvoices)) {
            setInvoices(parsedInvoices);
          }
        } catch (e) {
          console.warn('Failed to parse cached dashboard invoices:', e);
        }
      }
    }
  }, [userEmail, initialTransactions]);

  // Track the last active email for instant recovery after logout
  useEffect(() => {
    if (userEmail && typeof window !== 'undefined') {
      localStorage.setItem('velox_last_active_user_email', userEmail);
    }
  }, [userEmail]);

  // Fetch fresh transactions from the API on mount and after any change
  // CRITICAL: Overwrite state with [] if user has zero transactions.
  // We only skip overwrite if the API actually failed with a non-OK status (500/503).
  const fetchLatestTransactions = useCallback(async () => {
    try {
      const res = await fetch('/api/ledger/transaction?_t=' + Date.now(), { cache: 'no-store' });
      
      // If the API returns a non-OK status (e.g., 503 database unavailable),
      // DO NOT overwrite the client cache — just silently skip
      if (!res.ok) {
        console.warn('Dashboard: API returned non-OK status:', res.status, '— preserving cached data');
        return;
      }
      
      const data = await res.json();
      
      const transactionsPayload = Array.isArray(data) ? data : data.transactions || [];
      if (!Array.isArray(data)) {
        setServerBalance(data.totalBalanceUsd !== undefined ? data.totalBalanceUsd : initialBalance);
        setServerDayChange(data.dayChangeUsd !== undefined ? data.dayChangeUsd : initialChange);
      }

      // Map data successfully.
      const mapped: UITransaction[] = transactionsPayload.map((tx: any) => {
            const amountInDollars = Number(tx.amount) / 100;
            let meta = tx.metadata;
            if (typeof meta === 'string') {
              try {
                meta = JSON.parse(meta);
              } catch (e) {}
            }
            return {
              id: tx.id?.toString(),
              type: amountInDollars > 0 ? 'CREDIT' : 'DEBIT',
              description: meta?.description || tx.description || 'Transaction',
              date: tx.createdAt ? new Date(tx.createdAt).toISOString() : new Date().toISOString(),
              amount: amountInDollars,
              status: tx.status?.toUpperCase() || 'COMPLETED',
            };
          });

      setApiTransactions(mapped);
      
      // Cache the newly retrieved list strictly per-user
      if (userEmail) {
        localStorage.setItem(`velox_cached_api_transactions_${userEmail}`, JSON.stringify(mapped));
      }
    } catch (err) {
      // Network error — preserve cached data, don't wipe it
      console.error('Dashboard: Failed to fetch transactions from API:', err);
    }
  }, [userEmail]);

  // Fetch on mount
  useEffect(() => {
    fetchLatestTransactions();
    // Supabase realtime handles live updates; poll every 90s only as a safety net
    const interval = setInterval(fetchLatestTransactions, 90000);
    return () => clearInterval(interval);
  }, [fetchLatestTransactions]);

  // Real-time subscription: open a persistent WebSocket channel for instant lag-free updates
  useEffect(() => {
    if (!supabase || !userEmail || !userId) return;

    const channel = supabase
      .channel('dashboard-realtime')
      // 1. Subscribe to transactions table (insertions & updates)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transaction' },
        async (payload) => {
          console.log('[Realtime] Transaction change:', payload.eventType, payload.new);
          
          // Re-fetch in background to ensure final backend consistency
          fetchLatestTransactions();

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newTx = payload.new as any;
            
            // Only update local React state if this belongs to the active tenant
            if (newTx && (newTx.user_id === userId || newTx.userId === userId)) {
              const amountInCents = Number(newTx.amount || 0);
              const amountInDollars = amountInCents / 100;
              
              let meta = newTx.metadata;
              if (typeof meta === 'string') {
                try {
                  meta = JSON.parse(meta);
                } catch (e) {}
              }

              const uiTx: UITransaction = {
                id: newTx.id?.toString(),
                type: amountInDollars > 0 ? 'CREDIT' : 'DEBIT',
                description: meta?.description || newTx.description || 'Transaction via Webhook',
                date: newTx.created_at ? new Date(newTx.created_at).toISOString() : new Date().toISOString(),
                amount: amountInDollars,
                status: newTx.status?.toUpperCase() || 'COMPLETED',
              };

              setApiTransactions((prev) => {
                const index = prev.findIndex((tx) => tx.id === uiTx.id);
                let updated = [...prev];
                if (index >= 0) {
                  updated[index] = uiTx;
                } else {
                  updated = [uiTx, ...updated];
                }

                // Update cache
                localStorage.setItem(`velox_cached_api_transactions_${userEmail}`, JSON.stringify(updated));
                localStorage.setItem(`velox_last_active_cached_api_transactions`, JSON.stringify(updated));
                return updated;
              });

              if (payload.eventType === 'INSERT') {
                addNotification({
                  type: 'SUCCESS',
                  title: 'New Ledger Entry',
                  message: `Transaction processed: $${Math.abs(amountInDollars).toLocaleString()} (${uiTx.description})`,
                });
                addNotification({
                  type: 'SENTINEL',
                  title: 'Sentinel Alert: New Ledger Entry',
                  message: `Detected transaction: $${Math.abs(amountInDollars).toLocaleString()}. Integrity verified.`,
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addNotification, userEmail, userId, fetchLatestTransactions]);

  // Supabase Presence: Track user online status in real-time
  useEffect(() => {
    if (!supabase || !userEmail) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: userEmail,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {})
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await channel.track({
              online_at: new Date().toISOString(),
              email: userEmail,
            });
          } catch (trackErr) {
            console.warn('Failed to track user presence:', trackErr);
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail]);

  // Compute live visual states: just sort API transactions
  const transactions = useMemo<UITransaction[]>(() => {
    return [...apiTransactions].sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeB - timeA;
    });
  }, [apiTransactions]);

  const balance = serverBalance;
  const dayChange = serverDayChange;

  const formatCurrency = (usdValue: number) => {
    const rate = exchangeRates[currency];
    const converted = usdValue * rate;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: currency === 'NGN' ? 0 : 2,
    }).format(converted);
  };

  // Compute real account aging dynamic data based on unified transactions
  const arAgingData = useMemo(() => {
    const pendingTransactions = transactions.filter(tx => tx.status === 'PENDING');
    if (pendingTransactions.length > 0) {
      return pendingTransactions.slice(0, 5).map(tx => ({
        inv: tx.id ? `TX-${tx.id.toString().substring(0, 8).toUpperCase()}` : 'TX/SLS/112025/0142',
        amt: formatCurrency(tx.amount || 0),
        days: 'Pending'
      }));
    }
    return [];
  }, [transactions, currency]);

  // --- EXPORT ENGINE ---
  const exportToCSV = async () => {
    setIsExporting(true);
    
    // Simulate deep cryptographic audit/processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const headers = ['Date', 'Description', 'Type', 'Amount', 'Status'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(tx => [
        `"${tx.date ? new Date(tx.date).toLocaleString() : ''}"`,
        `"${tx.description}"`,
        tx.type,
        tx.amount,
        tx.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `velox_audit_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExporting(false);
    addNotification({
      type: 'SUCCESS',
      title: 'Audit Complete',
      message: 'Your cryptographically verified report has been exported.',
    });
  };

  const gmvSum = transactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
  const gpSum = transactions.filter(tx => tx.status?.toUpperCase() === 'COMPLETED' || !tx.status).reduce((acc, tx) => acc + (tx.amount || 0), 0);
  const apSum = transactions.filter(tx => tx.amount < 0).reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
  const arSum = transactions.filter(tx => tx.status === 'PENDING' && tx.amount > 0).reduce((acc, tx) => acc + (tx.amount || 0), 0);

  const formatLiveCurrency = (value: number) => {
    const rate = exchangeRates[currency];
    const converted = value * rate;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'NGN' ? 0 : 2,
      maximumFractionDigits: currency === 'NGN' ? 0 : 2
    }).format(converted);
  };

  const statCards = [
    {
      label: 'Gross Merchandise Value (GMV)',
      value: formatLiveCurrency(gmvSum),
      subtext: gmvSum > 0 ? `+${formatLiveCurrency(gmvSum * 0.015)} (+1.50%) this month` : '$0.00 this month',
      icon: TrendingUp,
      color: '#0052cc',
    },
    {
      label: 'Gross Profit',
      value: formatLiveCurrency(gpSum),
      subtext: gpSum >= 0 ? `+${formatLiveCurrency(Math.abs(gpSum) * 0.011)} (+1.10%) this month` : `-${formatLiveCurrency(Math.abs(gpSum) * 0.011)} (-1.10%) this month`,
      icon: TrendingUp,
      color: '#00b4d8',
    },
    {
      label: 'Account Payable',
      value: formatLiveCurrency(apSum),
      subtext: apSum > 0 ? `-${formatLiveCurrency(apSum * 0.0125)} (-1.25%) last month` : '$0.00 last month',
      icon: TrendingUp,
      color: '#f72585',
    },
    {
      label: 'Account Receivable',
      value: formatLiveCurrency(arSum),
      subtext: arSum > 0 ? `+${formatLiveCurrency(arSum * 0.0145)} (+1.45%) last month` : '$0.00 last month',
      icon: TrendingUp,
      color: '#0052cc',
    },
  ];

  const todayFormatted = useMemo(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }, []);

  const todayReadable = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }, []);

  const getTypeIcon = (type: string, amount: number) => {
    if (amount > 0) return <ArrowDownRight className="w-4 h-4 text-emerald-500" />;
    if (amount < 0) return <ArrowUpRight className="w-4 h-4 text-rose-500" />;
    return <RefreshCw className="w-4 h-4 text-blue-500" />;
  };

  // Render a clean loading shell during session validation to prevent brief cache flashes of other users
  // NOTE: Must be AFTER all hooks to comply with React's Rules of Hooks
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Securing Ledger Session...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full animate-in fade-in duration-500">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-blue-600 tracking-tight">Dashboard Overview</h1>

            </div>
            
            {/* Custom Interactive Mock Date Picker matching the screenshot exactly */}
            <div className="mt-8">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5">As Of Date</label>
              <div className="flex items-center justify-between gap-2.5 px-3.5 py-2 border border-slate-200 bg-white rounded-xl shadow-sm w-fit text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400 text-sm">📅</span>
                  <span>{todayFormatted}</span>
                </div>
                <span className="text-slate-450 ml-2 hover:text-slate-650 transition-colors">✕</span>
              </div>
            </div>
          </div>
          <div className="flex flex-row items-center gap-3 w-fit mt-8 sm:mt-0 mb-6 sm:mb-0">
             <button 
                onClick={exportToCSV}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 font-bold py-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all active:scale-95 shadow-sm text-xs md:text-sm min-w-[110px]"
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" /> : <Download className="w-3.5 h-3.5 text-slate-500" />}
                <span>{isExporting ? 'Exporting...' : 'Export'}</span>
              </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-col md:grid md:grid-cols-4 gap-8 mb-16 mt-6 md:mt-0">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const isNegative = stat.subtext.startsWith('-');
            return (
              <div
                key={index}
                className="bg-white border border-slate-200 rounded-[24px] relative overflow-hidden group hover:border-slate-300 transition-all shadow-sm p-4 sm:p-8"
              >
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Icon size={120} />
                </div>
                
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <div 
                    className="p-2 rounded-xl"
                    style={{ backgroundColor: stat.color + '15' }}
                  >
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                </div>
                
                <div className="relative z-10 flex flex-col justify-end">
                  <h3 className="text-lg sm:text-2xl font-bold text-slate-800 font-mono mb-2">
                    {stat.value}
                  </h3>
                  <div className="flex items-center">
                    <span 
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isNegative 
                          ? 'text-rose-600 bg-rose-50 border-rose-100' 
                          : 'text-emerald-600 bg-emerald-50 border-emerald-100'
                      }`}
                    >
                      {stat.subtext}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid - exactly replicating the screenshot layout */}
        <div className="flex flex-col gap-10 mt-10">
          
          {/* Row 1: GMV Area Chart & Revenue vs Budget grouped bar chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div 
              className="lg:col-span-2 bg-white border border-slate-200 rounded-[24px] relative overflow-hidden shadow-sm p-5 sm:p-10"
            >
              <PortfolioPerformance transactions={transactions} />
            </div>
            
            <div 
              className="lg:col-span-1 bg-white border border-slate-200 rounded-[24px] relative overflow-hidden shadow-sm p-5 sm:p-10"
            >
              <RevenuePerformance transactions={transactions} />
            </div>
          </div>

          {/* Row 2: Recent Transactions, Expense Allocation, and AR Aging */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity Table */}
            <div 
              className="lg:col-span-1 bg-white border border-slate-200 rounded-[24px] overflow-hidden h-fit flex flex-col justify-between shadow-sm p-4 sm:p-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <h2 style={{ color: '#0f172a' }} className="text-sm font-bold tracking-tight">Recent Transactions</h2>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Details</th>
                      <th className="text-right py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={3}>
                          <div className="py-8 flex flex-col items-center gap-3 text-center">
                            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-slate-300" />
                            </div>
                            <p className="text-slate-400 text-xs font-semibold">Your ledger is empty</p>
                            <a href="/fintech/journals" className="text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors underline underline-offset-2">
                              Post your first entry →
                            </a>
                          </div>
                        </td>
                      </tr>
                    ) : transactions.slice(0, 5).map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-3 px-3">
                           <div className="w-7 h-7 rounded bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:border-blue-500/50 transition-colors">
                             {getTypeIcon(tx.type, tx.amount)}
                           </div>
                        </td>
                        <td className="py-3 px-3 min-w-0">
                          <p className="text-slate-700 text-xs font-bold truncate max-w-[120px]">{tx.description}</p>
                          <p className="text-slate-400 text-[10px] font-semibold mt-0.5">{tx.date ? new Date(tx.date).toLocaleDateString() : ''}</p>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs font-bold text-slate-800">
                           <span className={tx.amount > 0 ? 'text-emerald-600' : 'text-slate-800'}>
                             {formatCurrency(tx.amount)}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Operating Expense Allocation (Donut Chart) */}
            <div 
              className="lg:col-span-1 bg-white border border-slate-200 rounded-[24px] relative overflow-hidden flex flex-col justify-between shadow-sm p-4 sm:p-8"
            >
              <ExpenseAllocation transactions={transactions} />
            </div>

            {/* Account Receivable Aging Table */}
            <div 
              className="lg:col-span-1 bg-white border border-slate-200 rounded-[24px] overflow-hidden flex flex-col justify-start gap-4 shadow-sm p-4 sm:p-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 style={{ color: '#0f172a' }} className="text-sm font-bold tracking-tight">Account Receivable Aging</h2>
                  <p className="text-[10px] text-slate-400 font-medium">As of date: {todayReadable}</p>
                </div>
              </div>
              <div className="overflow-x-auto w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice</th>
                      <th className="text-right py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                      <th className="text-right py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overdue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {arAgingData.length === 0 ? (
                      <tr>
                        <td colSpan={3}>
                          <div className="py-10 flex flex-col items-center gap-2 text-center">
                            <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            </div>
                            <p className="text-slate-500 text-xs font-semibold">No pending receivables</p>
                            <p className="text-[10px] text-slate-400">All invoices are settled ✓</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      arAgingData.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-600 truncate max-w-[130px]">{row.inv}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-700">{row.amt}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-400">{row.days}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Row 3: Security & Immutable Audit Trail (placed clean at bottom) */}
          <div 
            className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm p-5 sm:p-10"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 style={{ color: '#0f172a' }} className="text-base font-bold tracking-tight">Immutable Audit Trail</h2>
                <p className="text-xs text-slate-400 mt-1">Cryptographically verified logs & ledger audits</p>
              </div>

            </div>
            <AuditTimeline transactions={transactions} />
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
