'use client';

import React from 'react';
import { Shield, Clock, CheckCircle2 } from 'lucide-react';

interface AuditTimelineProps {
  transactions: any[];
}

export default function AuditTimeline({ transactions }: AuditTimelineProps) {
  const displayTransactions = transactions.slice(0, 5);

  if (displayTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <Shield className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm font-medium">No recent audit events</p>
      </div>
    );
  }

  const formatTime = (dateVal: any) => {
    if (!dateVal) return new Date().toLocaleTimeString();
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? new Date().toLocaleTimeString() : d.toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {displayTransactions.map((tx, i) => (
        <div key={tx.id} className="relative pb-6 last:pb-0">
          {/* Vertical Line */}
          {i !== displayTransactions.length - 1 && (
            <div className="absolute left-3 top-6 bottom-0 w-px bg-slate-100" />
          )}
          
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="w-6 h-6 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center shrink-0 z-10">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-slate-800">
                  Transaction Verified
                </span>
                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {formatTime(tx.createdAt)}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Block hash: <span className="font-mono text-[10px] text-slate-750 font-bold">{tx.hash?.substring(0, 16)}...</span>
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
