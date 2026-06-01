'use client';

import React from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, PackageSearch } from 'lucide-react';

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not logged in or not admin
  if (status === 'unauthenticated') {
    router.push('/auth/signin?callbackUrl=/fintech/admin/orders');
    return null;
  }

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Ensure only admins can view this page
  if (!session?.user?.isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 bg-rose-500/10 rounded-sm border border-rose-500/20 mb-6">
            <ShieldAlert className="w-12 h-12 text-rose-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Access Denied</h1>
          <p className="text-slate-400 max-w-md">
            You do not have administrative privileges to view this page. Ensure you are signed in with the authorized admin email.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Mock data for what people ordered
  const recentOrders = [
    { id: 'ORD-8910', user: 'alice.smith@example.com', service: 'AI Fraud Detection', date: '2026-05-05', status: 'Provisioned', price: '$0.50/1M txn' },
    { id: 'ORD-8909', user: 'bob.jones@techcorp.com', service: 'Multi-Currency Engine', date: '2026-05-04', status: 'Pending', price: '$2,990/mo' },
    { id: 'ORD-8908', user: 'c.davis@invest.org', service: 'Digital ID Verification', date: '2026-05-02', status: 'Provisioned', price: '$2.50/verify' },
    { id: 'ORD-8907', user: 'mark.w@fintechstart.io', service: 'Cash Flow Forecaster', date: '2026-05-01', status: 'Failed', price: '$2,490/mo' },
    { id: 'ORD-8906', user: 'alice.smith@example.com', service: 'Transaction Processor', date: '2026-04-28', status: 'Provisioned', price: '$1,950/mo' },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-fuchsia-500/10 rounded-sm border border-fuchsia-500/20">
            <PackageSearch className="w-8 h-8 text-fuchsia-500" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-100">Admin Console: Orders</h1>
            <p className="text-slate-400 mt-1">Review and manage customer service provisioning</p>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-900 border border-slate-700 rounded-sm overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-100">Recent Service Orders</h2>
          <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-sm border border-slate-700">
            Showing last 30 days
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700">
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Order ID</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer Email</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Provisioned Service</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Pricing</th>
                <th className="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-5 px-6 font-mono text-slate-500 text-xs uppercase">{order.id}</td>
                  <td className="py-5 px-6 font-medium text-slate-300">{order.user}</td>
                  <td className="py-5 px-6">
                    <span className="text-slate-100 font-bold text-sm">{order.service}</span>
                  </td>
                  <td className="py-5 px-6 text-slate-400 text-sm">{order.date}</td>
                  <td className="py-5 px-6 text-right font-mono text-sm text-cyan-400">{order.price}</td>
                  <td className="py-5 px-6 text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-bold border ${
                      order.status === 'Provisioned' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      order.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
