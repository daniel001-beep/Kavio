'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

const data1M = [
  { name: '1W', value: 2750000 },
  { name: '2W', value: 2780000 },
  { name: '3W', value: 2810000 },
  { name: '4W', value: 2847392 },
];

const data3M = [
  { name: 'Month 1', value: 2600000 },
  { name: 'Month 2', value: 2710000 },
  { name: 'Month 3', value: 2847392 },
];

const dataYTD = [
  { name: 'Jan', value: 2400000 },
  { name: 'Feb', value: 2550000 },
  { name: 'Mar', value: 2680000 },
  { name: 'Apr', value: 2750000 },
  { name: 'May', value: 2847392 },
];

const data1Y = [
  { name: 'Jun', value: 2200000 },
  { name: 'Jul', value: 2250000 },
  { name: 'Aug', value: 2310000 },
  { name: 'Sep', value: 2280000 },
  { name: 'Oct', value: 2350000 },
  { name: 'Nov', value: 2420000 },
  { name: 'Dec', value: 2500000 },
  { name: 'Jan', value: 2400000 },
  { name: 'Feb', value: 2550000 },
  { name: 'Mar', value: 2680000 },
  { name: 'Apr', value: 2750000 },
  { name: 'May', value: 2847392 },
];

type TimeRange = '1M' | '3M' | 'YTD' | '1Y';

export default function PortfolioPerformance() {
  const [timeRange, setTimeRange] = useState<TimeRange>('YTD');

  const getData = () => {
    switch (timeRange) {
      case '1M': return data1M;
      case '3M': return data3M;
      case 'YTD': return dataYTD;
      case '1Y': return data1Y;
      default: return dataYTD;
    }
  };

  const currentData = getData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-sm shadow-xl">
          <p className="text-slate-400 text-xs mb-1 font-semibold">{label}</p>
          <p className="text-slate-100 font-bold font-mono">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Performance</h2>
        </div>
        <div className="flex bg-slate-800 rounded-sm p-1 border border-slate-700">
          {['1M', '3M', 'YTD', '1Y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as TimeRange)}
              className={"px-4 py-1 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors " + (timeRange === range ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200')}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={currentData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#64748b" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => "$" + (val / 1000000).toFixed(1) + "M"}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
