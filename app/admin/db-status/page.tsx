'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, AlertCircle, Loader, Database, Activity, RefreshCw } from 'lucide-react';

export default function DBStatusPage() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'failed'>('loading');
  const [message, setMessage] = useState('');
  const [checking, setChecking] = useState(false);

  const checkDatabase = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/db-health');
      const data = await res.json();

      if (res.ok && data.status === 'connected') {
        setStatus('connected');
        setMessage(
          data.productsExist
            ? 'Database is active and successfully queried system tables.'
            : 'Database connected but no seed records found.'
        );
      } else {
        setStatus('failed');
        setMessage(`Database Connection Error: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setStatus('failed');
      setMessage(`Connection failed: ${err.message}`);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkDatabase();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-2">
            <Database className="w-8 h-8 text-indigo-400" />
            Database Status & Diagnostics
          </h1>
          <p className="text-slate-400 text-sm">Monitor ledger schemas and perform diagnostic handshakes.</p>
        </div>
        <button
          onClick={checkDatabase}
          disabled={checking}
          className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 p-2.5 rounded-lg font-semibold flex items-center gap-2 transition cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          Run Handshake
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Connection status card */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                status === 'connected' ? 'bg-emerald-500/10 text-emerald-400' :
                status === 'failed' ? 'bg-rose-500/10 text-rose-500' :
                'bg-slate-950 text-slate-500'
              }`}>
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-slate-200">PostgreSQL Connection</h3>
                <p className="text-xs text-slate-500 font-mono">Drizzle ORM Engine</p>
              </div>
            </div>
            
            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${
              status === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
              status === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' :
              'bg-slate-950 text-slate-500 border border-slate-850'
            }`}>
              {status}
            </span>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl mb-6 font-mono text-sm text-slate-300">
            {checking ? (
              <div className="flex items-center gap-2 py-1 text-slate-500">
                <Loader className="w-4 h-4 animate-spin text-blue-500" />
                Querying database socket...
              </div>
            ) : (
              <span className="break-all">{message}</span>
            )}
          </div>

          {status === 'failed' ? (
            <div className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-4">
              <h4 className="text-rose-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Troubleshooting Manual
              </h4>
              <ul className="text-rose-300 text-xs space-y-1.5 list-disc pl-4 font-medium">
                <li>Verify Postgres connection credentials inside environment configuration files</li>
                <li>Check network interface and database server availability</li>
                <li>Ensure local driver handshake permissions permit PG connections</li>
              </ul>
            </div>
          ) : status === 'connected' ? (
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 flex justify-between items-center">
              <div>
                <h4 className="text-emerald-400 text-sm font-bold">Ledger Seeding Console</h4>
                <p className="text-slate-500 text-xs mt-0.5">Seed fresh financial datasets for product demoes.</p>
              </div>
              <Link
                href="/api/seed"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition"
              >
                Trigger Seed API
              </Link>
            </div>
          ) : null}
        </div>

        {/* System parameters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="font-bold text-slate-100 uppercase text-xs tracking-wider border-b border-slate-800 pb-3">Drizzle Variables</h3>
          <div className="space-y-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 block mb-1">NODE_ENV</span>
              <span className="text-slate-200 px-2 py-1 bg-slate-950 border border-slate-850 rounded block truncate uppercase">
                {process.env.NODE_ENV || 'development'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Postgres Pool Size</span>
              <span className="text-slate-200 px-2 py-1 bg-slate-950 border border-slate-850 rounded block font-semibold text-xs">
                {process.env.NODE_ENV === 'production' ? '1 Client' : '10 Clients (Max)'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Drizzle Schema Count</span>
              <span className="text-slate-200 px-2 py-1 bg-slate-950 border border-slate-850 rounded block font-semibold">
                8 pgTables mapped
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
