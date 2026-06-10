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
    router.push("/fintech/marketplace/" + productId);
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
      <div className="pt-4 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-100 mb-2 tracking-tight">Treasury Marketplace</h1>
            <p className="text-slate-400">Discover institutional-grade financial instruments to extend your runway.</p>
          </div>
          
          <button 
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Move Money
          </button>
        </div>

        {/* Marketplace Grid */}
        <MarketplaceGrid onSelectProduct={handleSelectProduct} />
      </div>

      {/* Move Money Modal Overlay */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-100">Transfer Funds</h2>
              <button 
                onClick={() => !isProcessing && setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                disabled={isProcessing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {transferSuccess ? (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                  <ArrowRightLeft className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-100 mb-2">Transfer Initiated</h3>
                <p className="text-slate-400">Your funds are being moved securely.</p>
              </div>
            ) : (
              <form onSubmit={handleTransfer} className="p-6 space-y-6">
                
                <div className="flex items-center gap-4 relative">
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">From</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200">Operating Account</p>
                        <p className="text-xs text-slate-500 font-mono">...8492</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center z-10 shadow-lg">
                    <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                  </div>

                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">To</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200">Treasury Vault</p>
                        <p className="text-xs text-slate-500 font-mono">...1104</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xl">$</span>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-4 pl-10 pr-4 text-2xl font-mono font-bold text-slate-100 placeholder-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-xs text-slate-500">Available: <span className="font-mono text-slate-400">$4,250,000.00</span></p>
                    <button type="button" onClick={() => setTransferAmount('4250000')} className="text-xs font-bold text-blue-400 hover:text-blue-300">Max</button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={!transferAmount || isProcessing}
                  className={"w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all " + (isProcessing || !transferAmount ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]')}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
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
