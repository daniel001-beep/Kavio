'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/src/lib/supabase-client';
import DashboardLayout from '@/app/components/DashboardLayout';
import { useSession } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Search, 
  Plus, 
  Trash2, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronDown, 
  FileText,
  Filter,
  ArrowUpDown
} from 'lucide-react';

export default function JournalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const currentUser = session?.user;

  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  const [invoices, setInvoices] = useState<any[]>([]);
  const [localJournals, setLocalJournals] = useState<any[]>([]);

  // Authentication protection redirect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/fintech/journals');
    }
  }, [status, router]);

  // Load manual journals from localStorage per-user
  useEffect(() => {
    if (status === 'authenticated' && currentUser?.id) {
      const storageKey = `velox_manual_journals_${currentUser.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setLocalJournals(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse local journals:', e);
        }
      } else {
        setLocalJournals([]);
      }
    }
  }, [status, currentUser?.id]);

  // Persist manual journals to localStorage when updated
  useEffect(() => {
    if (status === 'authenticated' && currentUser?.id) {
      const storageKey = `velox_manual_journals_${currentUser.id}`;
      localStorage.setItem(storageKey, JSON.stringify(localJournals));
    }
  }, [localJournals, status, currentUser?.id]);

  // Fetch invoices (transactions) on mount with instant localStorage cache fallback
  useEffect(() => {
    if (status !== 'authenticated' || !currentUser?.id) return;

    // Load initial invoices from localStorage cache for sub-0.1s load
    const userEmail = currentUser.email;
    if (userEmail) {
      const cached = localStorage.getItem(`velox_cached_invoices_${userEmail}`);
      if (cached) {
        try {
          setInvoices(JSON.parse(cached));
        } catch (e) {}
      }
    }

    const fetchInvoices = async () => {
      try {
        const res = await fetch('/api/ledger/transaction?_t=' + Date.now(), { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const txData = Array.isArray(data) ? data : data.transactions || [];
          // Map Drizzle transactions to client format safely parsing metadata
          const mapped = txData.map((tx: any) => {
            let meta = tx.metadata;
            if (typeof meta === 'string') {
              try {
                meta = JSON.parse(meta);
              } catch (e) {}
            }
            return {
              id: tx.id,
              userId: tx.userId,
              client_name: meta?.client_name || 'Client',
              description: meta?.description || tx.description || 'Transaction',
              amount: Number(tx.amount) / 100, // cents to dollars
              status: tx.status === 'completed' ? 'Paid' : 'Pending',
              created_at: tx.createdAt
            };
          });
          setInvoices(mapped);
          
          // Cache the fresh list for all other pages to use
          if (userEmail) {
            localStorage.setItem(`velox_cached_invoices_${userEmail}`, JSON.stringify(mapped));
          }
        }
      } catch (err) {
        console.error('Error fetching transactions for journals:', err);
      }
    };
    fetchInvoices();
  }, [activeTab, status, currentUser?.id, currentUser?.email]);

  // Compute live journals list
  const journals = useMemo(() => {
    const invoiceJournals = invoices.map((inv) => ({
      date: inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-GB') : '21/11/2025',
      category: 'Revenue',
      gl: inv.id ? `REV/GEL/2025/10/000${inv.id.toString().substring(0, 4)}` : 'REV/GEL/2025/10/0001',
      title: inv.description || `Invoice to ${inv.client_name}`,
      created: inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-GB') : '21/11/2025',
      by: currentUser?.name || currentUser?.email || 'User',
      status: inv.status === 'Paid' ? 'Issued' : 'Waiting'
    }));

    return [...localJournals, ...invoiceJournals];
  }, [invoices, localJournals, currentUser]);

  // Create Journal form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'Revenue',
    docNumber: 'REQ/SLS/INV/06112025/0005',
    taxNumber: 'TAX/2025/0021',
    date: '21/11/2025',
    customer: ''
  });

  const [coaItems, setCoaItems] = useState([
    { id: 1, coa: '1101 - Accounts Receivable - Trade', debit: '0.00', credit: '0.00' },
    { id: 2, coa: '4101 - Revenue - Product Sales', debit: '0.00', credit: '0.00' }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Waiting':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-purple-600 bg-purple-50 border border-purple-100 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
            Waiting for Approval
          </span>
        );
      case 'Posted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-pink-600 bg-pink-50 border border-pink-100 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
            Posted
          </span>
        );
      case 'Issued':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Issued
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const handleAddCoaRow = () => {
    setCoaItems([
      ...coaItems,
      { id: Date.now(), coa: 'Select Account', debit: '0', credit: '0' }
    ]);
  };

  const handleRemoveCoaRow = (id: number) => {
    setCoaItems(coaItems.filter(item => item.id !== id));
  };

  const [submittingJournal, setSubmittingJournal] = useState(false);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingJournal(true);
      
      // Extract amount in cents from the Accounts Receivable (1101) or other rows
      const arItem = coaItems.find(item => item.coa.includes('Accounts Receivable') || item.coa.includes('1101') || item.coa.includes('1010'));
      const amountVal = arItem ? parseFloat(arItem.debit) || parseFloat(arItem.credit) || 0 : 0;
      const amountCents = Math.floor(amountVal * 100);

      // Create transaction in real database as "Pending" (Unpaid Invoice)
      const Duplicate PreventionKey = `journal_${Date.now()}_${Math.random()}`;
      const response = await fetch('/api/ledger/transaction', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Duplicate Prevention-Key': Duplicate PreventionKey
        },
        body: JSON.stringify({
          amount: formData.type === 'Expense' ? -amountCents : amountCents,
          Duplicate PreventionKey: Duplicate PreventionKey,
          description: formData.title,
          metadata: {
            client_name: formData.customer || 'Client',
            type: formData.type,
            gl_number: 'GL/' + Math.floor(1000 + Math.random() * 9000),
            tax_number: formData.taxNumber,
            doc_number: formData.docNumber,
          },
          status: "Pending" // Unpaid invoice by default to test the AR aging schedule!
        })
      });

      if (response.ok) {
        const newEntry = {
          date: formData.date,
          category: formData.type,
          gl: 'GL/' + Math.floor(1000 + Math.random() * 9000),
          title: formData.title,
          created: new Date().toLocaleDateString(),
          by: currentUser?.name || currentUser?.email || 'User',
          status: 'Waiting'
        };
        setLocalJournals([newEntry, ...localJournals]);
        setActiveTab('list');
      } else {
        alert("Failed to save journal entry to database.");
      }
    } catch (err) {
      console.error("Failed to post manual journal transaction:", err);
    } finally {
      setSubmittingJournal(false);
    }
  };

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-semibold animate-pulse">Loading secure journal database...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="pt-4 px-2 xs:px-4 sm:px-6 animate-in fade-in duration-500 max-w-7xl mx-auto w-full min-w-0">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 sm:gap-4 mb-8 border-b border-slate-200 pb-4 overflow-x-auto min-w-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3 xs:px-5 py-2 text-xs xs:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50'
            }`}
          >
            Journal List
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3 xs:px-5 py-2 text-xs xs:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50'
            }`}
          >
            Create Journal
          </button>
        </div>

        {/* --- VIEW 1: JOURNAL LIST TAB --- */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            
            {/* Header Title and Search bar replicating the 5th screenshot */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-black text-blue-600 tracking-tight">Journal List</h1>
                <p className="text-slate-400 text-sm mt-1">Manage account balances</p>
              </div>
              <button 
                onClick={() => setActiveTab('create')}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Journal
              </button>
            </div>

            {/* Inputs & Date Filters card */}
            <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between p-4 xs:p-6 sm:p-8 w-full min-w-0">
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

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                <div className="flex items-center justify-between sm:justify-start gap-2 text-xs font-semibold text-slate-500 w-full sm:w-auto">
                  <span>From:</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="flex-1 sm:flex-none px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-2 text-xs font-semibold text-slate-500 w-full sm:w-auto">
                  <span>To:</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="flex-1 sm:flex-none px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Sort & Filter Options Row */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sort:</span>
                <span className="text-blue-600 font-bold">Latest</span>
              </div>
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter:</span>
                <span className="text-blue-600 font-bold">Status</span>
              </div>
            </div>

            {/* Main Journal List Table card */}
            <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm p-4 xs:p-6 sm:p-8 md:p-10">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Transaction Date</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Category</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">GL Number</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Title</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Created Date</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Created By</th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="py-4 px-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {journals
                      .filter(j => j.title.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((journal, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 text-xs font-bold text-slate-600">{journal.date}</td>
                          <td className="py-4 px-6 text-xs font-semibold text-slate-500">{journal.category}</td>
                          <td className="py-4 px-6 text-xs font-mono font-bold text-slate-600">{journal.gl}</td>
                          <td className="py-4 px-6 text-xs font-bold text-slate-700 max-w-[220px] truncate">{journal.title}</td>
                          <td className="py-4 px-6 text-xs text-slate-500">{journal.created}</td>
                          <td className="py-4 px-6 text-xs font-bold text-slate-600">{journal.by}</td>
                          <td className="py-4 px-6">{getStatusBadge(journal.status)}</td>
                          <td className="py-4 px-6 text-right">
                            <button className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-50 transition-colors">
                              •••
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* --- VIEW 2: CREATE JOURNAL FORM TAB --- */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateSubmit} className="space-y-8">
            
            {/* Header Title */}
            <div>
              <h1 className="text-3xl font-black text-blue-600 tracking-tight">Create Journal</h1>
              <p className="text-slate-400 text-sm mt-1">Record a new manual journal entry into the system</p>
            </div>

            {/* Inputs Grid Card replicating the 4th screenshot */}
            <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm p-4 xs:p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="E.g. Invoice for Shipment to Japan"
                    required
                  />
                </div>

                {/* Journal Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Journal Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                  </select>
                </div>

                {/* Document Number */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Document Number</label>
                  <input
                    type="text"
                    value={formData.docNumber}
                    onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                    className="px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Tax Number */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tax Number</label>
                  <input
                    type="text"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    className="px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
                  />
                </div>

                {/* Transaction Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction Date</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
                    />
                    <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Customer Data */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Data</label>
                  <input
                    type="text"
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    className="px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none"
                  />
                </div>

              </div>

              {/* Automate Generation Button */}
              <div className="mt-6 flex justify-start">
                <button
                  type="button"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  Generate Automate Journal
                </button>
              </div>
            </div>

            {/* Supporting Files Upload Section replicating the 4th screenshot */}
            <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm p-4 xs:p-6 sm:p-8">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Supporting Files</h2>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:shadow flex items-center gap-2 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload Documents
                </button>
                <span className="px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-100 rounded-lg border border-slate-200">
                  4 Documents Uploaded
                </span>
              </div>
            </div>

            {/* Chart of Accounts (CoA) Grid Card replicating the 4th screenshot */}
            <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm p-4 xs:p-6 sm:p-8 md:p-10">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h2 className="text-base font-bold text-slate-800">Chart of Accounts (CoA)</h2>
                <button
                  type="button"
                  onClick={handleAddCoaRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Row
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-6 text-left w-16">No</th>
                      <th className="py-3 px-6 text-left">Chart of Accounts (CoA)</th>
                      <th className="py-3 px-6 text-right w-48">Debit</th>
                      <th className="py-3 px-6 text-right w-48">Credit</th>
                      <th className="py-3 px-6 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {coaItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/20 transition-colors">
                        <td className="py-4 px-6 text-sm font-semibold text-slate-400">{idx + 1}</td>
                        <td className="py-4 px-6">
                          <select
                            value={item.coa}
                            onChange={(e) => {
                              const updated = [...coaItems];
                              updated[idx].coa = e.target.value;
                              setCoaItems(updated);
                            }}
                            className="w-full max-w-md px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
                          >
                            <option value="1101 - Accounts Receivable - Trade">1101 - Accounts Receivable - Trade</option>
                            <option value="4101 - Revenue - Product Sales">4101 - Revenue - Product Sales</option>
                            <option value="1010 - Bank Account - Operating">1010 - Bank Account - Operating</option>
                            <option value="2101 - Accounts Payable - Vendor">2101 - Accounts Payable - Vendor</option>
                          </select>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <input
                            type="text"
                            value={item.debit}
                            onChange={(e) => {
                              const updated = [...coaItems];
                              updated[idx].debit = e.target.value;
                              setCoaItems(updated);
                            }}
                            className="w-32 px-3 py-2 text-sm text-right bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono font-bold focus:outline-none"
                          />
                        </td>
                        <td className="py-4 px-6 text-right">
                          <input
                            type="text"
                            value={item.credit}
                            onChange={(e) => {
                              const updated = [...coaItems];
                              updated[idx].credit = e.target.value;
                              setCoaItems(updated);
                            }}
                            className="w-32 px-3 py-2 text-sm text-right bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono font-bold focus:outline-none"
                          />
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveCoaRow(item.id)}
                            className="p-1 text-slate-300 hover:text-rose-500 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Form Actions */}
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
                disabled={submittingJournal}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-md transition-all disabled:opacity-50"
              >
                {submittingJournal ? 'Saving Entry...' : 'Save Journal Entry'}
              </button>
            </div>

          </form>
        )}

      </div>
    </DashboardLayout>
  );
}
