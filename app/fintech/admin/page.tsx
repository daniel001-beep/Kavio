'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { useSession } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase-client';
import AuditLogsTable from '@/app/components/AuditLogsTable';
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
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

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

  const loadAdminDataSilently = async () => {
    try {
      const res = await fetch('/api/admin/dashboard?_t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
        setTransactionsList(data.transactions || []);
        setAuditLogsList(data.auditLogs || []);
        setTotalUsers(data.totalUsers || 0);
        setTotalTransactions(data.totalTransactions || 0);
      }
    } catch (err) {
      console.error('Admin Dashboard background sync failed:', err);
    }
  };

  useEffect(() => {
    if (session?.user?.isAdmin) {
      loadAdminData();
    }
  }, [session]);

  // Supabase Presence: Track all online users in real-time
  useEffect(() => {
    if (!supabase || !session?.user?.email) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: session.user.email,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineEmails = Object.keys(state).map(email => email.toLowerCase().trim());
        console.log('[Presence] Sync - Online users:', onlineEmails);
        setOnlineUsers(onlineEmails);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await channel.track({
              online_at: new Date().toISOString(),
              email: session.user.email,
            });
          } catch (trackErr) {
            console.warn('Failed to track admin presence:', trackErr);
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  // Real-time subscription to audit_log, transaction, and user tables
  useEffect(() => {
    if (!supabase || !session?.user?.isAdmin) return;

    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_log' },
        async (payload) => {
          console.log('[Admin Realtime] Audit log changed:', payload.eventType, payload.new);
          loadAdminDataSilently();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transaction' },
        async (payload) => {
          console.log('[Admin Realtime] Transaction changed:', payload.eventType, payload.new);
          loadAdminDataSilently();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user' },
        async (payload) => {
          console.log('[Admin Realtime] User registration changed:', payload.eventType, payload.new);
          loadAdminDataSilently();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
              {usersList.map((user) => {
                const isCurrentUser = user.email.toLowerCase().trim() === session?.user?.email?.toLowerCase().trim();
                const isOnline = isCurrentUser || onlineUsers.includes(user.email.toLowerCase().trim());

                return (
                  <div 
                    key={user.id} 
                    className={`p-4 transition-colors flex items-center justify-between gap-4 ${
                      isCurrentUser 
                        ? 'bg-emerald-50/20 hover:bg-emerald-50/30 border-l-4 border-emerald-500' 
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 uppercase ${
                          isOnline 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {user.email.substring(0, 2)}
                        </div>
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5 truncate">
                          {user.name || 'Anonymous Tenant'}
                          {user.isAdmin && (
                            <span className="px-1.5 py-0.5 text-[9px] font-black text-blue-700 bg-blue-50 border border-blue-100 rounded-sm">
                              ADMIN
                            </span>
                          )}
                          {isCurrentUser && (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-sm uppercase tracking-wide">
                              Online (You)
                            </span>
                          )}
                          {!isCurrentUser && isOnline && (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-sm uppercase tracking-wide">
                              Online
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
                );
              })}
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
        <div className="mt-8">
          <AuditLogsTable />
        </div>

      </div>
    </DashboardLayout>
  );
}
