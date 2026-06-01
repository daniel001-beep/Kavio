'use client';

import React from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { ShieldAlert, Users, CreditCard, Activity, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminRootPage() {
  const adminModules = [
    {
      title: 'Order Reconciliation',
      description: 'Review and approve pending wire transfers, venture debt drawdowns, and crypto staking allocations.',
      icon: CreditCard,
      href: '/fintech/admin/orders',
      status: 'Action Required',
      statusColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    },
    {
      title: 'User Management',
      description: 'Audit user KYC/AML status, freeze suspicious accounts, and manage API keys.',
      icon: Users,
      href: '/fintech/admin/users',
      status: 'Healthy',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'System Health',
      description: 'Monitor Supabase database load, Vercel Edge function latency, and API webhook failures.',
      icon: Activity,
      href: '/fintech/api-status',
      status: 'Optimal',
      statusColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    }
  ];

  return (
    <DashboardLayout>
      <div className="animate-in fade-in duration-500 pt-4">
        
        {/* Header */}
        <div className="mb-12 border-b border-slate-800 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-rose-500/10 rounded-sm border border-rose-500/20">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-100 tracking-tight">Super Admin Hub</h1>
              <p className="text-slate-400 mt-1">Restricted Access: Root privileges granted.</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-sm">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Authenticated As</p>
            <p className="text-sm font-mono text-emerald-400">idowuisdaniel1@gmail.com</p>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link 
                href={module.href} 
                key={module.title}
                className="block group bg-slate-900 border border-slate-700 rounded-sm p-6 hover:border-slate-500 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Icon className="w-24 h-24" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-sm">
                      <Icon className="w-6 h-6 text-slate-300" />
                    </div>
                    <span className={"text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm border " + module.statusColor}>
                      {module.status}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-blue-400 transition-colors">
                    {module.title}
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    {module.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm font-bold text-slate-300 group-hover:text-blue-400 transition-colors">
                    Access Module <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </DashboardLayout>
  );
}
