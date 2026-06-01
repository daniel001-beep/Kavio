'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  ArrowDownRight, 
  ArrowUpRight, 
  Plus, 
  Activity, 
  DollarSign,
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import AddTransactionModal from '@/app/components/AddTransactionModal';

interface Transaction {
  id: string;
  amount: number;
  status: string;
  description: string;
  category: string;
  account: string;
  createdAt: string;
}

interface DashboardClientComponentProps {
  initialStats: {
    revenueMTD: number;
    expensesMTD: number;
    netProfitMTD: number;
    currentBalance: number;
  };
  initialTransactions?: Transaction[];
  userId: string;
}

export default function DashboardClientComponent({ 
  initialStats, 
  initialTransactions = [], 
  userId 
}: DashboardClientComponentProps) {
  const [stats, setStats] = useState(initialStats);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync state with server-provided props on mount only
  useEffect(() => {
    setStats(initialStats);
    setTransactions(initialTransactions);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh data from API after a new transaction is logged
  const refreshDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/ledger/transaction?_t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const txs = data.transactions || [];
        
        const mapped: Transaction[] = txs.map((tx: any) => ({
          id: tx.id,
          amount: Number(tx.amount) / 100,
          status: tx.status,
          description: tx.metadata?.description || tx.description || 'Ledger transaction',
          category: tx.metadata?.category || 'General',
          account: tx.metadata?.accountId || 'Cash Wallet',
          createdAt: tx.createdAt,
        }));

        setTransactions(mapped);

        // Recalculate MTD metrics client-side
        let balance = 0;
        let revenue = 0;
        let expenses = 0;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);

        mapped.forEach((tx) => {
          if (tx.status === 'completed') {
            balance += tx.amount;
            const txDate = new Date(tx.createdAt);
            if (txDate >= startOfMonth) {
              if (tx.amount > 0) {
                revenue += tx.amount;
              } else {
                expenses += Math.abs(tx.amount);
              }
            }
          }
        });

        setStats({
          currentBalance: balance,
          revenueMTD: revenue,
          expensesMTD: expenses,
          netProfitMTD: revenue - expenses
        });
      }
    } catch (e) {
      console.warn('Failed to refresh stats:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 'N' key shortcut to open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'n') {
        const activeEl = document.activeElement;
        if (
          activeEl && (
            activeEl.tagName === 'INPUT' || 
            activeEl.tagName === 'TEXTAREA' || 
            activeEl.getAttribute('contenteditable') === 'true'
          )
        ) return;
        e.preventDefault();
        setIsModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 30-day Net Profit trend line
  const chartData = useMemo(() => {
    const dataPoints = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      d.setHours(23, 59, 59, 999);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      let cumulativeProfit = 0;
      transactions.forEach((tx) => {
        const txDate = new Date(tx.createdAt);
        if (tx.status === 'completed' && txDate <= d) {
          const startOfTxMonth = new Date(d.getFullYear(), d.getMonth(), 1);
          startOfTxMonth.setHours(0, 0, 0, 0);
          if (txDate >= startOfTxMonth) {
            cumulativeProfit += tx.amount;
          }
        }
      });
      
      dataPoints.push({
        date: label,
        'Net Profit (MTD)': parseFloat(cumulativeProfit.toFixed(2)),
      });
    }
    return dataPoints;
  }, [transactions]);

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  const fmt = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  // ─── KPI Card Data ──────────────────────────────────────────────────────────
  const kpiCards = [
    {
      label: 'Net Profit (MTD)',
      value: fmt(stats.netProfitMTD),
      sub: 'Pre-tax business margin',
      color: stats.netProfitMTD >= 0 ? 'text-emerald-600' : 'text-rose-600',
      accent: 'text-indigo-500',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      iconColor: 'text-indigo-600',
      Icon: Activity,
    },
    {
      label: 'Revenue (MTD)',
      value: fmt(stats.revenueMTD),
      sub: 'Total inbound sales',
      color: 'text-slate-800',
      accent: 'text-emerald-500',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      iconColor: 'text-emerald-600',
      Icon: ArrowUpRight,
    },
    {
      label: 'Expenses (MTD)',
      value: fmt(stats.expensesMTD),
      sub: 'Total outbound cash',
      color: 'text-slate-800',
      accent: 'text-rose-500',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      iconColor: 'text-rose-500',
      Icon: ArrowDownRight,
    },
    {
      label: 'Cash Position',
      value: fmt(stats.currentBalance),
      sub: 'GTBank + Opay + Wallet',
      color: 'text-slate-800',
      accent: 'text-blue-500',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      iconColor: 'text-blue-600',
      Icon: DollarSign,
    },
  ];

  return (
    <div className="flex flex-col h-full pb-16" style={{ animation: 'fadeIn 0.4s ease' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">How is your business doing right now?</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 font-bold py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-[1.01] active:scale-95 shadow-sm text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Transaction</span>
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card) => {
          const Icon = card.Icon;
          return (
            <div
              key={card.label}
              className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-extrabold uppercase tracking-widest leading-none ${card.accent}`}>
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl border ${card.bg} ${card.border}`}>
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              </div>
              <div>
                <h2 className={`text-2xl font-black font-mono tracking-tight ${card.color}`}>
                  {card.value}
                </h2>
                <p className={`text-xs font-bold mt-1 ${card.accent}`}>{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 30-Day Cash Flow Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-800 tracking-tight">MTD Profit Performance</h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">30-day cumulative net profit trajectory</p>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => `$${v}`}
                  dx={-5}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#f1f5f9', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  }}
                  labelStyle={{ color: '#64748b', fontWeight: 700, fontSize: '11px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Net Profit (MTD)" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Mutations */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">Recent Mutation</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Last 5 Mutations</p>
            </div>
            <a href="/fintech/journals" className="text-xs text-blue-600 hover:text-blue-500 font-bold transition-colors">
              View All
            </a>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-64">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-200"
                >
                  <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center border ${
                    tx.amount > 0 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : 'bg-rose-50 text-rose-500 border-rose-100'
                  }`}>
                    {tx.amount > 0
                      ? <ArrowUpRight className="w-4 h-4" />
                      : <ArrowDownRight className="w-4 h-4" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 text-sm truncate">{tx.description}</div>
                    <div className="text-xs text-slate-400 font-semibold capitalize mt-0.5">
                      {tx.category} &bull; {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className={`font-bold text-sm shrink-0 ml-2 tabular-nums ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {tx.amount > 0 ? '+' : ''}{fmt(tx.amount)}
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs py-16 text-center leading-relaxed">
                No recent transactions yet.<br />Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">N</kbd> to log one.
              </div>
            )}
          </div>
        </div>

      </div>

      <AddTransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refreshDashboardData}
      />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
