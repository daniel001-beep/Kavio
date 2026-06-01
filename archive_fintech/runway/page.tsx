'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Calculator, TrendingDown, TrendingUp, Users, Megaphone, ShieldCheck, Activity } from 'lucide-react';

export default function RunwaySimulatorPage() {
  const [baseCapital, setBaseCapital] = useState(4250000);
  const [baseBurn, setBaseBurn] = useState(200000);
  
  // Scenarios
  const [hireEngineers, setHireEngineers] = useState(false);
  const [marketingPush, setMarketingPush] = useState(false);
  const [useVeloxYield, setUseVeloxYield] = useState(true);

  // Calculations
  const engineersCost = hireEngineers ? 45000 : 0;
  const marketingCost = marketingPush ? 25000 : 0;
  
  // 5% APY on remaining capital roughly translates to monthly offset
  const yieldOffset = useVeloxYield ? (baseCapital * 0.05) / 12 : 0;

  const totalMonthlyBurn = baseBurn + engineersCost + marketingCost - yieldOffset;
  const monthsRemaining = totalMonthlyBurn > 0 ? baseCapital / totalMonthlyBurn : 999;
  
  // Calculate Death Date
  const deathDate = new Date();
  deathDate.setMonth(deathDate.getMonth() + monthsRemaining);

  return (
    <DashboardLayout>
      <div className="pt-4 animate-in fade-in duration-500 max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
              <Calculator className="w-8 h-8 text-blue-500" />
              Runway & Burn Simulator
            </h1>
            <p className="text-slate-400 mt-2">Dynamically model your startup's survival based on hiring, marketing, and Velox yield.</p>
          </div>
          
          <div className="bg-slate-900 border border-slate-700 px-6 py-4 rounded-sm shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-sm flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Live Burn Rate</p>
              <p className="text-xl font-bold text-rose-400 font-mono">
                ${Math.max(0, totalMonthlyBurn).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-sm text-slate-500 font-sans">/mo</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-sm shadow-lg">
              <h2 className="text-lg font-bold text-slate-100 mb-6 border-b border-slate-800 pb-4">Base Financials</h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Treasury</label>
                    <span className="text-sm font-mono text-slate-200">${baseCapital.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min="500000" 
                    max="10000000" 
                    step="100000"
                    value={baseCapital}
                    onChange={(e) => setBaseCapital(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Base Operational Burn</label>
                    <span className="text-sm font-mono text-rose-400">${baseBurn.toLocaleString()}/mo</span>
                  </div>
                  <input 
                    type="range" 
                    min="50000" 
                    max="1000000" 
                    step="10000"
                    value={baseBurn}
                    onChange={(e) => setBaseBurn(Number(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-700 p-6 rounded-sm shadow-lg">
              <h2 className="text-lg font-bold text-slate-100 mb-6 border-b border-slate-800 pb-4">Growth Scenarios</h2>
              
              <div className="space-y-4">
                {/* Scenario 1 */}
                <div 
                  className={`flex items-center justify-between p-4 rounded-sm border cursor-pointer transition-all ${hireEngineers ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  onClick={() => setHireEngineers(!hireEngineers)}
                >
                  <div className="flex items-center gap-3">
                    <Users className={`w-5 h-5 ${hireEngineers ? 'text-blue-400' : 'text-slate-500'}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-200">Hire 3 Senior Engineers</p>
                      <p className="text-xs text-slate-500">Accelerate product roadmap</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-rose-400 font-bold">+$45k</p>
                    <p className="text-[10px] text-slate-500">/mo</p>
                  </div>
                </div>

                {/* Scenario 2 */}
                <div 
                  className={`flex items-center justify-between p-4 rounded-sm border cursor-pointer transition-all ${marketingPush ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  onClick={() => setMarketingPush(!marketingPush)}
                >
                  <div className="flex items-center gap-3">
                    <Megaphone className={`w-5 h-5 ${marketingPush ? 'text-blue-400' : 'text-slate-500'}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-200">Aggressive Marketing</p>
                      <p className="text-xs text-slate-500">Paid ads & conferences</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-rose-400 font-bold">+$25k</p>
                    <p className="text-[10px] text-slate-500">/mo</p>
                  </div>
                </div>

                {/* Scenario 3: Velox Yield */}
                <div 
                  className={`flex items-center justify-between p-4 rounded-sm border cursor-pointer transition-all ${useVeloxYield ? 'bg-emerald-900/20 border-emerald-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  onClick={() => setUseVeloxYield(!useVeloxYield)}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className={`w-5 h-5 ${useVeloxYield ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-200">Enable Velox T-Bill Yield</p>
                      <p className="text-xs text-slate-500">Earn 5% APY on idle cash</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-emerald-400 font-bold">-${yieldOffset.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    <p className="text-[10px] text-slate-500">offset/mo</p>
                  </div>
                </div>

              </div>
            </div>
            
          </div>

          {/* Right Column: Visualizer */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-sm shadow-2xl relative overflow-hidden h-full flex flex-col justify-center">
              
              {/* Background gradient warning if low runway */}
              <div className={`absolute inset-0 opacity-10 transition-colors duration-1000 ${monthsRemaining < 12 ? 'bg-gradient-to-t from-rose-600 to-transparent' : 'bg-gradient-to-t from-emerald-600 to-transparent'}`} />

              <div className="relative z-10 text-center mb-12">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Projected Runway</p>
                
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h2 className={`text-7xl font-black font-mono tracking-tighter ${monthsRemaining < 12 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {monthsRemaining === 999 ? '∞' : monthsRemaining.toFixed(1)}
                  </h2>
                  <span className="text-2xl font-bold text-slate-500 mt-6">Months</span>
                </div>
                
                {monthsRemaining !== 999 && (
                  <p className="text-lg font-medium text-slate-300 mt-4 bg-slate-950/50 inline-block px-6 py-2 rounded-sm border border-slate-800">
                    Estimated Zero-Cash Date: <span className="font-bold text-white">{deathDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </p>
                )}
              </div>

              <div className="relative z-10">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  <span>Today</span>
                  <span>Zero Cash</span>
                </div>
                <div className="h-4 w-full bg-slate-950 rounded-sm border border-slate-800 overflow-hidden relative">
                  <div 
                    className={`absolute left-0 top-0 bottom-0 transition-all duration-1000 ${monthsRemaining < 12 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (monthsRemaining / 36) * 100)}%` }}
                  />
                  {/* Milestones markers */}
                  <div className="absolute left-1/3 top-0 bottom-0 border-l border-slate-900/50" title="1 Year" />
                  <div className="absolute left-2/3 top-0 bottom-0 border-l border-slate-900/50" title="2 Years" />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-600 mt-2">
                  <span className="w-1/3 text-left"></span>
                  <span className="w-1/3 text-center border-l border-slate-800 pl-1">12 Mo</span>
                  <span className="w-1/3 text-right border-l border-slate-800 pl-1">24 Mo</span>
                </div>
              </div>
              
              {/* Insight Box */}
              <div className="mt-12 bg-slate-950 border border-slate-800 p-6 rounded-sm relative z-10 flex gap-4 items-start">
                {useVeloxYield ? (
                  <TrendingUp className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-rose-400 shrink-0 mt-1" />
                )}
                <div>
                  <h4 className="text-sm font-bold text-slate-200 mb-1">Founder Insight</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {useVeloxYield 
                      ? `By keeping capital in Velox Treasury, you are offsetting your burn by $${yieldOffset.toLocaleString(undefined, { maximumFractionDigits: 0 })} every single month. This automatically extends your runway by ${(monthsRemaining - (baseCapital / (totalMonthlyBurn + yieldOffset))).toFixed(1)} months without raising more equity.`
                      : "Your capital is currently earning 0% yield. Enabling Velox T-Bill sweeps would significantly reduce your effective monthly burn rate."}
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
