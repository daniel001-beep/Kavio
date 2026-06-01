'use client';

import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';

interface AssetClass {
  name: string;
  percentage: number;
  color: string;
  value: number;
}

const assets: AssetClass[] = [
  { name: 'Equities', percentage: 42, color: '#3b82f6', value: 1195000 },
  { name: 'Fixed Income', percentage: 28, color: '#06b6d4', value: 797000 },
  { name: 'Real Estate', percentage: 12, color: '#8b5cf6', value: 341000 },
  { name: 'Commodities', percentage: 10, color: '#f59e0b', value: 284000 },
  { name: 'Cash', percentage: 8, color: '#94a3b8', value: 227000 },
];

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  const pathStr = "M" + sx + "," + sy + "L" + mx + "," + my + "L" + ex + "," + ey;
  const percentStr = ((percent * 100).toFixed(2)) + "%";

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#f1f5f9" className="text-xl font-bold">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        fill={fill}
      />
      <path d={pathStr} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#cbd5e1" className="text-sm font-semibold">
        {percentStr}
      </text>
    </g>
  );
};

const AssetAllocation: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8">
      <div className="w-full lg:w-1/2 h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={assets}
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={120}
              dataKey="value"
              onMouseEnter={onPieEnter}
              stroke="none"
            >
              {assets.map((entry, index) => (
                <Cell key={"cell-" + index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(val: number) => formatCurrency(val)}
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px' }}
              itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {assets.map((asset, index) => (
          <div 
            key={asset.name} 
            className={"p-4 rounded-sm border transition-all duration-300 cursor-pointer " + (activeIndex === index ? 'bg-slate-800 border-slate-600 shadow-lg' : 'bg-slate-900 border-slate-800 hover:bg-slate-800/50')}
            onMouseEnter={() => setActiveIndex(index)}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ backgroundColor: asset.color }}
              ></div>
              <span className="text-sm font-bold text-slate-300 uppercase tracking-wide">{asset.name}</span>
            </div>
            <p className="text-2xl font-bold text-slate-100 mb-1">{asset.percentage}%</p>
            <p className="text-sm font-medium text-slate-500">{formatCurrency(asset.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetAllocation;
