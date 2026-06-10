'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import MarketplaceGrid from '@/app/components/MarketplaceGrid';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, X, Building2, Wallet, Send, RefreshCw } from 'lucide-react';

export default function MarketplacePage() {
  const router = useRouter();
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);

  const handleSelectProduct = (productId: string) => {
    router.push("/fintech/bank-mutation/" + productId);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate API call for transfer
    setTimeout(() => {
      setIsProcessing(false);
      setTransferSuccess(true);
      
      // Close modal after showing success message for 2 seconds
      setTimeout(() => {
        setIsTransferModalOpen(false);
        setTransferSuccess(false);
        setTransferAmount('');
      }, 2000);
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className="pt-4 px-0 xs:px-2 sm:px-4 animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-black text-blue-600 tracking-tight">Treasury Marketplace</h1>
            <p className="text-slate-500 text-sm mt-1 font-semibold">Discover institutional-grade financial instruments to extend your runway.</p>
          </div>
        </div>

        {/* Marketplace Grid */}
        <MarketplaceGrid onSelectProduct={handleSelectProduct} />
      </div>

      {/* Move Money Modal Overlay */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Transfer Funds</h2>
              <button 
                onClick={() => !isProcessing && setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                disabled={isProcessing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {transferSuccess ? (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-200">
                  <ArrowRightLeft className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Transfer Initiated</h3>
                <p className="text-slate-600 text-sm font-semibold">Your funds are being moved securely.</p>
              </div>
            ) : (
              <form onSubmit={handleTransfer} className="p-6 space-y-6">
                
                <div className="flex items-center gap-4 relative">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">From</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/10 text-blue-600 rounded-lg flex items-center justify-center border border-blue-200">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Operating</p>
                        <p className="text-[10px] text-slate-500 font-semibold font-mono">...8492</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center z-10 shadow-md">
                    <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                  </div>

                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">To</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500/10 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-200">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Vault</p>
                        <p className="text-[10px] text-slate-500 font-semibold font-mono">...1104</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xl">$</span>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-10 pr-4 text-2xl font-mono font-bold text-slate-700 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-xs text-slate-500 font-semibold">Available: <span className="font-mono text-slate-600">$4,250,000.00</span></p>
                    <button type="button" onClick={() => setTransferAmount('4250000')} className="text-xs font-bold text-blue-600 hover:text-blue-700">Max</button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={!transferAmount || isProcessing}
                  className={"w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition-all " + (isProcessing || !transferAmount ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-blue-600 hover:bg-blue-700 shadow-md')}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-white" />
                      Initiate Transfer
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
