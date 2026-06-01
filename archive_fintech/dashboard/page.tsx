'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Activity, Info, Globe } from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import AssetAllocation from '@/app/components/AssetAllocation';
import PortfolioPerformance from '@/app/components/PortfolioPerformance';
import AnalyticsDashboard from '@/app/components/AnalyticsDashboard';
import AuditTimeline from '@/app/components/AuditTimeline';

export default function DashboardPage() {
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'NGN'>('USD');

  // Exchange rates relative to USD (Mocked for demo)
  const exchangeRates = {
    USD: 1,
    EUR: 0.92,
    NGN: 1450.50,
  };

  const formatCurrency = (usdValue: number) => {
    const rate = exchangeRates[currency];
    const converted = usdValue * rate;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: currency === 'NGN' ? 0 : 2,
    }).format(converted);
  };

  // Base USD Values
  const totalBalanceUsd = 2847392.50;
  const netPositionUsd = 485920.00;
  const dayChangeUsd = 12430.00;

  // Portfolio stat cards
  const statCards = [
    {
      label: 'Total Balance',
      value: formatCurrency(totalBalanceUsd),
      subtext: "+" + formatCurrency(dayChangeUsd) + " today",
      icon: TrendingUp,
      color: '#22c55e',
    },
    {
      label: 'Net Position',
      value: "+" + formatCurrency(netPositionUsd),
      subtext: '+20.58% overall return',
      icon: TrendingUp,
      color: '#22c55e',
    },
    {
      label: 'Active Market Value',
      value: formatCurrency(totalBalanceUsd * 0.82), // 82% is actively deployed
      subtext: '82% capital deployment',
      icon: Activity,
      color: '#3b82f6',
    },
  ];

  // Top holdings (Base USD values)
  const topHoldings = [
    { asset: 'Apple Inc.', ticker: 'AAPL', usdValue: 845200, change: '+2.4%', isPositive: true, weight: '29.7%' },
    { asset: 'US Treasury Bond', ticker: 'US10Y', usdValue: 650000, change: '+0.1%', isPositive: true, weight: '22.8%' },
    { asset: 'Microsoft Corp.', ticker: 'MSFT', usdValue: 420100, change: '-1.2%', isPositive: false, weight: '14.7%' },
    { asset: 'Ethereum', ticker: 'ETH', usdValue: 280000, change: '+5.8%', isPositive: true, weight: '9.8%' },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full animate-in fade-in duration-500">
        
        {/* Header Area with Multi-Currency Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-slate-100 mb-2 tracking-tight">Executive Dashboard</h1>
            <p className="text-slate-400">Welcome back. Here's your real-time portfolio analysis.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-lg">
            <Globe className="w-5 h-5 text-slate-400 ml-2" />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="bg-slate-800 text-slate-100 font-bold border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="NGN">NGN - Nigerian Naira</option>
            </select>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-col md:grid md:grid-cols-3 gap-6 mb-8 mt-6 md:mt-0">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-slate-900 border border-slate-700 rounded-sm p-6 relative overflow-hidden group hover:border-slate-600 transition-colors"
              >
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Icon size={120} />
                </div>
                
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <p className="text-slate-400 font-semibold text-sm uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <div 
                    className="p-2 rounded-sm"
                    style={{ backgroundColor: stat.color + '15' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold text-slate-100 font-mono mb-1">
                    {stat.value}
                  </h3>
                  <p className="text-xs font-semibold" style={{ color: stat.color }}>
                    {stat.subtext}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="flex flex-col gap-8 mt-4">
          
          {/* High-Fidelity Analytics Suite */}
          <div className="bg-slate-900 border border-slate-700 rounded-sm p-6 md:p-8 relative overflow-hidden">
            <h2 className="text-2xl font-bold text-slate-100 mb-8 relative z-10">Analytics Suite</h2>
            <AnalyticsDashboard />
          </div>

          {/* Performance Chart */}
          <div className="bg-slate-900 border border-slate-700 rounded-sm p-6 md:p-8 h-[450px]">
            <PortfolioPerformance />
          </div>

          {/* Asset Allocation Section */}
          <div className="bg-slate-900 border border-slate-700 rounded-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-100">Asset Allocation</h2>
              <div className="text-xs font-medium text-slate-400 bg-slate-800 px-3 py-1 rounded-sm border border-slate-700">
                Updated Real-time
              </div>
            </div>
            <AssetAllocation />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Holdings Table */}
            <div className="bg-slate-900 border border-slate-700 rounded-sm overflow-hidden h-fit">
              <div className="p-6 md:p-8 border-b border-slate-800 bg-slate-900/50">
                <h2 className="text-2xl font-bold text-slate-100">Top Holdings</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-800/50">
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Asset</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Ticker</th>
                      <th className="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Value</th>
                      <th className="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {topHoldings.map((holding) => (
                      <tr key={holding.ticker} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-5 px-6 text-slate-200 font-semibold">{holding.asset}</td>
                        <td className="py-5 px-6">
                          <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded-sm text-xs font-mono">{holding.ticker}</span>
                        </td>
                        <td className="py-5 px-6 text-right font-mono text-slate-100">{formatCurrency(holding.usdValue)}</td>
                        <td className="py-5 px-6 text-right font-mono text-slate-400">{holding.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Trail Timeline */}
            <div className="bg-slate-900 border border-slate-700 rounded-sm overflow-hidden p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-100">Immutable Audit Trail</h2>
                  <p className="text-xs text-slate-400 mt-1">Cryptographically verified logs</p>
                </div>
                <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-sm border border-emerald-500/20">
                  RLS Active
                </div>
              </div>
              <AuditTimeline />
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
