'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Sparkles, Plus } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTransactionModal({ isOpen, onClose, onSuccess }: AddTransactionModalProps) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('Consulting');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const amountRef = useRef<HTMLInputElement>(null);

  // Auto-focus amount field when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        amountRef.current?.focus();
      }, 100);
      setError('');
      setAmount('');
      setDescription('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const amountVal = parseFloat(amount);
      const amountCents = Math.floor(amountVal * 100);
      const duplicatePreventionKey = `manual_${Date.now()}_${Math.random()}`;

      const res = await fetch('/api/ledger/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Duplicate-Prevention-Key': duplicatePreventionKey,
        },
        body: JSON.stringify({
          amount: type === 'expense' ? -amountCents : amountCents,
          description: description || `${type.charAt(0).toUpperCase() + type.slice(1)} Entry`,
          metadata: {
            client_name: 'Manual Entry',
            category: category,
            type: type,
          },
          status: 'Paid', // Instantly completed manual logging
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to post transaction.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Light Blur Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/10 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container: High-Contrast Minimalist Light Design */}
      <div className="relative bg-white border border-slate-200 rounded-[24px] shadow-2xl w-full max-w-md mx-4 p-8 z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Log Transaction
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">$</span>
              <input
                ref={amountRef}
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono font-bold text-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder-slate-300"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* 2. Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                  type === 'income'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
                disabled={isSubmitting}
              >
                🟢 Income
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                  type === 'expense'
                    ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
                disabled={isSubmitting}
              >
                🔴 Expense
              </button>
            </div>
          </div>

          {/* 3. Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              disabled={isSubmitting}
            >
              <option value="Consulting">Consulting Services</option>
              <option value="Software">Software & SaaS</option>
              <option value="Marketing">Marketing & Ads</option>
              <option value="Workspace">Rent & Office</option>
              <option value="Legal">Legal & Finance</option>
              <option value="Travel">Travel & Lodging</option>
              <option value="Hardware">Equipment & Gadgets</option>
              <option value="Tax">Taxes & Fees</option>
            </select>
          </div>

          {/* 4. Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Description</label>
            <input
              type="text"
              placeholder="e.g. Q2 Consulting Agreement"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder-slate-300"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold rounded-xl text-xs transition-all active:scale-95"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/10 hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save Transaction</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
