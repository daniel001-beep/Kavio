'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { 
  Shield, 
  ShieldAlert,
  ShieldCheck,
  Smartphone, 
  Laptop, 
  Globe, 
  Key, 
  History,
  ToggleLeft,
  ToggleRight,
  AlertTriangle
} from 'lucide-react';

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
  icon: React.ElementType;
}

export default function SecurityPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'audit'>('overview');

  const activeSessions: Session[] = [
    {
      id: 'ses_1',
      device: 'MacBook Pro 16"',
      browser: 'Chrome 124.0.0.0',
      location: 'San Francisco, US',
      ip: '192.168.1.1',
      lastActive: 'Just now',
      isCurrent: true,
      icon: Laptop,
    },
    {
      id: 'ses_2',
      device: 'iPhone 15 Pro',
      browser: 'Safari Mobile',
      location: 'San Jose, US',
      ip: '172.20.10.4',
      lastActive: '2 hours ago',
      isCurrent: false,
      icon: Smartphone,
    },
    {
      id: 'ses_3',
      device: 'Windows PC',
      browser: 'Edge 123.0',
      location: 'New York, US',
      ip: '10.0.0.45',
      lastActive: 'Yesterday',
      isCurrent: false,
      icon: Laptop,
    }
  ];

  const auditLogs = [
    { id: 'aud_1', action: 'Successful Login', location: 'San Francisco, US', ip: '192.168.1.1', time: 'Just now', status: 'success' },
    { id: 'aud_2', action: 'API Key Generated', location: 'San Francisco, US', ip: '192.168.1.1', time: '1 hour ago', status: 'success' },
    { id: 'aud_3', action: 'Failed Login Attempt', location: 'Moscow, RU', ip: '45.12.33.1', time: '5 hours ago', status: 'danger' },
    { id: 'aud_4', action: 'Password Changed', location: 'San Jose, US', ip: '172.20.10.4', time: '2 days ago', status: 'warning' },
    { id: 'aud_5', action: '2FA Enabled', location: 'San Jose, US', ip: '172.20.10.4', time: '2 days ago', status: 'success' },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8 border-b border-slate-800 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-sm border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-100 tracking-tight">Security Center</h1>
            <p className="text-slate-400 mt-1">Manage your account security and monitor active sessions</p>
          </div>
        </div>
        <div className="flex bg-slate-900 rounded-sm p-1 border border-slate-700 w-full md:w-auto">
          {['overview', 'sessions', 'audit'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={"flex-1 md:flex-none px-6 py-2 text-sm font-bold uppercase tracking-wider rounded-sm transition-all duration-200 " + (
                activeTab === tab
                  ? 'bg-slate-700 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-500">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Security Score */}
            <div className="bg-slate-900 border border-slate-700 rounded-sm p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <ShieldCheck className="w-20 h-20 text-emerald-500 mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
              <h2 className="text-2xl font-bold text-slate-100 mb-2">Security Score: 98/100</h2>
              <p className="text-sm text-slate-400 mb-6">Your account is highly secure. You have enabled all recommended security features.</p>
              <div className="w-full bg-slate-800 rounded-full h-2 mb-2 border border-slate-700">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '98%' }}></div>
              </div>
              <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Excellent</p>
            </div>

            {/* 2FA Toggle */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-sm p-8 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Key className="w-6 h-6 text-blue-400" />
                    <h2 className="text-2xl font-bold text-slate-100">Two-Factor Authentication</h2>
                  </div>
                  <p className="text-sm text-slate-400 max-w-md mb-6">
                    Add an extra layer of security to your account. When logging in, you'll need to provide a code from your authenticator app.
                  </p>
                  <div className="flex gap-4">
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-sm font-semibold rounded-sm transition-colors">
                      Configure App
                    </button>
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-sm font-semibold rounded-sm transition-colors">
                      Backup Codes
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className="focus:outline-none transition-transform active:scale-95"
                >
                  {twoFactorEnabled ? (
                    <ToggleRight className="w-12 h-12 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-12 h-12 text-slate-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SESSIONS TAB */}
        {activeTab === 'sessions' && (
          <div className="bg-slate-900 border border-slate-700 rounded-sm overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold text-slate-100">Active Sessions</h2>
              </div>
              <button className="text-sm font-bold text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-wider">
                Revoke All
              </button>
            </div>
            <div className="divide-y divide-slate-800">
              {activeSessions.map((session) => {
                const Icon = session.icon;
                return (
                  <div key={session.id} className="p-6 hover:bg-slate-800/30 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-sm bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-slate-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-slate-100">{session.device}</h3>
                          {session.isCurrent && (
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-sm">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">
                          {session.browser} • {session.location} • {session.ip}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-xs text-slate-500 font-medium">Last active: {session.lastActive}</p>
                      {!session.isCurrent && (
                        <button className="text-sm font-bold text-slate-400 hover:text-rose-400 transition-colors">
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AUDIT LOG TAB */}
        {activeTab === 'audit' && (
          <div className="bg-slate-900 border border-slate-700 rounded-sm overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold text-slate-100">Security Audit Log</h2>
              </div>
              <button className="text-sm font-bold text-slate-400 hover:text-slate-300 transition-colors uppercase tracking-wider">
                Download CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Event</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Location</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">IP Address</th>
                    <th className="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-5 px-6 flex items-center gap-3">
                        {log.status === 'success' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                        {log.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                        {log.status === 'danger' && <ShieldAlert className="w-4 h-4 text-rose-400" />}
                        <span className="text-slate-200 font-bold text-sm">{log.action}</span>
                      </td>
                      <td className="py-5 px-6 text-slate-400 text-sm font-medium">{log.location}</td>
                      <td className="py-5 px-6 font-mono text-slate-500 text-xs">{log.ip}</td>
                      <td className="py-5 px-6 text-right text-slate-400 text-sm">{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
