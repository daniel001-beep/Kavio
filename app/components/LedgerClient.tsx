'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Plus, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Clock, 
  XCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/src/lib/supabase-client';
import { useSession } from '@/app/context/AuthContext';

export interface UITransaction {
  id: string;
  type: string;
  description: string;
  date: string;
  amount: number;
  status: string;
}

export interface DbInvoice {
  id?: string;
  client_name: string;
  description: string;
  amount: number;
  status: 'Paid' | 'Pending';
  created_at?: string;
}

interface LedgerClientProps {
  initialTransactions?: UITransaction[];
}

const fallbackInvoices: DbInvoice[] = [];

export default function LedgerClient({ initialTransactions = [] }: LedgerClientProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list'); // Show invoice list first — create is secondary action
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  // Invoice list data (dynamic state array backed by Supabase with clean baseline defaults)
  const [invoices, setInvoices] = useState<DbInvoice[]>(fallbackInvoices);
  const [loading, setLoading] = useState(false);

  // Form Fields state wired directly to local variables
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('0.00');
  const [status, setStatus] = useState<'Paid' | 'Pending'>('Pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate dynamic invoice numbers based on today's date
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const todayStr = `${dd}/${mm}/${yyyy}`;
  const dueDateObj = new Date(today);
  dueDateObj.setDate(dueDateObj.getDate() + 30);
  const dueDateStr = `${String(dueDateObj.getDate()).padStart(2, '0')}/${String(dueDateObj.getMonth() + 1).padStart(2, '0')}/${dueDateObj.getFullYear()}`;
  const seqId = String(Math.floor(Math.random() * 9000) + 1000);

  const [formFields, setFormFields] = useState({
    reqNumber: `REQ/SLS/INV/${dd}${mm}${yyyy}/${seqId}`,
    invNumber: `INV/SLS/${mm}${yyyy}/${seqId}`,
    docType: 'Invoice',
    invDate: todayStr,
    dueDate: dueDateStr,
  });

  // Start with an empty line item — user fills it in
  const [items, setItems] = useState([
    { id: 1, desc: '', qty: 1, price: 0.00 },
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  // --- DATA FETCH FROM BOTH DRIZZLE AND SUPABASE ---
  // Load initial invoices from localStorage cache for instant 0.1s navigation
  // Load initial invoices from localStorage cache for instant 0.1s navigation
  // STRICT TENANT ISOLATION: Always reset state on email change and never leak other users' cache
  useEffect(() => {
    setInvoices([]); // Reset to clean state to prevent data bleed
    if (userEmail) {
      const cached = localStorage.getItem(`velox_cached_invoices_${userEmail}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setInvoices(parsed);
          }
        } catch (e) {
          console.warn('Failed to parse cached invoices:', e);
        }
      }
    }
  }, [userEmail]);

  useEffect(() => {
    let active = true;
    const fetchInvoicesAndTransactions = async () => {
      setLoading(true);
      const safetyTimeout = setTimeout(() => {
        if (active) {
          setLoading(false);
        }
      }, 1500);

      try {
        let drizzleSucceeded = false;
        let supabaseSucceeded = false;

        // 1. Fetch from Drizzle API
        let drizzleMapped: DbInvoice[] = [];
        try {
          const res = await fetch('/api/ledger/transaction?_t=' + Date.now(), { cache: 'no-store' });
          if (res.ok) {
            drizzleSucceeded = true;
            const data = await res.json();
            const txPayload = Array.isArray(data) ? data : data.transactions || [];
            drizzleMapped = txPayload.map((tx: any) => {
                  let meta = tx.metadata;
                  if (typeof meta === 'string') {
                    try {
                      meta = JSON.parse(meta);
                    } catch (e) {}
                  }
                  return {
                    id: tx.id?.toString(),
                    client_name: meta?.client_name || 'Client',
                    description: meta?.description || tx.description || 'Transaction',
                    amount: Number(tx.amount) / 100, // Convert from cents
                    status: tx.status === 'completed' ? 'Paid' : 'Pending',
                    created_at: tx.createdAt
                  };
                });
          }
        } catch (drizzleErr) {
          console.error('Error fetching drizzle transactions:', drizzleErr);
        }

        // 2. Fetch from Supabase directly if available
        let supabaseMapped: DbInvoice[] = [];
        if (supabase && userEmail) {
          try {
            const { data, error } = await supabase
              .from('invoices')
              .select('*')
              .eq('email', userEmail)
              .order('created_at', { ascending: false });
            
            if (!error) {
              supabaseSucceeded = true;
              supabaseMapped = Array.isArray(data)
                ? data.map((inv: any) => ({
                    id: inv.id?.toString(),
                    client_name: inv.client_name || 'Client',
                    description: inv.description || `Invoice to ${inv.client_name}`,
                    amount: Number(inv.amount || 0),
                    status: inv.status === 'Paid' ? 'Paid' : 'Pending',
                    created_at: inv.created_at
                  }))
                : [];
            }
          } catch (sbErr) {
            console.error('Error fetching supabase invoices:', sbErr);
          }
        } else {
          // If no supabase or no email, mark as succeeded to allow local dev fallback
          supabaseSucceeded = true;
        }

        // 3. Merge them using Map to prevent duplicates
        const mergedMap = new Map<string, DbInvoice>();
        drizzleMapped.forEach(item => {
          if (item.id) mergedMap.set(item.id, item);
        });
        supabaseMapped.forEach(item => {
          if (item.id) mergedMap.set(item.id, item);
        });

        const mergedList = Array.from(mergedMap.values()).sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });

        if (active) {
          // CRITICAL: Overwrite state if at least one database source query succeeded.
          // This allows new accounts to correctly display 0 invoices and resets cache.
          if (drizzleSucceeded || supabaseSucceeded) {
            setInvoices(mergedList);
            
            // Cache the newly retrieved list strictly per-user
            if (userEmail) {
              localStorage.setItem(`velox_cached_invoices_${userEmail}`, JSON.stringify(mergedList));
            }
          } else {
            console.warn('LedgerClient: Both query sources failed — preserving cached invoices');
          }
        }
      } catch (err) {
        console.error('Unexpected error fetching invoices:', err);
      } finally {
        clearTimeout(safetyTimeout);
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchInvoicesAndTransactions();
    return () => {
      active = false;
    };
  }, [activeTab, userEmail]);

  // Live calculations for total value
  const totalAmount = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.qty * item.price), 0);
  }, [items]);

  // Sync state variable for amount whenever items calculation changes
  useEffect(() => {
    setAmount((totalAmount * 1.12).toFixed(2));
  }, [totalAmount]);

  // Live financial computations: reduce over invoices where status === 'Paid'
  const totalRevenue = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === 'Paid')
      .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  }, [invoices]);

  const operatingExpenses = 1500;

  const netIncome = useMemo(() => {
    return totalRevenue - operatingExpenses;
  }, [totalRevenue]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending
          </span>
        );
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Paid
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 rounded-full">
            {status}
          </span>
        );
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now(), desc: 'New Line Item', qty: 1, price: 0.00 }
    ]);
  };

  const handleRemoveItem = (id: number) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleUpdateItem = (id: number, field: 'desc' | 'qty' | 'price', value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Construct the new invoice dynamically for instant Optimistic UI rendering
    const newInvoice: DbInvoice = {
      id: `inv_temp_${Date.now()}`,
      client_name: clientName,
      description: description,
      amount: parseFloat(amount),
      status: status,
      created_at: new Date().toISOString()
    };

    // Map to UITransaction structure for instant Dashboard synchronization
    const newUiTx = {
      id: newInvoice.id,
      type: newInvoice.amount > 0 ? 'CREDIT' : 'DEBIT',
      description: newInvoice.description || `Invoice to ${newInvoice.client_name}`,
      date: new Date().toISOString(),
      amount: newInvoice.amount,
      status: newInvoice.status === 'Paid' ? 'COMPLETED' : 'PENDING'
    };

    // Prepend the new invoice to state instantly
    setInvoices(prev => {
      const updated = [newInvoice, ...prev];
      if (userEmail) {
        localStorage.setItem(`velox_cached_invoices_${userEmail}`, JSON.stringify(updated));
        
        // Synchronously update the Dashboard's transaction cache too!
        const cachedTxStr = localStorage.getItem(`velox_cached_api_transactions_${userEmail}`);
        let cachedTxs = [];
        if (cachedTxStr) {
          try {
            cachedTxs = JSON.parse(cachedTxStr);
          } catch (e) {}
        }
        localStorage.setItem(`velox_cached_api_transactions_${userEmail}`, JSON.stringify([newUiTx, ...cachedTxs]));
      }
      return updated;
    });

    // Switch tab instantly (within 0.05 seconds!)
    setActiveTab('list');

    try {
      const res = await fetch('/api/ledger/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(parseFloat(amount) * 100), // convert to cents
          idempotencyKey: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          description: description,
          status: status,
          metadata: {
            client_name: clientName,
            description: description,
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        // Rollback optimistic update on failure
        setInvoices(prev => {
          const updated = prev.filter(inv => inv.id !== newInvoice.id);
          if (userEmail) {
            localStorage.setItem(`velox_cached_invoices_${userEmail}`, JSON.stringify(updated));
            
            const cachedTxStr = localStorage.getItem(`velox_cached_api_transactions_${userEmail}`);
            if (cachedTxStr) {
              try {
                const cachedTxs = JSON.parse(cachedTxStr);
                const filtered = cachedTxs.filter((tx: any) => tx.id !== newInvoice.id);
                localStorage.setItem(`velox_cached_api_transactions_${userEmail}`, JSON.stringify(filtered));
              } catch (e) {}
            }
          }
          return updated;
        });
        alert(`Failed to save transaction: ${errData.error}`);
      } else {
        // Reset fields
        setDescription('');
        setClientName('ABC Ltd');
        setAmount('0.00');
        setStatus('Pending');

        // Swap out temporary ID with the real ID from response quietly
        const data = await res.json();
        const createdTx = data.transaction;
        if (createdTx && createdTx.id) {
          setInvoices(prev => {
            const updated = prev.map(inv => 
              inv.id === newInvoice.id ? { ...inv, id: createdTx.id.toString() } : inv
            );
            if (userEmail) {
              localStorage.setItem(`velox_cached_invoices_${userEmail}`, JSON.stringify(updated));
              
              const cachedTxStr = localStorage.getItem(`velox_cached_api_transactions_${userEmail}`);
              if (cachedTxStr) {
                try {
                  const cachedTxs = JSON.parse(cachedTxStr);
                  const updatedTxs = cachedTxs.map((tx: any) => 
                    tx.id === newInvoice.id ? { ...tx, id: createdTx.id.toString() } : tx
                  );
                  localStorage.setItem(`velox_cached_api_transactions_${userEmail}`, JSON.stringify(updatedTxs));
                } catch (e) {}
              }
            }
            return updated;
          });
        }
      }
    } catch (err: any) {
      console.error('Unexpected error on submit:', err);
      // Rollback optimistic update on exception
      setInvoices(prev => {
        const updated = prev.filter(inv => inv.id !== newInvoice.id);
        if (userEmail) {
          localStorage.setItem(`velox_cached_invoices_${userEmail}`, JSON.stringify(updated));
          
          const cachedTxStr = localStorage.getItem(`velox_cached_api_transactions_${userEmail}`);
          if (cachedTxStr) {
            try {
              const cachedTxs = JSON.parse(cachedTxStr);
              const filtered = cachedTxs.filter((tx: any) => tx.id !== newInvoice.id);
              localStorage.setItem(`velox_cached_api_transactions_${userEmail}`, JSON.stringify(filtered));
            } catch (e) {}
          }
        }
        return updated;
      });
      alert(`An error occurred: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-2 animate-in fade-in duration-500 w-full max-w-7xl mx-auto">
      
      {/* Navigation Tabs */}
      <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-4">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'list'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50'
          }`}
        >
          Document List
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'create'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50'
          }`}
        >
          Create Invoice Form
        </button>
      </div>

      {/* --- TAB 1: DOCUMENT LIST --- */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-blue-600 tracking-tight">Financial Documents</h1>
                {loading && invoices.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100/50 shadow-sm animate-pulse">
                    <span className="inline-block w-2 h-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                    Syncing...
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm mt-1">Audit and generate invoices and billing documents</p>
            </div>
            <button 
              onClick={() => setActiveTab('create')}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </button>
          </div>

          {/* Real-time Financial Calculations Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm relative overflow-hidden p-4 xs:p-6 sm:p-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Gross Revenue</p>
              <h3 className="text-3xl font-black text-emerald-600 font-mono">
                ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-slate-400 text-xs mt-2 font-medium">Sum of paid invoices dynamically computed via .reduce()</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm relative overflow-hidden p-4 xs:p-6 sm:p-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Income Statement (Net Income)</p>
              <h3 className="text-3xl font-black text-blue-600 font-mono">
                ${netIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-slate-400 text-xs mt-2 font-medium">Reconciled Gross Revenue minus fixed background operating expenses ($1,500.00)</p>
            </div>
          </div>

          {/* Search Card replicating image 2 */}
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between p-4 xs:p-6 sm:p-8">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm text-slate-700 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span>From:</span>
                <div className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Choose Date</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span>To:</span>
                <div className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Choose Date</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice List Table card replicating image 2 */}
          <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm p-4 xs:p-6 sm:p-8 md:p-10">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Client Name</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Description</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Created At</th>
                    <th className="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-semibold text-xs">
                        <span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></span>
                        Loading invoices...
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-semibold text-xs">
                        No financial documents found.
                      </td>
                    </tr>
                  ) : (
                    invoices
                      .filter(i => 
                        (i.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (i.description || '').toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((inv, idx) => (
                        <tr key={inv.id || idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 text-xs font-bold text-slate-700">{inv.client_name}</td>
                          <td className="py-4 px-6 text-xs text-slate-500 max-w-md truncate">{inv.description}</td>
                          <td className="py-4 px-6 text-xs font-semibold text-slate-500">
                            {inv.created_at ? new Date(inv.created_at).toLocaleString() : 'Just now'}
                          </td>
                          <td className="py-4 px-6 text-right text-xs font-mono font-bold text-slate-800">
                            ${Number(inv.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-6">{getStatusBadge(inv.status)}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 2: CREATE INVOICE FORM (Pixel-perfect replication of uploaded Image 3!) --- */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          
          {/* Top Titles */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Financial Documents</span>
            <h1 className="text-3xl font-black text-slate-800">Create Invoice</h1>
          </div>

          {/* Action Button */}
          <div className="flex justify-start">
            <button
              type="button"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs tracking-wide shadow-sm hover:shadow transition-colors"
            >
              Preview Request
            </button>
          </div>

          {/* Main Form Fields Card */}
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm p-4 xs:p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              


              {/* Client Name / Customer Data */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Name</label>
                <select
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="ABC Ltd">ABC Ltd</option>
                  <option value="XYZ Corp">XYZ Corp</option>
                  <option value="Acme Corp">Acme Corp</option>
                  <option value="Global Inc">Global Inc</option>
                </select>
              </div>

              {/* Document Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Document Type</label>
                <select
                  value={formFields.docType}
                  onChange={(e) => setFormFields({ ...formFields, docType: e.target.value })}
                  className="px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="Invoice">Invoice</option>
                  <option value="Debit Note">Debit Note</option>
                  <option value="Credit Note">Credit Note</option>
                </select>
              </div>

              {/* Invoice Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Date</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formFields.invDate}
                    onChange={(e) => setFormFields({ ...formFields, invDate: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
                  />
                  <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Invoice Due Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Due Date</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formFields.dueDate}
                    onChange={(e) => setFormFields({ ...formFields, dueDate: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
                  />
                  <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Invoice Amount Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 font-mono font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Status Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Paid' | 'Pending')}
                  className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

            </div>
          </div>

          {/* Itemized Calculation Grid Card (Exact match of table in Image 3!) */}
          <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm p-3 xs:p-5 sm:p-8 md:p-10">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800">Invoice Items & Taxes</h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item Row
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-6 text-left w-16">No</th>
                    <th className="py-3.5 px-6 text-left">Description</th>
                    <th className="py-3.5 px-6 text-center w-28">Quantity</th>
                    <th className="py-3.5 px-6 text-right w-36">Unit Price (USD)</th>
                    <th className="py-3.5 px-6 text-right w-36">Amount</th>
                    <th className="py-3.5 px-6 text-right w-36">Tax Base</th>
                    <th className="py-3.5 px-6 text-right w-44">Value Added Tax (12%)</th>
                    <th className="py-3.5 px-6 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {items.map((item, idx) => {
                    const rowAmount = item.qty * item.price;
                    const rowVat = rowAmount * 0.12;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/20 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-400">{idx + 1}</td>
                        <td className="py-4 px-6">
                          <input
                            type="text"
                            value={item.desc}
                            onChange={(e) => handleUpdateItem(item.id, 'desc', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none"
                          />
                        </td>
                        <td className="py-4 px-6 text-center">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleUpdateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                            className="w-20 px-3 py-2 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none"
                          />
                        </td>
                        <td className="py-4 px-6 text-right">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleUpdateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                            className="w-28 px-3 py-2 text-right bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono font-bold focus:outline-none"
                          />
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-slate-700 bg-slate-50/20">
                          {rowAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-semibold text-slate-600">
                          {rowAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-slate-700">
                          {rowVat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-slate-300 hover:text-rose-500 rounded border border-rose-100 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summation Total Summary */}
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col items-stretch sm:items-end gap-2 text-xs font-semibold text-slate-600">
              <div className="flex justify-between w-full sm:w-64">
                <span>Subtotal (Tax Base):</span>
                <span className="font-mono text-slate-800">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between w-full sm:w-64">
                <span>Value Added Tax (12%):</span>
                <span className="font-mono text-slate-800">${(totalAmount * 0.12).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between w-full sm:w-64 pt-2 border-t border-slate-200 text-sm font-bold text-slate-800">
                <span>Grand Total:</span>
                <span className="font-mono text-blue-600">${(totalAmount * 1.12).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="px-5 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold rounded-lg text-xs transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold rounded-lg text-xs shadow-md transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Processing...
                </>
              ) : (
                'Create Invoice Request'
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
