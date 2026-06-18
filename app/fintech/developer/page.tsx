'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Key, Webhook, Terminal, Copy, Plus, CheckCircle2, Eye, EyeOff, ShieldAlert, Play, Cpu, Sparkles } from 'lucide-react';

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

  // API Playground State
  const [sandboxAmount, setSandboxAmount] = useState('1500.00');
  const [sandboxEndpoint, setSandboxEndpoint] = useState('POST /api/v1/ledger');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '// Velox Ledger Sandbox v2.4 Console Ready.',
    '// Configure fields above and click "⚡ Run Sandbox Request" to execute...'
  ]);
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);
  const [docTab, setDocTab] = useState<'curl' | 'js' | 'python'>('curl');

  const handleGenerateKey = () => {
    const generated = 'vk_live_' + Array.from({length: 32}, () => Math.random().toString(36)[2]).join('');
    setNewKeyValue(generated);
    setShowNewKey(true);
    
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

  // Run Sandbox Simulation with Typing Effects
  const handleRunSandbox = async () => {
    if (isSandboxRunning) return;
    setIsSandboxRunning(true);
    setTerminalLogs(['> Initializing secure handshake with Velox Node (vk_live_secure)...']);

    const amountNum = parseFloat(sandboxAmount) || 0;
    const steps = [
      `> Connecting to route: ${sandboxEndpoint}`,
      `> Payload parsed: { amount: ${Math.round(amountNum * 100)} cents, Duplicate PreventionKey: "idemp_${Math.random().toString(36).substring(2, 9)}" }`,
      `> Checking double-entry balance constraints...`,
      `> [ACID isolated] Debit: -$${amountNum.toFixed(2)} [Client Main Account]`,
      `> [ACID isolated] Credit: +$${amountNum.toFixed(2)} [System Settlement Offset]`,
      `> Generating SHA-256 integrity block signature...`,
      `> Block Signed: sha256_vk_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
      `> Vault allocations matched. Ledger balanced (Credits + Debits = $0.00).`,
      `> Response: 200 OK | Transaction processed and streamed successfully!`
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setTerminalLogs((prev) => [...prev, steps[i]]);
    }
    setIsSandboxRunning(false);
  };

  return (
    <DashboardLayout>
      <div className="pt-4 animate-in fade-in duration-500 max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              <Terminal className="w-8 h-8 text-blue-600 animate-pulse" />
              Developer Portal
            </h1>
            <p className="text-slate-500 mt-2">Manage API keys, sandbox environments, and programmatic treasury access.</p>
          </div>
          
          <button className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-all shadow-sm active:scale-95">
            <ShieldAlert className="w-4 h-4 text-amber-500 animate-bounce" />
            View Access Logs
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* API Keys Section */}
            <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Live API Keys</h2>
                </div>
                <button 
                  onClick={handleGenerateKey}
                  className="flex items-center gap-2 px-4.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Generate Key
                </button>
              </div>

              {/* New Key Reveal Box */}
              {showNewKey && (
                <div className="m-6 p-6 bg-emerald-50/50 border border-emerald-200 rounded-[16px] relative animate-in zoom-in-95 duration-300">
                  <p className="text-sm font-bold text-emerald-800 mb-2">New API Key Generated</p>
                  <p className="text-xs text-rose-500 font-semibold mb-4 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Please copy this key now. For security reasons, you will not be able to see it again.
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white border border-slate-200 p-3 rounded-xl font-mono text-emerald-600 text-xs tracking-wider break-all shadow-inner">
                      {newKeyValue}
                    </code>
                    <button 
                      onClick={handleCopy}
                      className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white rounded-xl transition-all active:scale-95 flex items-center gap-2 shrink-0 shadow-sm text-xs font-bold"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-450" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Key List */}
              <div className="divide-y divide-slate-100">
                {keys.map((k) => (
                  <div key={k.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                    <div>
                      <h3 className="text-sm font-bold text-slate-700 mb-1.5">{k.name}</h3>
                      <div className="flex items-center gap-3">
                        <code className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          {k.key}
                        </code>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right shrink-0">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Created</p>
                        <p className="text-xs text-slate-650 font-mono mt-0.5">{k.created}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Used</p>
                        <p className="text-xs text-emerald-600 font-mono mt-0.5">{k.lastUsed}</p>
                      </div>
                      <button className="text-slate-400 hover:text-rose-500 font-bold transition-colors p-2 text-xs">
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Webhooks Section */}
            <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Webhook className="w-5 h-5 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Webhooks</h2>
                </div>
                <button className="flex items-center gap-2 px-4.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95">
                  <Plus className="w-3.5 h-3.5" />
                  Add Endpoint
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {webhooks.map((w) => (
                  <div key={w.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-2.5 h-2.5 rounded bg-emerald-500 animate-pulse"></span>
                        <h3 className="text-xs font-bold text-slate-650 font-mono">{w.url}</h3>
                      </div>
                      <p className="text-xs text-slate-450 font-medium">Listening to: <span className="font-bold text-slate-600">{w.events}</span></p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl transition-all shadow-sm active:scale-95">
                        Ping
                      </button>
                      <button className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl transition-all shadow-sm active:scale-95">
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
          
          {/* Right Column: Live Interactive Ledger API Playground */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[24px] shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
              
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800">
                <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest m-0">Live Sandbox Playground</h3>
              </div>

              {/* Endpoint Selection & Inputs */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-2">Select Endpoint</label>
                  <select 
                    value={sandboxEndpoint}
                    onChange={(e) => setSandboxEndpoint(e.target.value)}
                    className="w-full bg-[#0d131f] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-blue-450 font-bold font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="POST /api/v1/ledger">POST /api/v1/ledger (Simulate Transaction)</option>
                    <option value="GET /api/v1/ledger/balance">GET /api/v1/ledger/balance (Fetch Balance)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-2">Simulated Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs text-slate-500 font-bold">$</span>
                    <input 
                      type="number"
                      value={sandboxAmount}
                      onChange={(e) => setSandboxAmount(e.target.value)}
                      placeholder="1,500.00"
                      disabled={isSandboxRunning}
                      className="w-full bg-[#0d131f] border border-slate-800 rounded-xl pl-7 pr-4 py-2.5 text-xs text-slate-200 font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Glowing Run Trigger */}
              <button 
                onClick={handleRunSandbox}
                disabled={isSandboxRunning}
                className="w-full h-11 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-all active:scale-[0.98] font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {isSandboxRunning ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Play className="w-3.5 h-3.5 text-blue-100 fill-white" />
                )}
                <span>{isSandboxRunning ? 'Repressing Ledger Node...' : '⚡ Run Sandbox Request'}</span>
              </button>

              {/* Matrix Console viewport */}
              <div className="mt-6">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-2">Terminal Output</label>
                <div className="w-full bg-[#070b13] border border-slate-800 rounded-xl p-4 font-mono text-[10px] text-slate-400 space-y-2 h-[220px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shadow-inner leading-relaxed">
                  {terminalLogs.map((log, i) => (
                    <div key={i} className={`break-all ${log.startsWith('>') ? 'text-emerald-400 font-semibold' : log.startsWith('//') ? 'text-slate-500' : 'text-slate-450'}`}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick documentation Tab Cards */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[24px] shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Documentation Snippets</span>
                <div className="flex bg-[#0d131f] border border-slate-800 rounded-lg p-0.5 text-[9px] font-bold text-slate-400">
                  <button onClick={() => setDocTab('curl')} className={`px-2 py-1 rounded ${docTab === 'curl' ? 'bg-slate-800 text-blue-400 shadow-sm' : ''}`}>cURL</button>
                  <button onClick={() => setDocTab('js')} className={`px-2 py-1 rounded ${docTab === 'js' ? 'bg-slate-800 text-blue-400 shadow-sm' : ''}`}>JS</button>
                  <button onClick={() => setDocTab('python')} className={`px-2 py-1 rounded ${docTab === 'python' ? 'bg-slate-800 text-blue-400 shadow-sm' : ''}`}>Python</button>
                </div>
              </div>

              {docTab === 'curl' && (
                <div className="bg-[#070b13] border border-slate-800/80 p-3 rounded-xl font-mono text-[10.5px] text-slate-300 leading-normal select-all">
                  <span className="text-emerald-500 font-bold">curl</span> -X POST "https://api.velox.finance/v1/ledger" \<br/>
                  &nbsp;&nbsp;-H "Authorization: Bearer vk_live_..." \<br/>
                  &nbsp;&nbsp;-d '{`{"amount": 150000, "currency": "USD"}`}'
                </div>
              )}

              {docTab === 'js' && (
                <div className="bg-[#070b13] border border-slate-800/80 p-3 rounded-xl font-mono text-[10.5px] text-slate-300 leading-normal select-all">
                  <span className="text-purple-400">await</span> <span className="text-blue-400">fetch</span>(<span className="text-amber-400">'https://api.velox.finance/v1/ledger'</span>, {`{`}<br/>
                  &nbsp;&nbsp;method: <span className="text-amber-400">'POST'</span>,<br/>
                  &nbsp;&nbsp;headers: {`{`} Authorization: <span className="text-amber-400">'Bearer vk_live_...'</span> {`}`},<br/>
                  &nbsp;&nbsp;body: <span className="text-blue-400">JSON</span>.<span className="text-blue-400">stringify</span>({`{ amount: 150000 }`})<br/>
                  {`}`});
                </div>
              )}

              {docTab === 'python' && (
                <div className="bg-[#070b13] border border-slate-800/80 p-3 rounded-xl font-mono text-[10.5px] text-slate-300 leading-normal select-all">
                  <span className="text-emerald-500">import</span> requests<br/>
                  res = requests.post(<br/>
                  &nbsp;&nbsp;<span className="text-amber-400">"https://api.velox.finance/v1/ledger"</span>,<br/>
                  &nbsp;&nbsp;headers={"{"}<span className="text-amber-400">"Authorization"</span>: <span className="text-amber-450">"Bearer vk_live_..."</span>{"}"},<br/>
                  &nbsp;&nbsp;json={"{"}<span className="text-amber-450">"amount"</span>: 150000{"}"}<br/>
                  )
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
