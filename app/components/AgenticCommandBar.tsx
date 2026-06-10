'use client';

import React, { useState, useEffect } from 'react';
import { Search, Terminal, FileText, Download, TrendingUp, X, CheckCircle2 } from 'lucide-react';

export default function AgenticCommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');

  // Handle Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsProcessing(true);
    setResult('');

    // Mock "Agentic" processing delay
    setTimeout(() => {
      setIsProcessing(false);
      const q = query.toLowerCase();
      if (q.includes('export') || q.includes('csv')) {
        setResult('Action executed: Generated Q1_Ledger_Export.csv securely via RLS.');
      } else if (q.includes('find') || q.includes('1000')) {
        setResult('Action executed: Filtered ledger to show 14 transactions over $1,000.');
      } else {
        setResult('Action executed: Query parsed and routed to autonomous agent pipeline.');
      }
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Command Input */}
        <form onSubmit={handleSubmit} className="relative border-b border-slate-800">
          <Terminal className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-500" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Agentic Command Center: 'Export Q1 ledger to CSV'..."
            className="w-full bg-transparent border-none py-6 pl-16 pr-12 text-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-0"
          />
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors bg-slate-800 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </form>

        {/* Results / Processing State */}
        <div className="p-4 bg-slate-900/50">
          {isProcessing ? (
            <div className="flex items-center gap-3 px-4 py-6 text-slate-400">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-mono text-sm tracking-wide">Agent processing intent...</span>
            </div>
          ) : result ? (
            <div className="flex items-start gap-3 px-4 py-6 text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="font-mono text-sm font-bold tracking-wide">{result}</p>
            </div>
          ) : (
            <div>
              <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Suggested Commands</p>
              <div className="space-y-1">
                <button onClick={() => setQuery('Export Q1 ledger to CSV')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors text-left group">
                  <Download className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span className="text-sm font-medium">Export Q1 ledger to CSV</span>
                </button>
                <button onClick={() => setQuery('Find all transactions over $1,000')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors text-left group">
                  <Search className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  <span className="text-sm font-medium">Find all transactions over $1,000</span>
                </button>
                <button onClick={() => setQuery('Analyze Q2 cash flow forecast')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors text-left group">
                  <TrendingUp className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  <span className="text-sm font-medium">Analyze Q2 cash flow forecast</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">↵</kbd>
              <span>to execute</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">ESC</kbd>
              <span>to close</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Powered by Autonomous Agents</span>
        </div>
      </div>
    </div>
  );
}


