"use client";

import React, { useEffect, useState } from "react";
import { Users, CreditCard, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/app/context/AuthContext";

export default function EmployerDashboard() {
  const { data: session } = useSession();
  
  // Dummy data for the prototype until we connect to actual DB routes
  const stats = [
    {
      title: "Total Workers",
      value: "12",
      icon: Users,
      trend: "+2 this month",
      trendUp: true,
    },
    {
      title: "Amount Due (Next 30 Days)",
      value: "$8,450.00",
      icon: Calendar,
      trend: "+$1,200 from last month",
      trendUp: true,
    },
    {
      title: "Paid This Month",
      value: "$12,300.00",
      icon: CreditCard,
      trend: "-$400 from last month",
      trendUp: false,
    },
    {
      title: "Overdue Payments",
      value: "$0.00",
      icon: TrendingUp,
      trend: "All caught up!",
      trendUp: true,
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Employer Dashboard</h1>
        <p className="text-slate-500 mt-2 font-medium">Manage your workers and track your payroll.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-slate-200 shadow-sm rounded-2xl overflow-hidden group hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50">
                <CardTitle className="text-sm font-bold text-slate-600">
                  {stat.title}
                </CardTitle>
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {stat.value}
                </div>
                <div className="mt-2 flex items-center text-xs font-semibold">
                  {stat.trendUp ? (
                    <ArrowUpRight className="w-3 h-3 text-emerald-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-rose-500 mr-1" />
                  )}
                  <span className={stat.trendUp ? "text-emerald-600" : "text-rose-600"}>
                    {stat.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
          <Card className="border-slate-200 shadow-sm rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No recent activity</h3>
            <p className="text-slate-500 mt-2 max-w-sm">When you add workers or make payments, your activity will show up here.</p>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
          <Card className="border-slate-200 shadow-sm rounded-3xl p-6">
            <div className="space-y-4">
              <button className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-200">
                <Users className="w-4 h-4" />
                Add New Worker
              </button>
              <button className="w-full py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" />
                Record Payment
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
