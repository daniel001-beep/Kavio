'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { products } from '@/app/components/MarketplaceGrid';
import DashboardLayout from '@/app/components/DashboardLayout';
import { ArrowLeft, CheckCircle, X, RefreshCw, Landmark, ShieldCheck } from 'lucide-react';
import { useSession } from '@/app/context/AuthContext';
import { useNotifications } from '@/app/context/NotificationContext';

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { addNotification } = useNotifications();

  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [allocationAmount, setAllocationAmount] = useState('50000');
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocationSuccess, setAllocationSuccess] = useState(false);
  const [balance, setBalance] = useState<number>(4250000); // Default fallback
  
  // Load from localStorage cache and fresh API
  useEffect(() => {
    if (userEmail) {
      const cachedTxStr = localStorage.getItem(`velox_cached_api_transactions_${userEmail}`);
      if (cachedTxStr) {
        try {
          const cachedTxs = JSON.parse(cachedTxStr);
          const computed = cachedTxs
            .filter((tx: any) => tx.status?.toUpperCase() === 'COMPLETED' || !tx.status)
            .reduce((acc: number, tx: any) => acc + (tx.amount || 0), 0);
          setBalance(computed);
        } catch (e) {
          console.warn('Failed to parse cached transactions:', e);
        }
      }
      
      fetch('/api/ledger/transaction?_t=' + Date.now(), { cache: 'no-store' })
        .then(res => {
          if (!res.ok) return null;
          return res.json();
        })
        .then(data => {
          const txData = Array.isArray(data) ? data : data.transactions || [];
          if (Array.isArray(txData) && txData.length > 0) {
            const mapped = txData.map((tx: any) => {
              const amountInDollars = Number(tx.amount) / 100;
              let meta = tx.metadata;
              if (typeof meta === 'string') {
                try {
                  meta = JSON.parse(meta);
                } catch (e) {}
              }
              return {
                id: tx.id?.toString(),
                type: amountInDollars > 0 ? 'CREDIT' : 'DEBIT',
                description: meta?.description || tx.description || 'Transaction',
                date: tx.createdAt ? new Date(tx.createdAt).toLocaleString() : new Date().toLocaleString(),
                amount: amountInDollars,
                status: tx.status?.toUpperCase() || 'COMPLETED',
              };
            });
            const computed = mapped
              .filter((tx: any) => tx.status?.toUpperCase() === 'COMPLETED' || !tx.status)
              .reduce((acc: number, tx: any) => acc + (tx.amount || 0), 0);
            setBalance(computed);
            localStorage.setItem(`velox_cached_api_transactions_${userEmail}`, JSON.stringify(mapped));
          }
        })
        .catch(err => console.error('Failed to fetch transactions:', err));
    }
  }, [userEmail]);

  const handleAllocateCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(allocationAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid allocation amount');
      return;
    }
    if (amt > balance) {
      alert('Insufficient available capital');
      return;
    }

    setIsAllocating(true);

    const idempotencyKey = `alloc_${id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (userEmail) {
      // 1. Optimistic Cache Update - Transactions
      let cachedTxs: any[] = [];
      const cachedTxStr = localStorage.getItem(`velox_cached_api_transactions_${userEmail}`);
      if (cachedTxStr) {
        try {
          cachedTxs = JSON.parse(cachedTxStr);
        } catch (e) {}
      }

      const newUiTx = {
        id: txId,
        type: 'DEBIT',
        description: `Capital Allocation: ${product?.title || 'Treasury'}`,
        date: new Date().toLocaleString(),
        amount: -amt,
        status: 'COMPLETED'
      };
      
      const updatedTxs = [newUiTx, ...cachedTxs];
      localStorage.setItem(`velox_cached_api_transactions_${userEmail}`, JSON.stringify(updatedTxs));

      // 2. Optimistic Cache Update - Invoices
      let cachedInvs: any[] = [];
      const cachedInvsStr = localStorage.getItem(`velox_cached_invoices_${userEmail}`);
      if (cachedInvsStr) {
        try {
          cachedInvs = JSON.parse(cachedInvsStr);
        } catch (e) {}
      }

      const newInvoice = {
        id: txId,
        client_name: 'Treasury Marketplace',
        description: `Capital Allocation: ${product?.title || 'Treasury'}`,
        amount: -amt,
        status: 'Paid',
        email: userEmail,
        user_id: session?.user?.id || 'LOCAL',
        created_at: new Date().toISOString()
      };

      const updatedInvs = [newInvoice, ...cachedInvs];
      localStorage.setItem(`velox_cached_invoices_${userEmail}`, JSON.stringify(updatedInvs));
      
      // Update local balance state immediately
      setBalance(prev => prev - amt);
    }

    try {
      // 3. Post to API
      const res = await fetch('/api/ledger/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          amount: -Math.round(amt * 100), // negative cents
          idempotencyKey,
          description: `Capital Allocation: ${product?.title || 'Treasury'}`,
          status: 'Paid',
          metadata: {
            client_name: 'Treasury Marketplace',
            description: `Capital Allocation to ${product?.title || 'Treasury'}`
          }
        })
      });

      if (!res.ok) {
        throw new Error('API request failed');
      }

      // 4. Success State
      setIsAllocating(false);
      setAllocationSuccess(true);
      addNotification({
        type: 'SUCCESS',
        title: 'Capital Allocated',
        message: `Successfully allocated $${amt.toLocaleString()} to ${product?.title || 'Treasury'}.`,
      });
      setTimeout(() => {
        setIsAllocationModalOpen(false);
        setAllocationSuccess(false);
        router.push('/dashboard');
      }, 2500);

    } catch (err) {
      console.error('Failed to allocate capital:', err);
      // Rollback optimistic update
      if (userEmail) {
        const cachedTxStr = localStorage.getItem(`velox_cached_api_transactions_${userEmail}`);
        if (cachedTxStr) {
          try {
            const cachedTxs = JSON.parse(cachedTxStr);
            const filtered = cachedTxs.filter((tx: any) => tx.id !== txId);
            localStorage.setItem(`velox_cached_api_transactions_${userEmail}`, JSON.stringify(filtered));
          } catch (e) {}
        }
        const cachedInvsStr = localStorage.getItem(`velox_cached_invoices_${userEmail}`);
        if (cachedInvsStr) {
          try {
            const cachedInvs = JSON.parse(cachedInvsStr);
            const filtered = cachedInvs.filter((inv: any) => inv.id !== txId);
            localStorage.setItem(`velox_cached_invoices_${userEmail}`, JSON.stringify(filtered));
          } catch (e) {}
        }
        setBalance(prev => prev + amt);
      }
      setIsAllocating(false);
      alert('Failed to complete capital allocation. Ledger integrity maintained.');
    }
  };
  
  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <h1 className="text-2xl font-bold text-slate-100 mb-4">Product Not Found</h1>
          <button onClick={() => router.push('/fintech/bank-mutation')} className="text-blue-500 hover:text-blue-400">
            Return to Bank Mutation
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const Icon = product.icon;

  return (
    <DashboardLayout>
      <div className="pt-4 px-3 sm:px-6 animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
        {/* Back Button */}
        <button 
          onClick={() => router.push('/fintech/bank-mutation')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-4 font-bold text-xs uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Back to Bank Mutation</span>
        </button>
 
        {/* Header Section */}
        <div className="bg-white border border-slate-200 rounded-[28px] shadow-sm flex flex-col md:flex-row gap-8 items-stretch md:items-center justify-between relative overflow-hidden p-6 sm:p-8 md:p-10">
          {/* Background Glow */}
          <div 
            className="absolute top-0 right-0 w-64 h-64 opacity-5 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3"
            style={{ backgroundColor: product.accentColor }}
          />
          
          <div className="flex-1 z-10 w-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-200 shrink-0">
                <Icon className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: product.accentColor }} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">{product.title}</h1>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{product.category}</p>
              </div>
            </div>
            <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed max-w-3xl">
              {product.description}
            </p>
          </div>
          
          <div className="bg-white border border-slate-200 p-6 rounded-[24px] shrink-0 w-full md:w-[220px] z-10 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: '#64748b' }}>Target Yield</p>
            <p className="text-2xl font-black font-mono mb-2" style={{ color: '#059669' }}>{product.yieldRate}</p>
            <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: '#64748b' }}>Liquidity</p>
            <p className="text-sm font-bold mb-6" style={{ color: '#334155' }}>{product.liquidity}</p>
            <button 
              onClick={() => setIsAllocationModalOpen(true)}
              className="w-full py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 text-xs uppercase tracking-wider"
            >
              Allocate Capital
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Features */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[24px] shadow-sm p-4 xs:p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {product.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-slate-600 font-medium">{feature}</p>
                </div>
              ))}
              {/* Extra mock features to flesh out the page */}
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p className="text-slate-600 font-medium">24/7 dedicated enterprise support</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p className="text-slate-600 font-medium">99.99% Guaranteed uptime SLA</p>
              </div>
            </div>
          </div>

          {/* Compliance & Integration */}
          <div className="space-y-8">
            <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm p-4 xs:p-6 sm:p-8">
              <h3 className="text-base font-bold text-slate-800 mb-4">Compliance</h3>
              <div className="flex flex-col gap-3">
                {['SOC 2 Type II', 'ISO 27001', 'PCI DSS'].map((badge) => (
                  <div key={badge} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-2 h-2 bg-emerald-500 rounded-sm"></div>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">{badge} Certified</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm p-4 xs:p-6 sm:p-8">
              <h3 className="text-base font-bold text-slate-800 mb-4">API Documentation</h3>
              <p className="text-xs text-slate-500 font-semibold mb-4 leading-relaxed">Integration guides, API references, and SDKs are available in the developer portal.</p>
              <button className="text-blue-600 hover:text-blue-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                View Documentation →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Capital Allocation Modal Overlay */}
      {isAllocationModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-blue-600" />
                Allocate Capital
              </h2>
              <button 
                onClick={() => !isAllocating && !allocationSuccess && setIsAllocationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                disabled={isAllocating || allocationSuccess}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {allocationSuccess ? (
              <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200 animate-bounce">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Allocation Initiated</h3>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Ledger Entry Validated
                  </p>
                </div>
                
                <p className="text-slate-600 text-sm max-w-xs leading-relaxed font-medium">
                  Your capital allocation of <span className="font-mono font-bold text-slate-800">${Number(allocationAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> to {product.title} has been recorded.
                </p>

                {/* Ledger Audit Entry Visualizer */}
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left font-mono text-[10px] space-y-2 text-slate-500">
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span>DEBIT (OPERATING)</span>
                    <span className="text-rose-600 font-bold">-${Number(allocationAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span>CREDIT (PORTFOLIO)</span>
                    <span className="text-emerald-600 font-bold">+${Number(allocationAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[9px] pt-1 opacity-70">
                    <span>CRYPTO HASH</span>
                    <span>sha256_d7a5b3f2...</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 pt-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Redirecting to Dashboard...</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAllocateCapital} className="p-6 space-y-6">
                
                {/* Available Balance card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Available Capital</p>
                    <p className="text-xl font-bold font-mono text-slate-800 mt-1">
                      ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                    <Landmark className="w-5 h-5 text-blue-600" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Allocation Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-lg font-bold">$</span>
                    <input
                      type="number"
                      required
                      min="1"
                      max={balance}
                      placeholder="0.00"
                      value={allocationAmount}
                      onChange={(e) => setAllocationAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-8 pr-4 text-2xl font-mono font-bold text-slate-700 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-[11px] text-slate-500 font-semibold">
                      Estimated Remaining Balance: <span className="font-mono text-slate-750 font-bold">${(balance - (parseFloat(allocationAmount) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </p>
                    <button 
                      type="button" 
                      onClick={() => setAllocationAmount(balance.toString())} 
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      Max
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-left">
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-blue-700 leading-relaxed uppercase tracking-wider">
                    Double-entry verification is automated. This allocation instantly updates Operating and Vault ledgers.
                  </p>
                </div>

                <button 
                  type="submit" 
                  disabled={!allocationAmount || isAllocating || parseFloat(allocationAmount) <= 0 || parseFloat(allocationAmount) > balance}
                  className={"w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition-all " + (isAllocating || !allocationAmount || parseFloat(allocationAmount) <= 0 || parseFloat(allocationAmount) > balance ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-blue-600 hover:bg-blue-700 shadow-md active:scale-[0.98]')}
                >
                  {isAllocating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      Allocating Capital...
                    </>
                  ) : (
                    <>
                      Confirm Capital Allocation
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
