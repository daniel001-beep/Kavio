'use client';

import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { BookOpen, Search, Filter, Download, ArrowUpRight, ArrowDownRight, RefreshCw, Layers } from 'lucide-react';
import SendMoneyCard from '@/app/components/SendMoneyCard';

interface Transaction {
  id: string;
  type: string;
  description: string;
  date: string;
  amount: number;
  status: string;
}

export default function LedgerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load from local storage or use initial data
  React.useEffect(() => {
    const saved = localStorage.getItem('velox_transactions');
    if (saved) {
      setTransactions(JSON.parse(saved));
    } else {
      const initial: Transaction[] = [
        { id: 'TXN-1042', type: 'DEPOSIT', description: 'Wire Transfer from Chase', date: '2026-05-08', amount: 150000.00, status: 'COMPLETED' },
        { id: 'TXN-1041', type: 'BUY', description: 'NVIDIA Corp NVDA x100', date: '2026-05-07', amount: -85000.00, status: 'COMPLETED' },
        { id: 'TXN-1040', type: 'TRANSFER', description: 'Internal Vault Transfer', date: '2026-05-06', amount: -25000.00, status: 'COMPLETED' },
        { id: 'TXN-1039', type: 'DIVIDEND', description: 'Apple Inc AAPL Quarterly', date: '2026-05-05', amount: 3450.50, status: 'COMPLETED' },
        { id: 'TXN-1038', type: 'EXCHANGE', description: 'USD to EUR Conversion', date: '2026-05-04', amount: -12000.00, status: 'PENDING' },
        { id: 'TXN-1037', type: 'SELL', description: 'Tesla Inc TSLA x50', date: '2026-05-03', amount: 9500.00, status: 'COMPLETED' },
        { id: 'TXN-1036', type: 'FEE', description: 'Monthly Platform Fee', date: '2026-05-01', amount: -49.99, status: 'COMPLETED' },
        { id: 'TXN-1035', type: 'DEPOSIT', description: 'ACH Transfer from BoA', date: '2026-04-28', amount: 10000.00, status: 'COMPLETED' },
        { id: 'TXN-1034', type: 'BUY', description: 'US Treasury Bond 10Y', date: '2026-04-26', amount: -50000.00, status: 'COMPLETED' },
        { id: 'TXN-1033', type: 'DIVIDEND', description: 'Vanguard Real Estate ETF', date: '2026-04-25', amount: 840.25, status: 'COMPLETED' },
      ];
      setTransactions(initial);
      localStorage.setItem('velox_transactions', JSON.stringify(initial));
    }
  }, []);

  const handleTransferSuccess = (txHash: string, email: string, amount: string, note: string) => {
    const newTx: Transaction = {
      id: "TXN-" + txHash.substring(0, 4).toUpperCase(), // Fake ID based on hash
      type: 'TRANSFER',
      description: "Transfer to " + email + (note ? " (" + note + ")" : ""),
      date: new Date().toISOString().split('T')[0],
      amount: -parseFloat(amount), // Negative because it's a transfer out
      status: 'COMPLETED',
    };
    // Prepend to array and save to local storage
    setTransactions(prev => {
      const updated = [newTx, ...prev];
      localStorage.setItem('velox_transactions', JSON.stringify(updated));
      // Dispatch a custom event so the Dashboard can pick it up if needed
      window.dispatchEvent(new Event('velox_transactions_updated'));
      return updated;
    });
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            tx.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'ALL' || tx.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, typeFilter, transactions]);

  const formatCurrency = (value: number) => {
    const isNegative = value < 0;
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(value));
    
    return isNegative ? "-" + formatted : "+" + formatted;
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PENDING': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'FAILED': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getTypeIcon = (type: string, amount: number) => {
    if (amount > 0) return <ArrowDownRight className="w-4 h-4 text-emerald-500" />;
    if (amount < 0) return <ArrowUpRight className="w-4 h-4 text-rose-500" />;
    return <RefreshCw className="w-4 h-4 text-blue-500" />;
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-10 border-b border-slate-800 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-4 bg-blue-500/10 rounded-sm border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)] mt-1">
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight leading-tight">Smart Ledger</h1>
            <p className="text-sm md:text-base text-slate-400 mt-2 max-w-md">Real-time transaction history and automated reconciliation</p>
          </div>
        </div>
      </div>

      {/* Atomic Transfer Engine */}
      <div className="mb-12 flex justify-center w-full">
        <SendMoneyCard onTransferSuccess={handleTransferSuccess} />
      </div>
      
      <div className="bg-slate-900 border border-slate-700 rounded-sm overflow-hidden animate-in fade-in duration-500">
        
        {/* Controls Bar */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by ID or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-sm text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-sm px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Types</option>
                <option value="DEPOSIT">Deposits</option>
                <option value="BUY">Purchases</option>
                <option value="SELL">Sales</option>
                <option value="TRANSFER">Transfers</option>
                <option value="DIVIDEND">Dividends</option>
                <option value="EXCHANGE">Exchanges</option>
              </select>
            </div>
          </div>

        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto min-h-[400px] w-full">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-slate-800/30">
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Transaction ID</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Details</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-semibold">No transactions found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-4 px-6">
                      <span className="font-mono text-slate-500 text-xs uppercase tracking-wider group-hover:text-blue-400 transition-colors cursor-pointer">
                        {tx.id}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-sm bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                          {getTypeIcon(tx.type, tx.amount)}
                        </div>
                        <div>
                          <p className="text-slate-200 text-sm font-bold">{tx.description}</p>
                          <p className="text-slate-500 text-xs font-semibold tracking-wider mt-0.5">{tx.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-sm font-medium">{tx.date}</td>
                    <td className="py-4 px-6 text-right">
                      <span className={"font-mono font-bold text-sm " + (tx.amount > 0 ? 'text-emerald-400' : 'text-slate-100')}>
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={"inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest border " + getStatusColor(tx.status)}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between text-sm text-slate-500">
          <p>Showing <span className="font-bold text-slate-300">{filteredTransactions.length}</span> of <span className="font-bold text-slate-300">{transactions.length}</span> transactions</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-sm transition-colors disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-sm transition-colors">Next</button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
