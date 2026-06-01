import React from 'react';
import { auth } from "@/auth";
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Guard Gateway: verify admin credentials
  if (!session || !session.user || !session.user.isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center">
            <div className="p-3 bg-rose-500/10 rounded-full text-rose-500 mb-4 animate-pulse">
              <ShieldAlert className="w-12 h-12" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-100 mb-2">Access Restricted</h1>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              This terminal is reserved for system architects. Authenticated developer or administrator privilege is required to access ledger status.
            </p>

            <Link
              href="/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Finance OS
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Admin Subheader Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl px-8 py-4 flex justify-between items-center fixed top-0 w-full z-40">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-extrabold text-xs border border-indigo-500/30">
            A
          </div>
          <span className="font-bold text-slate-200 text-sm tracking-wide">Developer Admin Console</span>
        </div>
        <div className="flex gap-4">
          <Link href="/admin/db-status" className="text-xs text-slate-400 hover:text-slate-100 font-semibold transition-colors">DB Status</Link>
          <Link href="/admin/audit-logs" className="text-xs text-slate-400 hover:text-slate-100 font-semibold transition-colors">Audit Trail</Link>
          <Link href="/dashboard" className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors flex items-center gap-1">
            Finance Dashboard
          </Link>
        </div>
      </header>

      {/* Admin Content Area */}
      <div className="pt-20 p-8 max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  );
}
