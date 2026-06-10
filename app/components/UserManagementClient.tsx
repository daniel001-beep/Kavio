'use client';

import React, { useState } from 'react';
import { Users, Search, Filter, Shield, MoreVertical, Ban, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  kyc: string;
  lastLogin: string;
}

interface UserManagementClientProps {
  initialUsers: User[];
}

export default function UserManagementClient({ initialUsers }: UserManagementClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = initialUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Active': return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-sm uppercase tracking-wider">Active</span>;
      case 'Suspended': return <span className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-sm uppercase tracking-wider">Suspended</span>;
      default: return <span className="px-2 py-1 bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold rounded-sm uppercase tracking-wider">{status}</span>;
    }
  };

  const getKycBadge = (kyc: string) => {
    switch(kyc) {
      case 'Verified': return <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold uppercase"><CheckCircle2 className="w-3 h-3" /> Verified</div>;
      case 'Pending': return <div className="flex items-center gap-1 text-amber-400 text-xs font-bold uppercase"><AlertTriangle className="w-3 h-3" /> Pending</div>;
      case 'Failed': return <div className="flex items-center gap-1 text-rose-400 text-xs font-bold uppercase"><Ban className="w-3 h-3" /> Failed</div>;
      default: return null;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pt-4 pb-20 md:pb-8">
      
      {/* Navigation & Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link href="/fintech/admin" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-4 font-bold">
            <ArrowLeft className="w-4 h-4" /> Back to Super Admin Hub
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-sm border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight">User Management</h1>
              <p className="text-sm text-slate-400 mt-1">Audit accounts, verify KYC, and manage platform access.</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-900 border border-slate-700 text-slate-200 text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            Invite User
          </button>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: initialUsers.length.toString(), color: 'text-blue-400' },
          { label: 'Active Today', value: initialUsers.filter(u => u.status === 'Active').length.toString(), color: 'text-emerald-400' },
          { label: 'KYC Pending', value: initialUsers.filter(u => u.kyc === 'Pending').length.toString(), color: 'text-amber-400' },
          { label: 'Suspended', value: initialUsers.filter(u => u.status === 'Suspended').length.toString(), color: 'text-rose-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-sm">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">{stat.label}</p>
            <p className={"text-2xl font-mono font-bold " + stat.color}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-t-sm p-4 flex flex-col sm:flex-row gap-4 justify-between items-center relative z-10">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by name, email, or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-sm py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="bg-slate-900 border-x border-b border-slate-800 rounded-b-sm overflow-x-auto w-full">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800">
              <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-1/4">User</th>
              <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role & ID</th>
              <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
              <th className="text-left py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">KYC / AML</th>
              <th className="text-right py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Login</th>
              <th className="w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-200 text-sm group-hover:text-blue-400 transition-colors">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <p className="text-sm font-bold text-slate-300">{user.role}</p>
                  <p className="text-[10px] font-mono text-slate-600">{user.id}</p>
                </td>
                <td className="py-4 px-6">
                  {getStatusBadge(user.status)}
                </td>
                <td className="py-4 px-6">
                  {getKycBadge(user.kyc)}
                </td>
                <td className="py-4 px-6 text-right">
                  <p className="text-sm text-slate-400 font-medium">{user.lastLogin}</p>
                </td>
                <td className="py-4 px-6 text-right">
                  <button className="p-2 hover:bg-slate-800 rounded-sm transition-colors text-slate-500 hover:text-slate-300">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                  No real users found matching "{searchQuery}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
