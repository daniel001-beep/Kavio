'use client';

import React, { useState, useEffect } from 'react';
import { Download, Calendar, BarChart3, TrendingDown, TrendingUp, Loader } from 'lucide-react';

interface ExpenseCategory {
  name: string;
  amount: number;
  percent: number;
}

export default function ReportsPage() {
  const [report, setReport] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    expenseBreakdown: [] as ExpenseCategory[],
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchPLReport = async () => {
    try {
      const res = await fetch('/api/dashboard/reports');
      const data = await res.json();
      if (res.ok) {
        setReport(data);
      }
    } catch (err) {
      console.error("Failed to load Profit & Loss report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPLReport();

    const handleRefresh = () => {
      fetchPLReport();
    };
    window.addEventListener('transaction-created', handleRefresh);
    return () => window.removeEventListener('transaction-created', handleRefresh);
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const handleExportPDF = () => {
    setExporting(true);
    window.print();
    setTimeout(() => setExporting(false), 500);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center flex-col gap-4">
        <Loader className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Compiling Profit & Loss data...</p>
      </div>
    );
  }

  const expenseRatio = report.totalRevenue > 0
    ? Math.round((report.totalExpenses / report.totalRevenue) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-400 printable-section">
      <div className="flex justify-between items-center no-print">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Financial Documents & Reports</h1>
          <p className="text-slate-500 text-sm font-medium">Comprehensive and compliance-ready Profit & Loss statement.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full font-bold flex items-center gap-2 text-xs select-none shadow-sm">
            <Calendar className="w-4 h-4 text-blue-500" />
            All-Time Accumulation
          </div>
          <button 
            onClick={handleExportPDF}
            disabled={exporting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-bold flex items-center gap-2 transition-all hover:scale-[1.01] shadow-md shadow-blue-500/10 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Opening Print...' : 'Export P&L'}
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print-header mb-8 text-center text-slate-900">
        <h1 className="text-2xl font-bold">Velox OS Financial Statement</h1>
        <p className="text-sm font-semibold text-slate-550">Profit & Loss Report • Generated {new Date().toLocaleDateString()}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* P&L Summary Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm shadow-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Profit & Loss Summary
            </h2>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400 uppercase tracking-widest font-extrabold">Total Revenue</span>
                  <span className="text-emerald-600 font-extrabold text-base">{formatCurrency(report.totalRevenue)}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <div className="h-full bg-emerald-500 w-[100%] rounded-full"></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400 uppercase tracking-widest font-extrabold">Total Expenses</span>
                  <span className="text-rose-500 font-extrabold text-base">{formatCurrency(report.totalExpenses)}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, expenseRatio)}%` }}></div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-extrabold block mb-1">Net Profit</span>
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(report.netProfit)}</span>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
                    report.netProfit >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-550 bg-rose-50'
                  }`}>
                    {report.netProfit >= 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        Net Gain
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4" />
                        Net Deficit
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm shadow-slate-100 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-500" />
              Expense Breakdown
            </h2>
            
            <div className="space-y-5">
              {report.expenseBreakdown.length > 0 ? (
                report.expenseBreakdown.map(cat => (
                  <div key={cat.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-600 font-bold capitalize">{cat.name}</span>
                      <span className="text-slate-400 font-semibold font-mono">{formatCurrency(cat.amount)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div className="h-full bg-slate-400 rounded-full" style={{ width: `${cat.percent}%` }}></div>
                      </div>
                      <span className="text-[10px] text-slate-400 w-8 text-right font-bold font-mono">{cat.percent}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 text-xs py-16">
                  No expense records logged.<br />Outflows will compile here automatically.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
