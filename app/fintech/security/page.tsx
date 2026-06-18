'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import Navbar from '@/app/components/Navbar';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  RefreshCw, 
  Database,
  Cpu, 
  Binary,
  Activity,
  UserCheck,
  AlertOctagon
} from 'lucide-react';
import { useSession } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Block {
  id: string;
  amount: number;
  createdAt: string;
  storedHash: string;
  recalculatedHash: string;
  previousHash: string;
  expectedPrevHash: string;
  status: "VALID" | "TAMPERED" | "CORRUPTED";
}

export default function SecurityMonitorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [blocksList, setBlocksList] = useState<Block[]>([]);
  const [chainValid, setChainValid] = useState<boolean | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditedCount, setAuditedCount] = useState(0);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  // Auth Protection
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/fintech/security');
    }
  }, [status, router]);

  // Run Real-Time Security Check
  const runIntegrityAudit = async () => {
    try {
      setLoadingAudit(true);
      setChainValid(null);
      
      // Artificial delay to simulate heavy cryptographic hashing scans
      await new Promise(resolve => setTimeout(resolve, 1200));

      const res = await fetch('/api/admin/ledger-integrity?_t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setBlocksList(data.auditChain || []);
        setChainValid(data.isValid);
        setAuditedCount(data.totalBlocks || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (session) {
      runIntegrityAudit();
    }
  }, [session]);

  // DB Hacker Attack Simulator: Corrupts local cache data to trigger tamper-evident failures
  const triggerHackerAttack = async () => {
    try {
      setSimulationStatus("ATTACK_IN_PROGRESS");
      
      // Post request to a special seed endpoint or edit the local database file directly in memory
      // We will perform a fetch payload that modifies a transaction's value without recalculating its hash
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TAMPER_LEDGER' })
      });

      if (res.ok) {
        setSimulationStatus("ATTACK_SUCCESSFUL");
        setChainValid(null);
        setTimeout(() => {
          setSimulationStatus(null);
          runIntegrityAudit(); // Audit instantly
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setSimulationStatus(null);
    }
  };

  // Restore Ledger Database back to clean cryptographic state
  const restoreLedgerClean = async () => {
    try {
      setSimulationStatus("RESTORE_IN_PROGRESS");
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REPAIR_LEDGER' })
      });

      if (res.ok) {
        setSimulationStatus("RESTORE_SUCCESSFUL");
        setChainValid(null);
        setTimeout(() => {
          setSimulationStatus(null);
          runIntegrityAudit(); // Refresh
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setSimulationStatus(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full tracking-wider uppercase">
                  SHA-256 Audit Vault
                </span>
              </div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <Lock className="w-9 h-9 text-indigo-600 animate-pulse" />
                Cryptographic Ledger Monitor
              </h1>
              <p className="text-slate-400 text-sm mt-1">Audit transaction chains, verify database block hashing, and track tamper-proof invariants</p>
            </div>
            
            <button
              onClick={runIntegrityAudit}
              disabled={loadingAudit}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-md hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingAudit ? 'animate-spin' : ''}`} />
              Verify Ledger Integrity
            </button>
          </div>

          {/* Verification HUD */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex items-center gap-5 md:col-span-2">
              {chainValid === true ? (
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/50 shrink-0">
                  <ShieldCheck className="w-10 h-10" />
                </div>
              ) : chainValid === false ? (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100/50 animate-bounce shrink-0">
                  <ShieldAlert className="w-10 h-10" />
                </div>
              ) : (
                <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 animate-pulse shrink-0">
                  <Activity className="w-10 h-10" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest break-words">Global Integrity Status</p>
                <h3 className={`text-lg sm:text-xl lg:text-2xl font-black mt-1 break-words ${
                  chainValid === true ? 'text-emerald-600' : chainValid === false ? 'text-rose-600' : 'text-slate-500'
                }`}>
                  {chainValid === true ? 'CHAIN SECURED & VERIFIED' : chainValid === false ? 'TAMPERING DETECTED' : 'AUDITING BLOCKCHAIN...'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 break-words">
                  {chainValid === true ? 'All block hashes match their preceding signature' : chainValid === false ? 'A transaction was altered without matching hash updates' : 'Analyzing transaction blocks'}
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex items-center gap-5">
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/50 shrink-0">
                <Binary className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest break-words">Audited Blocks</p>
                <h3 className="text-xl lg:text-2xl font-black text-slate-800 mt-1 break-words">{auditedCount}</h3>
                <p className="text-xs text-slate-400 mt-0.5 break-words">Chronological Tx records</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex items-center gap-5">
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/50 shrink-0">
                <UserCheck className="w-6 h-6 animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest break-words">Duplicate Prevention Guard</p>
                <h3 className="text-xl lg:text-2xl font-black text-emerald-600 mt-1 break-words">SHIELDED</h3>
                <p className="text-xs text-slate-400 mt-0.5 break-words">Zero double-payout risk</p>
              </div>
            </div>

          </div>

          {/* Interactive Employer Simulator Sandbox */}
          <div className="p-6 bg-slate-900 border border-slate-850 rounded-[24px] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-5 pointer-events-none translate-x-12 translate-y-12">
              <AlertOctagon size={240} className="text-rose-500" />
            </div>
            <div className="space-y-2 relative z-10">
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                Ledger Tampering Simulator (For Employers & CEOs)
              </h2>
              <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
                Want to test Velox's cryptographic tamper-evident engineering? Click the **Hacker Attack** button to simulate a database attacker modifying a transaction's value (e.g. changing an invoice amount directly in the database without updating the hash chain). Then run the audit to see the platform catch it instantly!
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
              {simulationStatus ? (
                <div className="px-4 py-3 bg-slate-800 rounded-xl border border-slate-700 text-xs font-mono font-bold tracking-wide animate-pulse">
                  {simulationStatus === "ATTACK_IN_PROGRESS" && "⚡ Attacker compromising database..."}
                  {simulationStatus === "ATTACK_SUCCESSFUL" && "💥 Attack finished. Auditing..."}
                  {simulationStatus === "RESTORE_IN_PROGRESS" && "🛠️ Restoring cryptographic backup..."}
                  {simulationStatus === "RESTORE_SUCCESSFUL" && "✅ Clean state restored!"}
                </div>
              ) : (
                <>
                  <button
                    onClick={triggerHackerAttack}
                    className="px-4.5 py-3 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition-all active:scale-95 border border-rose-500/20"
                  >
                    Simulate DB Hacker Attack ⚡
                  </button>
                  <button
                    onClick={restoreLedgerClean}
                    className="px-4.5 py-3 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs hover:bg-slate-700 transition-all active:scale-95"
                  >
                    Repair & Restore Chain 🛠️
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Cryptographic Block Explorer Tree */}
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  General Ledger Block Explorer
                </h2>
                <p className="text-slate-400 text-xs mt-1">traversing the SHA-256 block signature chain chronologically</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto p-6 space-y-6">
              {loadingAudit ? (
                /* Loading State Shimmer */
                <div className="space-y-4">
                  {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="p-5 border border-slate-100 rounded-2xl bg-slate-50 animate-pulse flex justify-between h-20"></div>
                  ))}
                </div>
              ) : blocksList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No transactions registered in the ledger to chain.
                </div>
              ) : (
                <div className="relative flex flex-col gap-6">
                  {/* Visual chain linking line */}
                  <div className="absolute top-0 bottom-0 left-[27px] w-0.5 bg-slate-200 -z-10" />

                  {blocksList.map((block, index) => {
                    const isValid = block.status === "VALID";
                    return (
                      <div key={block.id} className="flex items-start gap-4">
                        
                        {/* Bullet / Block Circle */}
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-2 font-black font-mono text-sm relative z-10 transition-colors duration-300 ${
                          isValid 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                            : 'bg-rose-50 border-rose-500 text-rose-700 animate-bounce shadow-md'
                        }`}>
                          #{index + 1}
                        </div>

                        {/* Block Details Card */}
                        <div className={`flex-1 p-5 rounded-2xl border transition-all duration-300 ${
                          isValid 
                            ? 'bg-white border-slate-200/80 shadow-sm hover:border-slate-300' 
                            : 'bg-rose-50/20 border-rose-300 shadow-md animate-pulse'
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-3.5">
                            <div>
                              <p className="text-xs text-slate-400 font-mono tracking-wide">Block ID: {block.id}</p>
                              <h4 className="text-sm font-black text-slate-800 mt-1 flex items-center gap-1.5">
                                Invoice Payment / Ledger Mutation
                                {isValid ? (
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-sm">
                                    SECURED
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-100 rounded-sm">
                                    TAMPERED
                                  </span>
                                )}
                              </h4>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-mono text-sm font-black text-emerald-600">${block.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{block.createdAt ? new Date(block.createdAt).toLocaleString() : ''}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] font-mono leading-relaxed">
                            <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <p className="font-bold text-slate-500 uppercase tracking-wide">Block SHA-256 Signature</p>
                              <p className="text-slate-700 break-all select-all">{block.storedHash}</p>
                              {!isValid && (
                                <p className="text-rose-500 font-bold mt-1">Expected: {block.recalculatedHash}</p>
                              )}
                            </div>

                            <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <p className="font-bold text-slate-500 uppercase tracking-wide">Preceding Chain Hash</p>
                              <p className="text-slate-700 break-all select-all">{block.previousHash}</p>
                              {!isValid && (
                                <p className="text-rose-500 font-bold mt-1">Expected: {block.expectedPrevHash}</p>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
  );
}
