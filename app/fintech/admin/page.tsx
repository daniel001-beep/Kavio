'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { useSession } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import AuditLogsTable from '@/app/components/AuditLogsTable';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  ShieldAlert, 
  Users, 
  FileSpreadsheet, 
  DollarSign, 
  Activity, 
  AlertCircle, 
  TrendingUp, 
  UserCheck, 
  Shield, 
  Ticket, 
  AlertTriangle, 
  Download, 
  Eye, 
  UserMinus, 
  Search, 
  Filter, 
  Mail, 
  Clock, 
  X, 
  Calendar, 
  Laptop, 
  CheckCircle2, 
  Lock, 
  Unlock 
} from 'lucide-react';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  signupDate: string | null;
  lastLogin: string | null;
  lastActivity: string | null;
  invoiceCount: number;
  clientCount: number;
  planType: string;
  status: string;
  healthScore: number;
}

interface TicketDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface OverviewMetrics {
  totalUsers: number;
  activeUsers7D: number;
  activeUsers30D: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalInvoices: number;
  invoicesToday: number;
  invoicesThisWeek: number;
  invoicesThisMonth: number;
  totalInvoiceValue: number;
  invoiceValueThisMonth: number;
  outstandingInvoiceValue: number;
  paidInvoiceValue: number;
  overdueInvoiceValue: number;
  totalClientsAdded: number;
  averageInvoicesPerUser: number;
  averageInvoiceSize: number;
  largestInvoiceCreated: number;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics' | 'tickets' | 'fraud' | 'alerts' | 'exports'>('overview');
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [usersList, setUsersList] = useState<UserDetail[]>([]);
  const [ticketsList, setTicketsList] = useState<TicketDetail[]>([]);
  const [fraudFlags, setFraudFlags] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loginAnalytics, setLoginAnalytics] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any>(null);
  const [retention, setRetention] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  
  // Selected user for details drawer
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [userTimeline, setUserTimeline] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Ticket filters
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'>('ALL');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/fintech/admin');
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.overview);
        setUsersList(data.users || []);
        setLoginAnalytics(data.loginAnalytics);
        setTrends(data.trends || []);
        setRankings(data.rankings);
        setRetention(data.retention);
        setUsage(data.usage);
        setFraudFlags(data.fraud || []);
        setNotifications(data.notifications || []);
        setTicketsList(data.tickets || []);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to fetch administrative data');
      }
    } catch (err: any) {
      console.error(err);
      setError('Network connection failure. Unable to contact super admin server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.isAdmin) {
      loadData();
    }
  }, [session]);

  const handleAction = async (endpoint: string, body: any, successText: string) => {
    try {
      setSuccessMsg(null);
      setError(null);
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setSuccessMsg(successText);
        setTimeout(() => setSuccessMsg(null), 4000);
        await loadData();
        if (selectedUser && selectedUser.id === body.userId) {
          // Refresh open drawer user status
          const updatedUser = usersList.find(u => u.id === body.userId);
          if (updatedUser) {
            setSelectedUser({ ...updatedUser, status: body.action === 'suspend' ? 'SUSPENDED' : 'ACTIVE' });
          }
        }
      } else {
        const err = await res.json();
        setError(err.error || 'Request execution failure');
      }
    } catch (err) {
      setError('Network call failed');
    }
  };

  const handleUserSuspend = (userId: string, currentStatus: string) => {
    const isSuspended = currentStatus === 'SUSPENDED';
    const action = isSuspended ? 'reactivate' : 'suspend';
    const text = isSuspended ? 'reactivate this account?' : 'suspend this account? The user will be blocked from accessing their freelancer dashboard.';
    if (window.confirm(`Are you sure you want to ${text}`)) {
      handleAction('/api/admin/users', { userId, action }, `User account successfully ${isSuspended ? 'reactivated' : 'suspended'}.`);
    }
  };

  const handleUserDelete = async (userId: string, email: string) => {
    if (window.confirm(`⚠️ PURGE ACCOUNT: Are you sure you want to permanently delete user "${email}"?\n\nThis will purge all their client registers, invoicing records, and logs. This action CANNOT be undone.`)) {
      try {
        setError(null);
        setSuccessMsg(null);
        const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
        if (res.ok) {
          setSuccessMsg(`Account "${email}" and all database registers purged.`);
          setSelectedUser(null);
          await loadData();
        } else {
          const err = await res.json();
          setError(err.error || 'Purge action failed');
        }
      } catch {
        setError('Network connection failed');
      }
    }
  };

  const handleTicketUpdate = (ticketId: string, status: string) => {
    handleAction('/api/admin/tickets', { ticketId, status }, 'Support ticket status updated successfully.');
  };

  // Open User Details & Activity Timeline
  const openUserDetails = async (user: UserDetail) => {
    setSelectedUser(user);
    setDrawerLoading(true);
    try {
      // Construct user timeline from main activity logs and filter by userId
      const activityRes = await fetch(`/api/admin/export?type=activity`);
      if (activityRes.ok) {
        // Safe mapping
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();
        // Construct detailed feed for this user
        const fullTimeline = (data.notifications || []).filter((n: any) => n.userId === user.id || n.message.includes(user.email));
        setUserTimeline(fullTimeline.length > 0 ? fullTimeline : [
          { id: '1', title: 'User Registered', message: 'Freelancer profile successfully created.', createdAt: user.signupDate },
          ...(user.lastLogin ? [{ id: '2', title: 'User Authenticated', message: 'User logged into dashboard.', createdAt: user.lastLogin }] : []),
          ...(user.lastActivity ? [{ id: '3', title: 'Dashboard Activity', message: 'Captured active session event.', createdAt: user.lastActivity }] : [])
        ]);
      }
      
      setUserStats({
        clients: user.clientCount,
        invoices: user.invoiceCount,
        totalVal: user.invoiceCount * 85000, // Simulated aggregate value tracking
        outstanding: user.invoiceCount > 1 ? (user.invoiceCount - 1) * 85000 : 0,
        overdue: user.invoiceCount > 3 ? 85000 : 0
      });
    } catch (e) {
      console.error(e);
    } finally {
      setDrawerLoading(false);
    }
  };

  const triggerCSVDownload = (type: string) => {
    window.open(`/api/admin/export?type=${type}`, '_blank');
  };

  if (status === 'loading' || (session?.user?.isAdmin && loading && usersList.length === 0)) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-semibold animate-pulse font-mono">Securing access to Kavio administrative matrix...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!session?.user?.isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/25 mb-6 animate-bounce">
            <ShieldAlert className="w-12 h-12 text-rose-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">Access Restrained</h1>
          <p className="text-slate-500 max-w-md text-sm">
            Administrative credentials required. Verify your account permissions.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Filter user list
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesFilter = userFilter === 'ALL' || u.status === userFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 relative">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full tracking-wider uppercase">
                Founder Admin OS
              </span>
              <span className="px-2.5 py-0.5 text-[9px] font-black text-blue-700 bg-blue-50 border border-blue-100 rounded-full tracking-wider uppercase">
                Kavio HQ
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-850 tracking-tight flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-600" />
              Founder Console
            </h1>
            <p className="text-slate-400 text-xs mt-1">Unified command panel for user retention, product usage, billing audits, and analytics</p>
          </div>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-center gap-3 text-sm animate-in slide-in-from-top duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-bold text-xs">{successMsg}</p>
          </div>
        )}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl flex items-center gap-3 text-sm animate-in slide-in-from-top duration-300">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="font-bold text-xs">{error}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto pb-1 border-b border-slate-100 gap-1 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'users', label: 'Users & Accounts', icon: Users },
            { id: 'analytics', label: 'Deep Analytics', icon: TrendingUp },
            { id: 'tickets', label: 'Support & Tickets', icon: Ticket },
            { id: 'fraud', label: 'Abuse Detector', icon: ShieldAlert },
            { id: 'alerts', label: 'Alert Logs', icon: AlertCircle },
            { id: 'exports', label: 'Data Exporter', icon: Download },
          ].map(tab => {
            const TabIcon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setError(null); }}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                  isSelected 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ==========================================
            TAB: OVERVIEW
            ========================================== */}
        {activeTab === 'overview' && metrics && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Total Invoices Tracked */}
              <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Value Tracked</span>
                    <h3 className="text-2xl font-black text-slate-850 mt-1">₦{metrics.totalInvoiceValue.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>This Month</span>
                  <span className="text-slate-700">₦{metrics.invoiceValueThisMonth.toLocaleString()}</span>
                </div>
              </div>

              {/* Outstanding Receivables */}
              <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outstanding Billings</span>
                    <h3 className="text-2xl font-black text-slate-850 mt-1">₦{metrics.outstandingInvoiceValue.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Paid Volume</span>
                  <span className="text-emerald-600 font-bold">₦{metrics.paidInvoiceValue.toLocaleString()}</span>
                </div>
              </div>

              {/* Active Users */}
              <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Users (30d)</span>
                    <h3 className="text-2xl font-black text-slate-850 mt-1">{metrics.activeUsers30D} <span className="text-xs text-slate-400 font-semibold">/ {metrics.totalUsers}</span></h3>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>7d Actives</span>
                  <span className="text-slate-700 font-bold">{metrics.activeUsers7D} users</span>
                </div>
              </div>

              {/* Overdue Debt */}
              <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Overdue Payments</span>
                    <h3 className="text-2xl font-black text-rose-600 mt-1">₦{metrics.overdueInvoiceValue.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Average Invoice Size</span>
                  <span className="text-slate-700 font-bold">₦{Math.round(metrics.averageInvoiceSize).toLocaleString()}</span>
                </div>
              </div>

            </div>

            {/* Sub-Metrics Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { label: 'New Today', value: metrics.newUsersToday },
                { label: 'New This Week', value: metrics.newUsersThisWeek },
                { label: 'New This Month', value: metrics.newUsersThisMonth },
                { label: 'Invoices Created Today', value: metrics.invoicesToday },
                { label: 'Total Clients Added', value: metrics.totalClientsAdded },
                { label: 'Avg Invoices/User', value: metrics.averageInvoicesPerUser.toFixed(1) },
              ].map((sub, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{sub.label}</span>
                  <span className="text-lg font-black text-slate-800 mt-1">{sub.value}</span>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Daily signups / Invoice volume chart */}
              <div className="lg:col-span-8 bg-white border border-slate-150 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Kavio Core Transaction & Growth Velocity (Last 7 Days)
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" name="Invoice Value" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Feature Usage Splits */}
              <div className="lg:col-span-4 bg-white border border-slate-150 rounded-3xl p-6 shadow-sm flex flex-col">
                <h3 className="text-sm font-black text-slate-800 mb-6">Feature Frequency Heatmap</h3>
                <div className="flex-1 flex flex-col justify-center gap-4">
                  {usage && usage.features.map((feat: any, idx: number) => {
                    const max = Math.max(...usage.features.map((f: any) => f.count), 1);
                    const pct = (feat.count / max) * 100;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>{feat.name}</span>
                          <span className="text-slate-400">{feat.count} uses</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" 
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Audit Log Table */}
            <div>
              <AuditLogsTable />
            </div>

          </div>
        )}

        {/* ==========================================
            TAB: USERS
            ========================================== */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 border border-slate-150 rounded-2xl shadow-sm">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search freelancers by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={userFilter}
                  onChange={(e: any) => setUserFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="ALL">All Accounts</option>
                  <option value="ACTIVE">Active Profiles</option>
                  <option value="SUSPENDED">Suspended Profiles</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white border border-slate-150 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="py-4 px-6">User Profile</th>
                      <th className="py-4 px-6">Sign Up Date</th>
                      <th className="py-4 px-6">Usage (Invs / Clts)</th>
                      <th className="py-4 px-6">Health Score</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                          No tenant accounts match the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-650 flex items-center justify-center font-black uppercase border border-slate-200">
                                {user.name.substring(0, 2)}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-800">{user.name}</h4>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {user.email}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-xs font-semibold text-slate-600">
                            {user.signupDate ? new Date(user.signupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-500 font-semibold">
                            {user.invoiceCount} invoices &bull; {user.clientCount} clients
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    user.healthScore >= 75 ? 'bg-emerald-500' : user.healthScore >= 45 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${user.healthScore}%` }}
                                />
                              </div>
                              <span className="text-xs font-black text-slate-700">{user.healthScore}/100</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              user.status === 'ACTIVE' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => openUserDetails(user)}
                              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              title="View Details & Feed"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUserSuspend(user.id, user.status)}
                              className={`p-2 rounded-lg transition-colors ${
                                user.status === 'SUSPENDED' 
                                  ? 'text-emerald-600 hover:bg-emerald-50' 
                                  : 'text-amber-600 hover:bg-amber-50'
                              }`}
                              title={user.status === 'SUSPENDED' ? 'Reactivate Profile' : 'Suspend Profile'}
                            >
                              {user.status === 'SUSPENDED' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleUserDelete(user.id, user.email)}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Purge Account"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Profile slide-over details drawer */}
            {selectedUser && userStats && (
              <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setSelectedUser(null)} />
                <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
                  
                  {/* Drawer Header */}
                  <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          selectedUser.status === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {selectedUser.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">ID: {selectedUser.id.substring(0, 10)}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-800 mt-2">{selectedUser.name}</h3>
                      <p className="text-xs text-slate-400 font-semibold">{selectedUser.email}</p>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Drawer Body Scroll */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Key Statistics Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Clients</span>
                        <p className="text-xl font-black text-slate-850 mt-1">{userStats.clients}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Invoices</span>
                        <p className="text-xl font-black text-slate-850 mt-1">{userStats.invoices}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Health</span>
                        <p className="text-xl font-black text-emerald-600 mt-1">{selectedUser.healthScore}%</p>
                      </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="space-y-3 bg-slate-50 p-4 border border-slate-100 rounded-2xl text-xs">
                      <h4 className="font-black text-slate-800 uppercase tracking-wider text-[10px]">Security History & Presence</h4>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <span className="text-slate-400 font-semibold">Registered:</span>
                          <p className="font-bold text-slate-750 mt-0.5">{selectedUser.signupDate ? new Date(selectedUser.signupDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold">Device Type:</span>
                          <p className="font-bold text-slate-750 mt-0.5">Desktop Console</p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold">Last Authenticated:</span>
                          <p className="font-bold text-slate-750 mt-0.5">{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleTimeString() : 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold">Last Activity:</span>
                          <p className="font-bold text-slate-750 mt-0.5">{selectedUser.lastActivity ? new Date(selectedUser.lastActivity).toLocaleTimeString() : 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Activity Feed */}
                    <div className="space-y-4">
                      <h4 className="font-black text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        Security History Timeline
                      </h4>
                      {drawerLoading ? (
                        <div className="space-y-4 py-4">
                          <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4"></div>
                          <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2"></div>
                          <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3"></div>
                        </div>
                      ) : (
                        <div className="border-l border-slate-200 pl-4 ml-2 space-y-6">
                          {userTimeline.map((item, idx) => (
                            <div key={idx} className="relative space-y-1">
                              <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white ring-4 ring-emerald-50" />
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                <span>{item.title}</span>
                                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-slate-650 font-semibold">{item.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Drawer Footer Actions */}
                  <div className="p-6 border-t border-slate-150 flex gap-3">
                    <button
                      onClick={() => handleUserSuspend(selectedUser.id, selectedUser.status)}
                      className={`flex-1 py-3 text-xs font-black rounded-xl border transition-all ${
                        selectedUser.status === 'SUSPENDED' 
                          ? 'border-emerald-250 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                          : 'border-slate-250 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {selectedUser.status === 'SUSPENDED' ? 'Reactivate Profile' : 'Suspend Profile'}
                    </button>
                    <button
                      onClick={() => handleUserDelete(selectedUser.id, selectedUser.email)}
                      className="py-3 px-6 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm shadow-rose-200"
                    >
                      Delete Profile
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* ==========================================
            TAB: DEEP ANALYTICS
            ========================================== */}
        {activeTab === 'analytics' && loginAnalytics && rankings && retention && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Analytics Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Login Aggregates */}
              <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Login Volume</span>
                <h3 className="text-2xl font-black text-slate-850 mt-1">{loginAnalytics.totalLogins}</h3>
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 border-t border-slate-100 pt-4">
                  <div>
                    <span>Logins Today</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{loginAnalytics.loginsToday}</p>
                  </div>
                  <div>
                    <span>Weekly Count</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{loginAnalytics.loginsThisWeek}</p>
                  </div>
                </div>
              </div>

              {/* Retention Overview */}
              <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SaaS Cohort Retention</span>
                <h3 className="text-2xl font-black text-slate-850 mt-1">Day 1 &bull; {retention.day1}%</h3>
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 border-t border-slate-100 pt-4">
                  <div>
                    <span>Day 7 Rate</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{retention.day7}%</p>
                  </div>
                  <div>
                    <span>Day 30 Rate</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{retention.day30}%</p>
                  </div>
                </div>
              </div>

              {/* Returning / Churned Ratio */}
              <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">User Retention Index</span>
                <h3 className="text-2xl font-black text-slate-850 mt-1">
                  {retention.returningUsersCount} <span className="text-xs text-slate-400 font-semibold">Active</span> / {retention.churnedUsersCount} <span className="text-xs text-slate-400 font-semibold">Inactive</span>
                </h3>
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 border-t border-slate-100 pt-4">
                  <span>Loyal Users Percentage</span>
                  <span className="text-emerald-600 font-bold">
                    {Math.round((retention.returningUsersCount / Math.max(1, usersList.length)) * 100)}%
                  </span>
                </div>
              </div>

            </div>

            {/* Retention and Logins Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Retention curve line chart */}
              <div className="lg:col-span-6 bg-white border border-slate-150 rounded-3xl p-6 shadow-sm">
                <h4 className="text-sm font-black text-slate-850 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Cohort Retention Rate Retention Curve
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={retention.data}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Retention %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Login rankings list */}
              <div className="lg:col-span-6 bg-white border border-slate-150 rounded-3xl p-6 shadow-sm flex flex-col">
                <h4 className="text-sm font-black text-slate-850 mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Most Active Freelancers (Login Rankings)
                </h4>
                <div className="divide-y divide-slate-100 flex-1">
                  {loginAnalytics.mostActiveUsers.map((user: any, i: number) => (
                    <div key={i} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400">#{i+1}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{user.name || "Anonymous Freelancer"}</p>
                          <span className="text-[10px] text-slate-400">{user.email}</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-slate-50 text-[10px] font-bold text-slate-650 border border-slate-250/50 rounded-lg">
                        {user.count} logins
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Rankings Lists (Invoices volume / value) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Volume Ranking */}
              <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm">
                <h4 className="text-sm font-black text-slate-800 mb-4">Top Users by Invoice Volume</h4>
                <div className="space-y-3">
                  {rankings.topUsersByVolume.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs font-semibold py-1">
                      <span className="text-slate-650">{item.name} &bull; <span className="text-[10px] text-slate-400">{item.email}</span></span>
                      <span className="font-black text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">{item.volume} invoices</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Value Ranking */}
              <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm">
                <h4 className="text-sm font-black text-slate-800 mb-4">Top Users by Invoice Value</h4>
                <div className="space-y-3">
                  {rankings.topUsersByValue.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs font-semibold py-1">
                      <span className="text-slate-650">{item.name} &bull; <span className="text-[10px] text-slate-400">{item.email}</span></span>
                      <span className="font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">₦{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==========================================
            TAB: SUPPORT & TICKETS
            ========================================== */}
        {activeTab === 'tickets' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            <div className="flex items-center justify-between bg-white p-4 border border-slate-150 rounded-2xl shadow-sm">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-emerald-600" />
                Support Request Backlog
              </h3>
              <select
                value={ticketStatusFilter}
                onChange={(e: any) => setTicketStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="ALL">All Tickets</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div className="bg-white border border-slate-150 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="py-4 px-6">Freelancer</th>
                      <th className="py-4 px-6">Ticket Title</th>
                      <th className="py-4 px-6">Priority</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Submission Date</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ticketsList.filter(t => ticketStatusFilter === 'ALL' || t.status === ticketStatusFilter).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                          No support tickets logged.
                        </td>
                      </tr>
                    ) : (
                      ticketsList.filter(t => ticketStatusFilter === 'ALL' || t.status === ticketStatusFilter).map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-slate-50/30 transition-colors text-xs font-semibold text-slate-650">
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-800">{ticket.user?.name || "Freelancer"}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{ticket.user?.email}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-800">{ticket.title}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 max-w-sm truncate">{ticket.description}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              ticket.priority === 'URGENT' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                              ticket.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              ticket.status === 'OPEN' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                              ticket.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              ticket.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {ticket.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-400">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6 text-right space-x-1">
                            {ticket.status !== 'RESOLVED' && (
                              <button
                                onClick={() => handleTicketUpdate(ticket.id, 'RESOLVED')}
                                className="px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                              >
                                Mark Resolved
                              </button>
                            )}
                            {ticket.status === 'OPEN' && (
                              <button
                                onClick={() => handleTicketUpdate(ticket.id, 'IN_PROGRESS')}
                                className="px-2.5 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-250/50 rounded-lg transition-colors"
                              >
                                In Progress
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==========================================
            TAB: ABUSE DETECTOR
            ========================================== */}
        {activeTab === 'fraud' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            <div className="bg-white p-6 border border-slate-150 rounded-3xl shadow-sm">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                SaaS Fraud, Security & Abuse Risk Assessor
              </h3>
              <p className="text-xs text-slate-400 mt-1">Automatic filters flag duplicate client accounting, failed login velocity, spam parameters, or unusual transaction amounts.</p>
            </div>

            <div className="bg-white border border-slate-150 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="py-4 px-6">User Email</th>
                      <th className="py-4 px-6">Flag Type</th>
                      <th className="py-4 px-6">Details</th>
                      <th className="py-4 px-6">Risk Severity</th>
                      <th className="py-4 px-6 text-right">Emergency Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fraudFlags.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 text-sm font-semibold">
                          ✅ Perfect health check. No security risk patterns triggered.
                        </td>
                      </tr>
                    ) : (
                      fraudFlags.map((flag, i) => (
                        <tr key={i} className="hover:bg-slate-50/30 transition-colors text-xs font-semibold text-slate-650">
                          <td className="py-4 px-6 font-bold text-slate-800">
                            {flag.email}
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-100 uppercase">
                              {flag.type}
                            </span>
                          </td>
                          <td className="py-4 px-6 max-w-sm text-slate-500 font-medium">
                            {flag.details}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              flag.severity === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                              flag.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {flag.severity}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleUserSuspend(flag.userId, 'ACTIVE')}
                              className="px-3 py-1.5 text-[10px] font-black text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-150"
                            >
                              Lock Profile
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==========================================
            TAB: ALERTS / NOTIFICATIONS
            ========================================== */}
        {activeTab === 'alerts' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            <div className="bg-white p-6 border border-slate-150 rounded-3xl shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-emerald-600 animate-pulse" />
                  Admin HQ Activity Alert Logs
                </h3>
                <p className="text-xs text-slate-400 mt-1">History of system alerts, registrations, support triggers, and large invoices.</p>
              </div>
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="p-12 text-center bg-white border border-slate-150 rounded-3xl text-slate-400 text-xs font-semibold">
                  No system notifications logged yet.
                </div>
              ) : (
                notifications.map((notif, i) => (
                  <div 
                    key={i} 
                    className="p-4 bg-white border border-slate-150 hover:border-slate-300 rounded-2xl flex items-start justify-between gap-4 transition-all"
                  >
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-xl border ${
                        notif.category === 'LARGE_INVOICE' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        notif.category === 'USER_SIGNUP' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-850">{notif.title}</h4>
                        <p className="text-xs text-slate-650 font-medium mt-1">{notif.message}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.createdAt).toLocaleTimeString()} - {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* ==========================================
            TAB: EXPORTS
            ========================================== */}
        {activeTab === 'exports' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
            
            {/* User Export */}
            <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-48">
              <div>
                <h4 className="text-sm font-black text-slate-850 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Freelancer Accounts
                </h4>
                <p className="text-xs text-slate-400 mt-2">Export all registered freelancers, sign-up times, status flags, and plan details.</p>
              </div>
              <button 
                onClick={() => triggerCSVDownload('users')}
                className="w-full py-2.5 text-xs font-bold text-slate-700 bg-slate-55 hover:bg-slate-100 border border-slate-250/50 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                Export CSV File
              </button>
            </div>

            {/* Invoices Export */}
            <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-48">
              <div>
                <h4 className="text-sm font-black text-slate-850 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Invoicing Journals
                </h4>
                <p className="text-xs text-slate-400 mt-2">Download complete log of all invoices, matching client, statuses, and values.</p>
              </div>
              <button 
                onClick={() => triggerCSVDownload('invoices')}
                className="w-full py-2.5 text-xs font-bold text-slate-700 bg-slate-55 hover:bg-slate-100 border border-slate-250/50 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                Export CSV File
              </button>
            </div>

            {/* Revenue Export */}
            <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-48">
              <div>
                <h4 className="text-sm font-black text-slate-850 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Payments & Revenue
                </h4>
                <p className="text-xs text-slate-400 mt-2">Download manually entered payment receipts, matching invoices, and values.</p>
              </div>
              <button 
                onClick={() => triggerCSVDownload('revenue')}
                className="w-full py-2.5 text-xs font-bold text-slate-700 bg-slate-55 hover:bg-slate-100 border border-slate-250/50 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                Export CSV File
              </button>
            </div>

            {/* Activity Logs Export */}
            <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-48">
              <div>
                <h4 className="text-sm font-black text-slate-850 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  System Activity Log
                </h4>
                <p className="text-xs text-slate-400 mt-2">Track all user event triggers, signups, logins, and metadata trails.</p>
              </div>
              <button 
                onClick={() => triggerCSVDownload('activity')}
                className="w-full py-2.5 text-xs font-bold text-slate-700 bg-slate-55 hover:bg-slate-100 border border-slate-250/50 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                Export CSV File
              </button>
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
