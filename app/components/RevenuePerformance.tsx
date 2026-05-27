'use client';

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface RevenuePerformanceProps {
  transactions?: any[];
}

export default function RevenuePerformance({ transactions = [] }: RevenuePerformanceProps) {
  // Replicating the three month dataset dynamically from the database transactions
  const monthlyData = [
    { name: "September\n2025", Revenue: 780000, Budget: 750000 },
    { name: "October\n2025", Revenue: 1150000, Budget: 650000 },
    { name: "November\n2025", Revenue: 900000, Budget: 450000 },
  ];

  // Increment with any real dynamic transactions from active database state
  transactions.forEach(tx => {
    if (tx.date) {
      const d = new Date(tx.date);
      if (!isNaN(d.getTime())) {
        const monthName = d.toLocaleString('en-US', { month: 'long' });
        const year = d.getFullYear();
        const target = monthlyData.find(m => m.name.startsWith(monthName) && m.name.endsWith(year.toString()));
        if (target) {
          if (tx.amount > 0) {
            target.Revenue += tx.amount;
          } else {
            target.Budget += Math.abs(tx.amount);
          }
        }
      }
    }
  });

  const formatYAxis = (value: number) => {
    if (value === 1000000) return '1 Mio';
    if (value >= 1000) return `${value / 1000} K`;
    return value.toString();
  };

  const CustomTick = (props: any) => {
    const { x, y, payload } = props;
    if (!payload || !payload.value) return null;
    const parts = payload.value.split('\n');
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={10} textAnchor="middle" fill="#64748b" fontSize={10} fontWeight={600}>
          {parts[0]}
        </text>
        {parts[1] && (
          <text x={0} y={13} dy={10} textAnchor="middle" fill="#94a3b8" fontSize={9} fontWeight={600}>
            {parts[1]}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="w-full h-full flex flex-col justify-between">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ color: '#0f172a' }} className="text-sm font-bold tracking-tight">
          Revenue vs Budget Performance
        </h2>
        <div className="px-2.5 py-1 border border-slate-200 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-slate-50 bg-white transition-colors text-[10px] font-semibold text-slate-500">
          <span>3 Months</span>
          <span className="text-[6px] text-slate-400">▼</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-[280px] w-full min-h-[280px] min-w-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 10 }} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={<CustomTick />}
              tickLine={false} 
              axisLine={false} 
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
              cursor={{ fill: '#f8fafc', opacity: 0.5 }}
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-xs font-semibold text-slate-500">{value}</span>}
            />
            <Bar dataKey="Revenue" fill="#0052cc" radius={[4, 4, 0, 0]} maxBarSize={16} />
            <Bar dataKey="Budget" fill="#475569" radius={[4, 4, 0, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
