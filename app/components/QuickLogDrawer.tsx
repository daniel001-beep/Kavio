'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Wallet, ArrowUpRight, ArrowDownRight, Loader, CheckCircle2 } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  type: string;
}

interface QuickLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuickLogDrawer({ isOpen, onClose, onSuccess }: QuickLogDrawerProps) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAccountsLoading(true);
      fetch('/api/business')
        .then(res => res.json())
        .then(data => {
          if (data.accounts && data.accounts.length > 0) {
            setAccounts(data.accounts);
            setAccountId(data.accounts[0].id);
          }
        })
        .catch(err => console.error("Failed to load accounts in drawer:", err))
        .finally(() => setAccountsLoading(false));

      setAmount('');
      setType('expense');
      setCategory('');
      setDescription('');
      setSuccess(false);
      setError('');

      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 200);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!accountId) {
      setError('Please select an account');
      return;
    }
    if (!category.trim()) {
      setError('Please type a category');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type,
          category: category.trim(),
          accountId,
          description: description.trim() || `${type.charAt(0).toUpperCase() + type.slice(1)} transaction`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit transaction');
      }

      setSuccess(true);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
      />

      {/* Drawer Body */}
      <div className="relative w-full max-w-md bg-white border-l border-slate-200/80 h-full flex flex-col p-8 shadow-2xl z-10 animate-in slide-in-from-right duration-300 text-slate-900 font-sans">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
            <Plus className="w-5 h-5 text-blue-600" />
            Quick Log Transaction
          </h2>
          <p className="text-sm text-slate-450 mt-1 font-medium">Record a cash flow item instantly inside the double-entry engine.</p>
        </div>

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-300">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
            <h3 className="text-xl font-bold text-slate-850">Transaction Recorded</h3>
            <p className="text-sm text-slate-450">Perfectly balanced entries created in ledger.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-600">
                  {error}
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 inset-y-0 flex items-center text-2xl font-bold text-slate-400">$</span>
                  <input
                    ref={amountInputRef}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-10 pr-4 text-3xl font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                    required
                  />
                </div>
              </div>

              {/* Transaction Type */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Flow Direction</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border font-bold text-sm transition-all duration-200 cursor-pointer ${
                      type === 'expense'
                        ? 'bg-rose-50 border-rose-500 text-rose-600'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/60'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    Money Out
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border font-bold text-sm transition-all duration-200 cursor-pointer ${
                      type === 'income'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/60'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Money In
                  </button>
                </div>
              </div>

              {/* Manual Category Entry */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Software, Consulting, Marketing, Rent"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                />
              </div>

              {/* Account Dropdown */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Business Account</label>
                {accountsLoading ? (
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-400 flex items-center justify-center gap-2">
                    <Loader className="w-4 h-4 animate-spin text-blue-500" />
                    Retrieving Accounts...
                  </div>
                ) : (
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none font-semibold"
                    required
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Memo / Description</label>
                <input
                  type="text"
                  placeholder="e.g. AWS hosting invoice, retainer"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-colors cursor-pointer border border-slate-200/50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 disabled:text-slate-450 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  'Save Item'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
