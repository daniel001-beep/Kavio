'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, CheckCircle2, ShieldCheck, Mail, DollarSign, FileText, ArrowRight, Activity } from 'lucide-react';
import DOMPurify from 'dompurify';

interface SendMoneyCardProps {
  onTransferSuccess?: (txHash: string, email: string, amount: string, note: string) => void;
}

export default function SendMoneyCard({ onTransferSuccess }: SendMoneyCardProps) {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  
  // Slider State
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Transfer State
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [txHash, setTxHash] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const maxSlide = 220; // Approx max width of slide track

  const handlePointerDown = (e: React.PointerEvent) => {
    if (status !== 'IDLE' || !email || !amount) return;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    let newX = e.clientX - containerRect.left;
    
    // Constrain slide
    if (newX < 0) newX = 0;
    if (newX > maxSlide) newX = maxSlide;
    
    setSliderPosition(newX);

    // Trigger Transfer on full slide
    if (newX >= maxSlide * 0.95) {
      setIsDragging(false);
      setSliderPosition(maxSlide);
      initiateAtomicTransfer();
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    if (sliderPosition < maxSlide * 0.95 && status === 'IDLE') {
      // Snap back if not fully slid
      setSliderPosition(0);
    }
  };

  useEffect(() => {
    const handleGlobalPointerUp = () => handlePointerUp();
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, [sliderPosition, status]);

  const initiateAtomicTransfer = () => {
    setStatus('PROCESSING');
    
    // Simulate Drizzle/Supabase RPC call delay
    setTimeout(() => {
      setStatus('SUCCESS');
      const generatedHash = '0x' + Math.random().toString(16).substr(2, 12).toUpperCase();
      setTxHash(generatedHash);
      setShowConfetti(true);
      
      // Trigger callback to update ledger with sanitized inputs
      if (onTransferSuccess) {
        // Prevent XSS Injection via the Transfer Note
        const cleanNote = DOMPurify.sanitize(note);
        onTransferSuccess(generatedHash, email, amount, cleanNote);
      }
      
      // Stop confetti after 3s
      setTimeout(() => setShowConfetti(false), 3000);
      
      // Reset form after 5s
      setTimeout(() => {
        setStatus('IDLE');
        setSliderPosition(0);
        setEmail('');
        setAmount('');
        setNote('');
      }, 5000);
    }, 2000);
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden group w-full max-w-md mx-auto">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-row items-start justify-between mb-8 relative z-10">
        <div>
          <h2 className="text-2xl md:text-xl font-bold text-slate-100 leading-tight">Atomic Transfer Engine</h2>
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-2">Drizzle ORM • Postgres RPC</p>
        </div>
        <div className="p-2 bg-slate-950/50 rounded-lg border border-slate-800">
          <Activity className="w-5 h-5 text-blue-500" />
        </div>
      </div>

      {status === 'SUCCESS' ? (
        <div className="flex flex-col items-center justify-center py-10 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4 relative">
            {showConfetti && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Simulated Confetti Particles */}
                <div className="absolute w-2 h-2 bg-blue-500 rounded-full animate-ping [animation-duration:1s]"></div>
                <div className="absolute w-2 h-2 bg-emerald-500 rounded-full animate-ping [animation-duration:1.2s] delay-75"></div>
                <div className="absolute w-2 h-2 bg-yellow-500 rounded-full animate-ping [animation-duration:0.8s] delay-150"></div>
                <div className="absolute w-2 h-2 bg-purple-500 rounded-full animate-ping [animation-duration:1.5s] delay-300"></div>
              </div>
            )}
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-100 mb-1">Transfer Complete</h3>
          <p className="text-sm text-slate-400 mb-6">Funds atomically settled.</p>
          
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 w-full text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Transaction Hash</p>
            <p className="font-mono text-xs text-blue-400">{txHash}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 relative z-10 w-full mt-4">
          {/* Email Input */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="email" 
              placeholder="Recipient Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full h-12 bg-slate-950/50 border border-slate-700 rounded-lg px-4 text-center text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              disabled={status !== 'IDLE'}
            />
          </div>

          {/* Amount Input */}
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="number" 
              placeholder="Amount (USD)" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full h-12 bg-slate-950/50 border border-slate-700 rounded-lg px-4 text-center text-sm text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              disabled={status !== 'IDLE'}
            />
          </div>

          {/* Note Input */}
          <div className="relative mb-2">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <textarea 
              placeholder="Transfer Note (Internal Audit Log)" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="block w-full min-h-[80px] bg-slate-950/50 border border-slate-700 rounded-lg p-3 px-4 text-center text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              disabled={status !== 'IDLE'}
            />
          </div>

          {/* Slide to Confirm Button */}
          <div className="mt-8">
            <p className="text-[10px] text-center font-bold text-slate-500 uppercase tracking-widest mb-2">
              Requires RLS Authorization
            </p>
            
            <div 
              ref={containerRef}
              className={"relative h-14 rounded-full border flex items-center overflow-hidden touch-none " + (status === 'PROCESSING' ? 'bg-blue-600/20 border-blue-500/50' : 'bg-slate-950 border-slate-700')}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerUp}
            >
              {/* Background Progress Fill */}
              <div 
                className="absolute left-0 top-0 bottom-0 bg-blue-600/30 transition-all duration-75"
                style={{ width: (sliderPosition + 28) + 'px' }}
              ></div>

              {/* Status Text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {status === 'PROCESSING' ? (
                  <span className="text-sm font-bold text-blue-400 animate-pulse tracking-widest uppercase">
                    Executing RPC...
                  </span>
                ) : (
                  <span className="text-sm font-bold text-slate-400 tracking-wider">
                    {email && amount ? "Slide to Transfer" : "Enter details to slide"}
                  </span>
                )}
              </div>

              {/* Draggable Thumb */}
              <div 
                ref={sliderRef}
                onPointerDown={handlePointerDown}
                className={"absolute left-1 w-12 h-12 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform duration-75 " + (status === 'PROCESSING' ? 'bg-blue-500 pointer-events-none' : (email && amount ? 'bg-slate-100' : 'bg-slate-700 pointer-events-none'))}
                style={{ transform: "translateX(" + sliderPosition + "px)" }}
              >
                {status === 'PROCESSING' ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowRight className={"w-5 h-5 " + (email && amount ? 'text-slate-900' : 'text-slate-500')} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Security Badge */}
      <div className="mt-6 flex items-center justify-center gap-2 pt-4 border-t border-slate-800">
        <ShieldCheck className="w-3 h-3 text-emerald-500" />
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Atomic Transaction Secured
        </p>
      </div>
    </div>
  );
}
