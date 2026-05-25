'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { useSession } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  Users, 
  ArrowLeftRight, 
  Trash2, 
  ShieldCheck, 
  UserPlus, 
  TrendingUp, 
  Activity,
  AlertCircle
} from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  isAdmin: boolean;
  createdAt: string | null;
}

interface Transaction {
  id: string;
  amount: string;
  status: string;
  createdAt: string;
  metadata: {
    client_name?: string;
    description?: string;
  };
  userId: string;
  userName: string | null;
  userEmail: string | null;
}

interface AuditLog {
  id: string;
  userId: string | null;
  eventType: string;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
  userName: string | null;
  userEmail: string | null;
  metadata?: any;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [usersList, setUsersList] = useState<User[]>([]);
  const [transactionsList, setTransactionsList] = useState<Transaction[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<AuditLog[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Authentication protection
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/fintech/admin');
    }
  }, [status, router]);

  // Load Admin Console Data
  const loadAdminData = async () => {
    try {
      setLoadingData(true);
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
        setTransactionsList(data.transactions || []);
        setAuditLogsList(data.auditLogs || []);
        setTotalUsers(data.totalUsers || 0);
        setTotalTransactions(data.totalTransactions || 0);
      } else {
        const err = await res.json();
        setActionError(err.error || 'Failed to fetch admin statistics');
      }
    } catch (err: any) {
      console.error(err);
      setActionError('Network error loading administrative dashboard');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (session?.user?.isAdmin) {
      loadAdminData();
    }
  }, [session]);

  // Delete User handler
  const handleDeleteUser = async (userId: string, email: string) => {
    const confirmDelete = window.confirm(
      `⚠️ WARNING: Are you sure you want to permanently delete user "${email}"?\n\nThis will completely purge their account, transactions, and double-entry ledger entries from the system.`
    );
    if (!confirmDelete) return;

    try {
      setActionError(null);
      setActionSuccess(null);
      const res = await fetch(`/api/admin/dashboard?id=${userId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`User "${email}" and all associated financial books have been successfully deleted.`);
        loadAdminData(); // Refresh metrics
      } else {
        setActionError(data.error || 'Failed to delete user');
      }
    } catch (err: any) {
      setActionError(err.message || 'An error occurred during deletion');
    }
  };

  if (status === 'loading' || (session?.user?.isAdmin && loadingData && usersList.length === 0)) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-semibold animate-pulse">Initializing Administrative Secure Console...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Restrict access
  if (!session?.user?.isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/25 mb-6 animate-bounce">
            <ShieldAlert className="w-12 h-12 text-rose-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">Access Restrained</h1>
          <p className="text-slate-500 max-w-md text-sm">
            Administrative privileges required. Please verify that your active user account is logged in with authorized credentials.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-full tracking-wider uppercase">
                Enterprise Core
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-9 h-9 text-blue-600" />
              Admin Console
            </h1>
            <p className="text-slate-400 text-sm mt-1">Audit platform accounts, track dynamic registrations, and monitor ledger activities</p>
          </div>
        </div>

        {/* Success/Error Alerts */}
        {actionSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-start gap-3 text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Action Completed</p>
              <p className="mt-0.5 text-xs text-emerald-600/90">{actionSuccess}</p>
            </div>
          </div>
        )}
        {actionError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Security / Database Warning</p>
              <p className="mt-0.5 text-xs text-rose-600/90">{actionError}</p>
            </div>
          </div>
        )}

        {/* Statistical Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex items-center gap-5">
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Registrations</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{totalUsers}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Active Tenant Organizations</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex items-center gap-5">
            <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/50">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform Ledger Entries</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{totalTransactions}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Double-Entry Audit Trails</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex items-center gap-5">
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/50">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Status</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">OPERATIONAL</h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time isolation enabled</p>
            </div>
          </div>

        </div>

        {/* Main Administrative Views Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* USER ACCOUNTS MANAGEMENT PANEL */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Active Platform Tenants
              </h2>
              <p className="text-slate-400 text-xs mt-1">Manage tenant users and enforce account clean-up tools</p>
            </div>
            
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {usersList.map((user) => (
                <div key={user.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0 uppercase">
                      {user.email.substring(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {user.name || 'Anonymous Tenant'}
                        {user.isAdmin && (
                          <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-black text-blue-700 bg-blue-50 border border-blue-100 rounded-sm">
                            ADMIN
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteUser(user.id, user.email)}
                    disabled={user.email === session?.user?.email}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={user.email === session?.user?.email ? "Cannot delete yourself" : "Delete Account and purge transactions"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* AUDIT LOG: PLATFORM TRANSACTIONS MONITOR */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
                Ledger Activity Audit Log
              </h2>
              <p className="text-slate-400 text-xs mt-1">Audit who made transactions and track live financial flows</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User/Tenant</th>
                    <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Details</th>
                    <th className="py-3 px-6 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactionsList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-slate-400 text-sm">
                        No transactions registered on the platform yet.
                      </td>
                    </tr>
                  ) : (
                    transactionsList.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-4 px-6 min-w-[200px]">
                          <div className="font-bold text-slate-800 text-sm truncate">
                            {tx.userName || 'Anonymous'}
                          </div>
                          <div className="text-xs text-slate-400 truncate">{tx.userEmail}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-slate-700 text-sm font-semibold">
                            {tx.metadata?.client_name || 'B2B Client'}
                          </div>
                          <div className="text-xs text-slate-400 truncate max-w-[220px]">
                            {tx.metadata?.description || 'Invoice Payment'}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-sm font-black text-emerald-600">
                          ${(Number(tx.amount) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* LIVE SYSTEM AUDIT & EVENTS TRACKER (LOGINS, SIGNUPS, AND TRANSACTIONS) */}
        <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden flex flex-col mt-8">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span className="text-blue-600 font-bold">🛡️</span>
                Platform Access & Real-Time Event Audit Logs
              </h2>
              <p className="text-slate-400 text-xs mt-1">Live tracking of who logs in, registers accounts, or processes ledger transactions</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Security Monitor</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User/Tenant</th>
                  <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action / Event</th>
                  <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location (IP)</th>
                  <th className="py-3 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Device Info (UA)</th>
                  <th className="py-3 px-6 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {auditLogsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                      No system security audit events registered yet.
                    </td>
                  </tr>
                ) : (
                  auditLogsList.map((log) => {
                    // Friendly formatting for action badge
                    let badgeClass = 'bg-slate-50 text-slate-600 border-slate-100';
                    let label = log.eventType;
                    if (log.eventType === 'USER_LOGIN') {
                      badgeClass = 'bg-blue-50 text-blue-600 border-blue-100';
                      label = '🔑 User Login';
                    } else if (log.eventType === 'USER_SIGNUP') {
                      badgeClass = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                      label = '✨ Account Created';
                    } else if (log.eventType === 'TRANSACTION_CREATED') {
                      badgeClass = 'bg-indigo-50 text-indigo-600 border-indigo-100';
                      label = '💸 Transaction Made';
                    } else if (log.eventType === 'admin_action' || log.eventType === 'admin_access') {
                      badgeClass = 'bg-purple-50 text-purple-600 border-purple-100';
                      label = `🛡️ Admin Action`;
                    }

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-3.5 px-6 min-w-[200px]">
                          <div className="font-bold text-slate-700">
                            {log.userName || 'System Agent'}
                          </div>
                          <div className="text-[10px] text-slate-400">{log.userEmail || 'system@velox.com'}</div>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`px-2.5 py-1 text-[9px] font-bold rounded-full border ${badgeClass} uppercase tracking-wider`}>
                            {label}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-mono text-[10px] text-slate-500">
                          {log.ipAddress || 'unknown'}
                        </td>
                        <td className="py-3.5 px-6 max-w-[200px] truncate text-[10px] text-slate-400 font-medium" title={log.userAgent || 'unknown'}>
                          {log.userAgent || 'unknown'}
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono text-[10px] text-slate-400 font-bold">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
