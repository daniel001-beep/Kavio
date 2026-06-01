'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, History, Loader, CheckCircle2, UserPlus, Info } from 'lucide-react';

interface AuditLog {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  changes: any;
  timestamp: string;
  userId: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs');
      const data = await res.json();
      if (res.ok && data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to load audit trail logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4">
        <Loader className="w-10 h-10 text-indigo-400 animate-spin" />
        <p className="text-slate-400 text-sm">Compiling secure system audit logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-2">
          <History className="w-8 h-8 text-indigo-400" />
          Administrative Audit Trail
        </h1>
        <p className="text-slate-400 text-sm">Review tamper-proof immutable change logs and user behaviors.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        {logs.length > 0 ? (
          <div className="relative border-l-2 border-slate-800 ml-4 pl-8 space-y-8 py-2">
            {logs.map((log) => {
              // Custom badge visual selectors based on audit log event type
              let Icon = Info;
              let bgClass = 'bg-slate-800 text-slate-400 border-slate-700';
              
              if (log.eventType === 'log_transaction') {
                Icon = CheckCircle2;
                bgClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
              } else if (log.eventType === 'create_business') {
                Icon = UserPlus;
                bgClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
              } else if (log.eventType.includes('access')) {
                Icon = ShieldCheck;
                bgClass = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
              }

              return (
                <div key={log.id} className="relative group animate-in fade-in slide-in-from-left-4 duration-300">
                  {/* Timeline Badge Dot */}
                  <span className={`absolute -left-[43px] top-1 flex items-center justify-center w-7 h-7 rounded-full border ${bgClass}`}>
                    <Icon className="w-4 h-4" />
                  </span>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2">
                    <div>
                      <span className="text-sm font-bold text-slate-200 capitalize">
                        {log.eventType.replace('_', ' ')}
                      </span>
                      <span className="mx-2 text-xs text-slate-600 font-bold">•</span>
                      <span className="text-xs text-slate-400 font-semibold font-mono">
                        User ID: {log.userId || 'System'}
                      </span>
                    </div>
                    
                    <span className="text-xs text-slate-500 font-medium font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-950/70 border border-slate-850 rounded-xl">
                    <div className="text-xs text-slate-400 font-bold uppercase mb-2 tracking-wider">Parameters Mapped</div>
                    <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-all">
                      {JSON.stringify(log.changes || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center text-slate-500 text-sm">
            No administrative audit trail logs found in database.
          </div>
        )}
      </div>
    </div>
  );
}
