'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Key, Webhook, Terminal, Copy, Plus, CheckCircle2, Eye, EyeOff, ShieldAlert } from 'lucide-react';

export default function DeveloperPortalPage() {
  const [keys, setKeys] = useState([
    { id: '1', name: 'Production Main App', key: 'vk_live_***************************', created: '2025-10-14', lastUsed: '2 mins ago' },
    { id: '2', name: 'Staging Environment', key: 'vk_test_***************************', created: '2025-11-02', lastUsed: '5 days ago' }
  ]);
  
  const [webhooks, setWebhooks] = useState([
    { id: '1', url: 'https://api.yourstartup.com/webhooks/velox', status: 'active', events: 'All Events' }
  ]);

  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerateKey = () => {
    const generated = 'vk_live_' + Array.from({length: 32}, () => Math.random().toString(36)[2]).join('');
    setNewKeyValue(generated);
    setShowNewKey(true);
    
    // Add to list visually (masked)
    setKeys([
      { id: Date.now().toString(), name: 'Newly Generated Key', key: 'vk_live_***************************', created: 'Just now', lastUsed: 'Never' },
      ...keys
    ]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newKeyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="pt-4 animate-in fade-in duration-500 max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
              <Terminal className="w-8 h-8 text-blue-500" />
              Developer Portal
            </h1>
            <p className="text-slate-400 mt-2">Manage API keys, webhooks, and programmatic treasury access.</p>
          </div>
          
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-sm font-bold rounded-sm transition-all shadow-lg hover:shadow-xl">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            View Access Logs
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* API Keys Section */}
            <div className="bg-slate-900 border border-slate-700 rounded-sm overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-slate-100">Live API Keys</h2>
                </div>
                <button 
                  onClick={handleGenerateKey}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Generate Key
                </button>
              </div>

              {/* New Key Reveal Box */}
              {showNewKey && (
                <div className="m-6 p-6 bg-slate-950 border border-emerald-500/30 rounded-sm relative animate-in zoom-in-95 duration-300">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
                  <p className="text-sm font-bold text-slate-100 mb-2">New API Key Generated</p>
                  <p className="text-xs text-rose-400 font-medium mb-4 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Please copy this key now. For security reasons, you will not be able to see it again.
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-slate-900 border border-slate-700 p-3 rounded-sm font-mono text-emerald-400 text-sm tracking-wider break-all">
                      {newKeyValue}
                    </code>
                    <button 
                      onClick={handleCopy}
                      className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-sm transition-colors flex items-center gap-2 shrink-0"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Key List */}
              <div className="divide-y divide-slate-800">
                {keys.map((k) => (
                  <div key={k.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/50 transition-colors">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 mb-1">{k.name}</h3>
                      <div className="flex items-center gap-3">
                        <code className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded-sm border border-slate-800">
                          {k.key}
                        </code>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Created</p>
                        <p className="text-xs text-slate-300 font-mono">{k.created}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Used</p>
                        <p className="text-xs text-emerald-400 font-mono">{k.lastUsed}</p>
                      </div>
                      <button className="text-slate-500 hover:text-rose-400 transition-colors p-2">
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Webhooks Section */}
            <div className="bg-slate-900 border border-slate-700 rounded-sm overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Webhook className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-bold text-slate-100">Webhooks</h2>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold rounded-sm transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Endpoint
                </button>
              </div>

              <div className="divide-y divide-slate-800">
                {webhooks.map((w) => (
                  <div key={w.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-2 h-2 rounded-sm bg-emerald-500 animate-pulse"></span>
                        <h3 className="text-sm font-bold text-slate-200 font-mono">{w.url}</h3>
                      </div>
                      <p className="text-xs text-slate-500">Listening to: <span className="font-bold text-slate-300">{w.events}</span></p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-sm transition-colors">
                        Ping
                      </button>
                      <button className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-sm transition-colors">
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Documentation Snippets */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-sm shadow-xl sticky top-32">
              <h3 className="text-sm font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">Quick Start Guide</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">1. Authenticate Request</p>
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-sm">
                    <code className="text-xs font-mono text-blue-400 break-all">
                      curl -X GET https://api.velox.finance/v1/treasury/balance \<br/>
                      -H "Authorization: Bearer vk_live_..."
                    </code>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">2. Execute Transfer (RPC)</p>
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-sm">
                    <code className="text-xs font-mono text-emerald-400 break-all">
                      POST /v1/transactions/execute<br/>
                      {`{`}<br/>
                      &nbsp;&nbsp;"amount": 50000,<br/>
                      &nbsp;&nbsp;"destination": "vault_id"<br/>
                      {`}`}
                    </code>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <a href="#" className="text-sm font-bold text-blue-500 hover:text-blue-400 flex items-center justify-between group">
                  Read Full API Documentation
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </a>
              </div>
            </div>

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
