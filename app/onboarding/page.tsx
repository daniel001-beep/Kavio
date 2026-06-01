'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Wallet, ArrowRight, CheckCircle2, Loader } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [accounts, setAccounts] = useState([
    { id: 1, name: 'Main Checking', type: 'Bank Account', selected: true },
    { id: 2, name: 'Business Savings', type: 'Bank Account', selected: false },
    { id: 3, name: 'Petty Cash', type: 'Cash Wallet', selected: false },
  ]);

  const toggleAccount = (id: number) => {
    setAccounts(accounts.map(acc => 
      acc.id === id ? { ...acc, selected: !acc.selected } : acc
    ));
  };

  const handleComplete = async () => {
    setLoading(true);
    setError('');
    try {
      const selectedAccs = accounts.filter(a => a.selected).map(a => a.name);
      
      const res = await fetch('/api/business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: businessName,
          industry,
          accounts: selectedAccs,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete onboarding profile');
      }

      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">1</span>
          Create Business
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">Business Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="e.g. Acme Studio"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-1.5">Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="block w-full pl-3 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none font-medium"
            >
              <option value="">Select an industry...</option>
              <option value="software">Software & IT</option>
              <option value="agency">Design & Agency</option>
              <option value="freelance">Freelance Consulting</option>
              <option value="ecommerce">E-Commerce</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setStep(2)}
          disabled={!businessName}
          className="w-full mt-8 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-right-8 duration-300">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">2</span>
        Create Accounts
      </h2>
      <p className="text-sm text-slate-500 font-medium mb-4">Select the accounts you want to track for {businessName}.</p>
      
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-600">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {accounts.map((account) => (
          <div 
            key={account.id}
            onClick={() => !loading && toggleAccount(account.id)}
            className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
              account.selected 
                ? 'border-blue-500 bg-blue-50/70' 
                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex-1 flex items-center gap-3">
              <div className={`p-2 rounded-md ${account.selected ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-800 text-sm">{account.name}</div>
                <div className="text-xs text-slate-450 font-medium">{account.type}</div>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${account.selected ? 'bg-blue-500 text-white' : 'border border-slate-300'}`}>
              {account.selected && <CheckCircle2 className="w-4 h-4" />}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleComplete}
        disabled={loading || !accounts.some(a => a.selected)}
        className="w-full mt-8 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
      >
        {loading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Configuring Business Ledger...
          </>
        ) : (
          <>
            Start Tracking Finances
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
