'use client';

import React, { useState, useEffect } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight, Download, ArrowRightLeft, Loader } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
}

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      if (res.ok && data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error("Failed to load transactions list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    const handleRefresh = () => {
      fetchTransactions();
    };
    window.addEventListener('transaction-created', handleRefresh);
    return () => window.removeEventListener('transaction-created', handleRefresh);
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const openLogDrawer = () => {
    window.dispatchEvent(new Event('open-quick-log'));
  };

  const handleExport = () => {
    setExporting(true);
    const fileData = JSON.stringify(transactions, null, 2);
    const blob = new Blob([fileData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `velox-bank-mutation-ledger-${new Date().toISOString().slice(0,10)}.json`;
    link.href = url;
    link.click();
    setTimeout(() => setExporting(false), 500);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === 'all') return true;
    return tx.type === activeTab;
  });

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center flex-col gap-4">
        <Loader className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Retrieving bank mutations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-400">
      {/* Top action header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bank Mutation & Ledger</h1>
          <p className="text-slate-500 text-sm">Review full historical records and balance ledger entries.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleExport}
            disabled={exporting || transactions.length === 0}
            className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-400" />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
          <button 
            onClick={openLogDrawer}
            className="flex-2 md:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] shadow-md shadow-blue-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Log Transaction
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-between items-center">
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/40">
          {[
            { id: 'all', label: 'All Mutations' },
            { id: 'income', label: 'Inflow (+)' },
            { id: 'expense', label: 'Outflow (-)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* High-contrast White Ledger Grid */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm shadow-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">
              <tr>
                <th className="px-8 py-5">Transaction Details</th>
                <th className="px-8 py-5">Category Mapping</th>
                <th className="px-8 py-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 text-slate-700">
              {filteredTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors group">
                  <td className="px-8 py-4.5">
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                      }`}>
                        {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{tx.description}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{tx.date}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4.5">
                    <span className="px-3 py-1 rounded-full text-xs font-bold capitalize bg-slate-50 border border-slate-150 text-slate-500">
                      {tx.category}
                    </span>
                  </td>
                  <td className={`px-8 py-4.5 text-right font-extrabold text-sm ${
                    tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                  }`}>
                    {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTransactions.length === 0 && (
          <div className="p-20 text-center text-slate-400 text-xs">
            No bank mutations recorded for this view.<br />
            <button onClick={openLogDrawer} className="text-blue-500 hover:underline mt-2 font-bold cursor-pointer inline-block">Add an item</button>
          </div>
        )}
      </div>
    </div>
  );
}
