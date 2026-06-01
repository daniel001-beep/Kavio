'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Activity, CheckCircle, ServerCrash } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function APIStatusPage() {
  const [latencyData, setLatencyData] = useState<any[]>([]);

  useEffect(() => {
    // Generate mock latency data for the last 60 minutes
    const data = [];
    const now = new Date();
    for (let i = 60; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000);
      data.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        latency: Math.floor(Math.random() * (15 - 5 + 1) + 5), // Random latency between 5 and 15ms
      });
    }
    setLatencyData(data);
  }, []);

  const apiEndpoints = [
    { name: 'Portfolio Analysis API', latency: '8.3ms', status: 'healthy' },
    { name: 'Multi-Currency Engine', latency: '5.1ms', status: 'healthy' },
    { name: 'Transaction Processor', latency: '12.4ms', status: 'healthy' },
    { name: 'Risk Management API', latency: '15.2ms', status: 'healthy' },
    { name: 'Settlement Engine', latency: '9.8ms', status: 'healthy' },
    { name: 'Reconciliation Service', latency: '18.5ms', status: 'healthy' },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8 border-b border-slate-800 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-sm border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-100 tracking-tight">System Status</h1>
            <p className="text-slate-400 mt-1">Real-time system health and global endpoint latency</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest">All Systems Normal</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 animate-in fade-in duration-500">
        
        {/* Latency Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-sm overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-100">Global API Latency</h2>
            <span className="text-xs font-mono text-slate-500">Last 60 Minutes</span>
          </div>
          <div className="p-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  minTickGap={30}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => val + "ms"}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px' }}
                  itemStyle={{ color: '#06b6d4', fontWeight: 'bold', fontFamily: 'monospace' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorLatency)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Uptime Stats */}
        <div className="bg-slate-900 border border-slate-700 rounded-sm flex flex-col justify-center items-center p-8 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">30-Day Uptime</p>
          <h2 className="text-6xl font-bold text-slate-100 mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            99.99<span className="text-3xl text-emerald-500">%</span>
          </h2>
          <p className="text-sm text-slate-500 font-medium max-w-xs mt-4">
            Zero recorded downtime in the last 30 days. Next scheduled maintenance window is in 14 days.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
        {apiEndpoints.map((endpoint) => (
          <div key={endpoint.name} className="bg-slate-900 border border-slate-700 rounded-sm p-6 hover:bg-slate-800 transition-all duration-200 group">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-2 bg-slate-800 rounded-sm border border-slate-700 group-hover:border-slate-600 transition-colors">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                </div>
                <div>
                  <p className="font-bold text-slate-100">{endpoint.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-sm"></div>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{endpoint.status}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-lg text-cyan-400 font-bold">{endpoint.latency}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">latency</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
