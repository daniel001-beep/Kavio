'use client';

import React, { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Calculator, TrendingDown, TrendingUp, Users, Megaphone, ShieldCheck, Activity, Landmark } from 'lucide-react';

interface RunwayClientProps {
  initialTransactions?: any[];
}

export default function RunwayClient({ initialTransactions = [] }: RunwayClientProps) {
  const [transactions, setTransactions] = useState<any[]>(initialTransactions);

  // Load from cache on mount and fetch fresh data from API
  useEffect(() => {
    // 1. First, if initialTransactions has data, seed state
    if (initialTransactions && initialTransactions.length > 0) {
      setTransactions(initialTransactions);
    }

    // 2. Load from localStorage cache
    let targetEmail = typeof window !== 'undefined' ? localStorage.getItem('velox_last_active_user_email') : null;
    if (targetEmail) {
      const cached = localStorage.getItem(`velox_cached_api_transactions_${targetEmail}`) || 
                     localStorage.getItem(`velox_last_active_cached_api_transactions`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            setTransactions(parsed);
          }
        } catch (e) {}
      }
    }

    // 3. Fetch fresh transactions from API in background to ensure correct balance
    const fetchTransactions = async () => {
      try {
        const res = await fetch('/api/ledger/transaction?_t=' + Date.now(), { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map((tx: any) => {
              const amountInDollars = Number(tx.amount || 0) / 100;
              return {
                id: tx.id?.toString(),
                type: amountInDollars > 0 ? 'CREDIT' : 'DEBIT',
                amount: amountInDollars,
                description: tx.metadata?.description || tx.description || 'Transaction',
                date: tx.createdAt ? new Date(tx.createdAt).toLocaleString() : new Date().toLocaleString(),
                status: tx.status?.toUpperCase() || 'COMPLETED',
              };
            });
            setTransactions(mapped);
          }
        }
      } catch (err) {
        console.error('RunwayClient: Failed to fetch transactions in background:', err);
      }
    };
    fetchTransactions();
  }, [initialTransactions]);

  // Calculate actual live ledger financials
  const liveCashBalance = useMemo(() => {
    return transactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
  }, [transactions]);

  const liveBurnRate = useMemo(() => {
    // Find absolute sum of all outflows (debits) in the ledger
    const outflows = transactions.filter(tx => tx.amount < 0);
    return outflows.reduce((acc, tx) => acc + Math.abs(tx.amount || 0), 0);
  }, [transactions]);

  // Set simulation states, defaulting to live database ledger values!
  // If database ledger is empty, fallback to clean baseline defaults ($150,000.00 cash, $16,600.00 burn)
  const defaultCash = liveCashBalance > 0 ? liveCashBalance : 150000;
  const defaultBurn = liveBurnRate > 0 ? liveBurnRate : 16600;

  const [baseCapital, setBaseCapital] = useState(defaultCash);
  const [baseBurn, setBaseBurn] = useState(defaultBurn);
  
  // Simulation Scenarios
  const [hireEngineers, setHireEngineers] = useState(false);
  const [marketingPush, setMarketingPush] = useState(false);
  const [useYieldSweep, setUseYieldSweep] = useState(true);

  // Scenario Incremental Adjustments
  const engineersCost = hireEngineers ? 15000 : 0;
  const marketingCost = marketingPush ? 8000 : 0;
  const yieldOffset = useYieldSweep ? (baseCapital * 0.05) / 12 : 0;

  // Real-Time Math Calculations
  const totalMonthlyBurn = baseBurn + engineersCost + marketingCost - yieldOffset;
  const monthsRemaining = totalMonthlyBurn > 0 ? baseCapital / totalMonthlyBurn : 999;
  
  // Calculate Zero Cash Projection Date
  const deathDate = new Date();
  deathDate.setMonth(deathDate.getMonth() + (monthsRemaining === 999 ? 120 : monthsRemaining));

  return (
    <DashboardLayout>
      <div className="pt-4 px-0 xs:px-2 sm:px-4 animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-black text-blue-600 tracking-tight flex items-center gap-3">
              <Calculator className="w-8 h-8" />
              Master Runway Simulator
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">Live runway intelligence modelling startup survival on top of your actual transaction ledger.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto mt-4 sm:mt-0">
            <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] shadow-sm flex items-center gap-3.5 sm:gap-4 w-full sm:min-w-[200px]">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 border border-blue-100 rounded-lg shrink-0 flex items-center justify-center">
                <Landmark className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">Live Cash Reserves</p>
                <p className="text-xs sm:text-sm font-bold text-slate-800 font-mono truncate">
                  ${liveCashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] shadow-sm flex items-center gap-3.5 sm:gap-4 w-full sm:min-w-[200px]">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-rose-50 border border-rose-100 rounded-lg shrink-0 flex items-center justify-center">
                <Activity className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-rose-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">Live Burn Rate</p>
                <p className="text-xs sm:text-sm font-bold text-rose-600 font-mono truncate">
                  ${liveBurnRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Interactive Simulation Sliders */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Sliders Container */}
            <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm space-y-6 p-4 xs:p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-800">Adjust Base Parameters</h2>
                <button 
                  onClick={() => { setBaseCapital(defaultCash); setBaseBurn(defaultBurn); }}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg"
                >
                  Reset to Actuals
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Target Cash Capital</label>
                    <span className="text-sm font-mono font-bold text-slate-700">${baseCapital.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <input 
                    type="range" 
                    min="5000" 
                    max="10000000" 
                    step="5000"
                    value={baseCapital}
                    onChange={(e) => setBaseCapital(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-1">
                    <span>$5k</span>
                    <span>$5M</span>
                    <span>$10M</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Base Monthly Burn</label>
                    <span className="text-sm font-mono font-bold text-rose-600">${baseBurn.toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo</span>
                  </div>
                  <input 
                    type="range" 
                    min="1000" 
                    max="1000000" 
                    step="1000"
                    value={baseBurn}
                    onChange={(e) => setBaseBurn(Number(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-1">
                    <span>$1k</span>
                    <span>$500k</span>
                    <span>$1M</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Scenario Checkboxes */}
            <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm space-y-4 p-4 xs:p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-4">Simulate Growth Scenarios</h2>
              
              <div className="space-y-3">
                {/* Option 1: Hire Engineers */}
                <div 
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${hireEngineers ? 'bg-blue-50/50 border-blue-500' : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'}`}
                  onClick={() => setHireEngineers(!hireEngineers)}
                >
                  <div className="flex items-center gap-3">
                    <Users className={`w-5 h-5 ${hireEngineers ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-700">Hire 2 Growth Engineers</p>
                      <p className="text-xs text-slate-400 font-medium">Accelerate technical growth</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-rose-600 font-bold">+$15,000</p>
                    <p className="text-[10px] text-slate-400 font-semibold">/mo</p>
                  </div>
                </div>

                {/* Option 2: Marketing Push */}
                <div 
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${marketingPush ? 'bg-blue-50/50 border-blue-500' : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'}`}
                  onClick={() => setMarketingPush(!marketingPush)}
                >
                  <div className="flex items-center gap-3">
                    <Megaphone className={`w-5 h-5 ${marketingPush ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-700">Aggressive Ads Push</p>
                      <p className="text-xs text-slate-400 font-medium">Paid acquisition & branding</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-rose-600 font-bold">+$8,000</p>
                    <p className="text-[10px] text-slate-400 font-semibold">/mo</p>
                  </div>
                </div>

                {/* Option 3: T-Bill Sweep Yield */}
                <div 
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${useYieldSweep ? 'bg-emerald-50/50 border-emerald-500' : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'}`}
                  onClick={() => setUseYieldSweep(!useYieldSweep)}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className={`w-5 h-5 ${useYieldSweep ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-700">Enable T-Bill Sweep Yield</p>
                      <p className="text-xs text-slate-400 font-medium">Sweep cash into 5% yield</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-emerald-600 font-bold">-${yieldOffset.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">offset/mo</p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>

          {/* Right Column: Visual Runway Graph & Metrics */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm relative overflow-hidden h-full flex flex-col justify-center p-4 xs:p-6 sm:p-8 md:p-10">
              
              <div className="relative z-10 text-center mb-12">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Consolidated Projected Runway</p>
                
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h2 className={`text-7xl font-black font-mono tracking-tighter ${monthsRemaining < 12 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {monthsRemaining === 999 ? '∞' : monthsRemaining.toFixed(1)}
                  </h2>
                  <span className="text-2xl font-bold text-slate-400 mt-6">Months</span>
                </div>
                
                {monthsRemaining !== 999 && (
                  <p className="text-sm font-semibold text-slate-600 mt-4 bg-slate-50 border border-slate-200 inline-block px-6 py-2.5 rounded-lg">
                    Estimated Zero-Cash Date: <span className="font-bold text-blue-600">{deathDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </p>
                )}
              </div>

              {/* Progress timeline */}
              <div className="relative z-10">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  <span>Today</span>
                  <span>Zero Cash</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full border border-slate-200 overflow-hidden relative">
                  <div 
                    className={`absolute left-0 top-0 bottom-0 transition-all duration-1000 ${monthsRemaining < 12 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (monthsRemaining / 24) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                  <span className="w-1/3 text-left"></span>
                  <span className="w-1/3 text-center border-l border-slate-200 pl-1">12 Mo</span>
                  <span className="w-1/3 text-right border-l border-slate-200 pl-1">24 Mo</span>
                </div>
              </div>
              
              {/* Insight Box */}
              <div className="mt-12 bg-slate-50 border border-slate-200 p-6 rounded-xl relative z-10 flex gap-4 items-start">
                {useYieldSweep ? (
                  <TrendingUp className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-rose-500 shrink-0 mt-1" />
                )}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Audit-Ready Financial Intelligence</h4>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                    {useYieldSweep 
                      ? `By keeping capital swept in T-Bills, you earn $${yieldOffset.toLocaleString(undefined, { maximumFractionDigits: 0 })} in yield monthly. This extends your runway by ${(monthsRemaining - (baseCapital / (totalMonthlyBurn + yieldOffset))).toFixed(1)} months without dilution!`
                      : "Your capital is currently earning 0% yield. Enabling Treasury sweeps would immediately decrease your effective burn rate."}
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
