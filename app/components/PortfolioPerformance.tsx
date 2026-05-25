'use client';

import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface PortfolioPerformanceProps {
  transactions?: any[];
  totalBalance?: number;
}

export default function PortfolioPerformance({ transactions = [], totalBalance }: PortfolioPerformanceProps) {
  // Group transactions by day of the week dynamically
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weeklyData = [
    { name: 'Monday', value: 0 },
    { name: 'Tuesday', value: 0 },
    { name: 'Wednesday', value: 0 },
    { name: 'Thursday', value: 0 },
    { name: 'Friday', value: 0 },
    { name: 'Saturday', value: 0 },
    { name: 'Sunday', value: 0 },
  ];

  transactions.forEach(tx => {
    if (tx.date) {
      const d = new Date(tx.date);
      if (!isNaN(d.getTime())) {
        const dayName = daysOfWeek[d.getDay()];
        const target = weeklyData.find(w => w.name === dayName);
        if (target) {
          // Sum the absolute value of transactions (GMV movement!)
          target.value += Math.abs(tx.amount);
        }
      }
    }
  });

  const hasData = weeklyData.some(w => w.value > 0);
  const data = hasData ? weeklyData : [
    { name: 'Monday', value: 0 },
    { name: 'Tuesday', value: 0 },
    { name: 'Wednesday', value: 0 },
    { name: 'Thursday', value: 0 },
    { name: 'Friday', value: 0 },
    { name: 'Saturday', value: 0 },
    { name: 'Sunday', value: 0 },
  ];

  const formatYAxis = (value: number) => {
    if (value === 1000000) return '1 Mio';
    if (value >= 1000) return `${value / 1000} K`;
    return value.toString();
  };

  return (
    <div className="w-full h-full flex flex-col justify-between">
      {/* Header bar from screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 cursor-pointer group">
          <h2 style={{ color: '#0f172a' }} className="text-base font-bold group-hover:text-blue-600 transition-colors">
            Gross Merchandise Value (GMV)
          </h2>
          <span className="text-[10px] text-slate-400">▼</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
          <span className="text-slate-400">Transaction Activity</span>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-[280px] w-full min-h-[280px] min-w-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0052cc" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#0052cc" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#64748b" 
              fontSize={11} 
              fontWeight={500} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11} 
              fontWeight={500} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={formatYAxis} 
              dx={-5}
            />
            <Tooltip 
              cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-blue-500 flex items-center gap-1 animate-in zoom-in-95 duration-100">
                      <span>+{(payload[0].value as number).toLocaleString()}</span>
                      <span className="text-[10px] opacity-80">(+22.25%)</span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#0052cc" 
              fillOpacity={1} 
              fill="url(#colorValue)" 
              strokeWidth={3}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#0052cc' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
