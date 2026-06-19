"use client";

import React from "react";
import { TrendingUp, DollarSign, Users, Activity, BarChart3, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart as RechartsPieChart, Pie } from 'recharts';

export default function AnalyticsPage() {
  const payrollData = [
    { name: 'Jan', amount: 8400 },
    { name: 'Feb', amount: 9200 },
    { name: 'Mar', amount: 8900 },
    { name: 'Apr', amount: 10500 },
    { name: 'May', amount: 11200 },
    { name: 'Jun', amount: 12300 },
  ];

  const distributionData = [
    { name: 'Freelancers', value: 4500, color: '#10b981' }, // emerald-500
    { name: 'Contractors', value: 5800, color: '#3b82f6' }, // blue-500
    { name: 'Employees', value: 2000, color: '#8b5cf6' },   // violet-500
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics</h1>
        <p className="text-slate-500 mt-2 font-medium">Deep dive into your payroll expenses and workforce trends.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-emerald-50">
            <CardTitle className="text-sm font-bold text-emerald-900">Total Payroll YTD</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-black text-slate-900">$60,500.00</div>
            <p className="text-xs font-semibold text-emerald-600 mt-2">+15% vs last year</p>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-blue-50">
            <CardTitle className="text-sm font-bold text-blue-900">Avg Cost per Worker</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-black text-slate-900">$1,025.00</div>
            <p className="text-xs font-semibold text-blue-600 mt-2">Based on 12 active workers</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-violet-50">
            <CardTitle className="text-sm font-bold text-violet-900">On-Time Payment Rate</CardTitle>
            <Activity className="w-4 h-4 text-violet-600" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-black text-slate-900">98.5%</div>
            <p className="text-xs font-semibold text-violet-600 mt-2">Excellent standing</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="col-span-1 lg:col-span-2 border-slate-200 shadow-sm rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Payroll Growth Trend</h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={payrollData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value}`, 'Payroll']}
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Cost Distribution</h2>
          </div>
          <div className="h-[240px] w-full flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`$${value}`, 'Amount']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {distributionData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">${item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Inline AreaChart component to avoid another import issue just in case
import { AreaChart, Area } from 'recharts';
