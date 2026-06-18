"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign, 
  ArrowUpRight, 
  Trash2,
  Loader2,
  FileText,
  AlertCircle,
  TrendingUp,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  ExternalLink,
  Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useNotifications } from "@/app/context/NotificationContext";
import { useSession } from "@/app/context/AuthContext";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string | null;
  location: string | null;
  industry: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: "DRAFT" | "SENT" | "VIEWED" | "OVERDUE" | "PAID";
  projectDescription: string;
  client: {
    id: string;
  };
}

export default function ClientsPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clientTagsList, setClientTagsList] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Tag Filter and Risk Filter
  const [tagFilter, setTagFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { addNotification } = useNotifications();

  // Form states
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");
  const [notes, setNotes] = useState("");
  const [customTags, setCustomTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [clientsRes, invoicesRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/invoices")
      ]);

      if (clientsRes.ok && invoicesRes.ok) {
        const clientsData = await clientsRes.json();
        const invoicesData = await invoicesRes.json();
        setClients(clientsData);
        setInvoices(invoicesData);

        // Fetch tags for each client in parallel
        const tagsMap: Record<string, string[]> = {};
        await Promise.all(
          clientsData.map(async (client: any) => {
            try {
              const tagsRes = await fetch(`/api/clients/${client.id}`);
              if (tagsRes.ok) {
                const detail = await tagsRes.json();
                tagsMap[client.id] = (detail.tags || []).map((t: any) => t.tag);
              }
            } catch (e) {
              console.error("Failed to load tags for client " + client.id, e);
            }
          })
        );
        setClientTagsList(tagsMap);

        // Update local storage cache
        if (userEmail) {
          const cachePayload = {
            clients: clientsData,
            invoices: invoicesData,
            tagsMap
          };
          localStorage.setItem(`kavio_cached_clients_data_${userEmail}`, JSON.stringify(cachePayload));
        }
      }
    } catch (e) {
      console.error("Failed to load clients data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync cache on mount
  useEffect(() => {
    if (userEmail) {
      const cached = localStorage.getItem(`kavio_cached_clients_data_${userEmail}`);
      if (cached) {
        try {
          const { clients: cData, invoices: iData, tagsMap } = JSON.parse(cached);
          setClients(cData || []);
          setInvoices(iData || []);
          setClientTagsList(tagsMap || {});
          setIsLoading(false);
        } catch (e) {
          console.warn("Failed to parse cached clients details", e);
        }
      }
      fetchData();
    } else {
      fetchData();
    }
  }, [userEmail]);

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setCompany(client.companyName || "");
    setEmail(client.email);
    setPhone(client.phone);
    setLocation(client.location || "");
    setIndustry(client.industry || "");
    setNotes(client.notes || "");
    setCustomTags(clientTagsList[client.id]?.join(", ") || "");
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setEditingClient(null);
    setName("");
    setCompany("");
    setEmail("");
    setPhone("");
    setLocation("");
    setIndustry("");
    setNotes("");
    setCustomTags("");
    setShowAddModal(false);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      alert("Name, Email, and Phone number are required.");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : "/api/clients";
      const method = editingClient ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          companyName: company || null,
          location: location || null,
          industry: industry || null,
          notes: notes || null
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Save client API error:", errorData);
        throw new Error(errorData.details || errorData.error || "Failed to save client profile");
      }

      const savedClient = await res.json();
      const finalClientId = editingClient ? editingClient.id : savedClient.id;

      // Handle Tag assignments
      if (customTags.trim()) {
        const tagArr = customTags.split(",").map(t => t.trim()).filter(Boolean);
        // Wipe old tags first if editing
        if (editingClient) {
          const oldTags = clientTagsList[editingClient.id] || [];
          for (const ot of oldTags) {
            await fetch(`/api/clients/${editingClient.id}/tags?tag=${encodeURIComponent(ot)}`, { method: "DELETE" });
          }
        }
        for (const tg of tagArr) {
          await fetch(`/api/clients/${finalClientId}/tags`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag: tg })
          });
        }
      }

      addNotification({
        type: "SUCCESS",
        title: editingClient ? "Client Details Saved" : "Client Created",
        message: `${name} has been successfully saved in your collections dashboard.`,
      });

      closeAddModal();
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save client profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePurgeClient = async (clientId: string, email: string) => {
    if (window.confirm(`⚠️ Warning: Are you sure you want to delete client "${email}"? This will cascade delete their invoices.`)) {
      try {
        const res = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
        if (res.ok) {
          addNotification({
            type: "SUCCESS",
            title: "Client Removed",
            message: `Profile was purged successfully.`,
          });
          fetchData();
        } else {
          alert("Failed to delete client");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Get initials for profile badge
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(w => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Compute Client Specific Stats & Risk Level
  const getClientData = (clientId: string) => {
    const clientInvoices = invoices.filter(inv => inv.client.id === clientId);
    const totalBilled = clientInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidInvoices = clientInvoices.filter(inv => inv.status === "PAID");
    const paidSum = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const openInvoices = clientInvoices.filter(inv => ["SENT", "VIEWED"].includes(inv.status));
    const overdueInvoices = clientInvoices.filter(inv => inv.status === "OVERDUE");

    const outstanding = openInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const overdue = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    
    // Simulate Average Payment Time / Risk Assessors
    const totalCount = clientInvoices.length;
    const overdueCount = overdueInvoices.length;
    
    let riskStatus = "Reliable";
    let healthScore = 100;

    if (overdueCount > 1) {
      riskStatus = "High Risk";
      healthScore = Math.max(0, 100 - (overdueCount * 20));
    } else if (overdueCount === 1) {
      riskStatus = "Moderate Risk";
      healthScore = 75;
    } else {
      riskStatus = "Reliable";
      healthScore = 95;
    }

    return {
      totalBilled,
      totalPaid: paidSum,
      outstanding,
      overdue,
      invoicesCount: totalCount,
      paidCount: paidInvoices.length,
      openCount: openInvoices.length,
      overdueCount,
      riskStatus,
      healthScore
    };
  };

  // Extract all client tag names
  const allAvailableTags: string[] = [];
  Object.values(clientTagsList).forEach(tags => {
    tags.forEach(t => {
      if (!allAvailableTags.includes(t)) allAvailableTags.push(t);
    });
  });

  // Filter clients
  const filteredClients = clients.filter(c => {
    const data = getClientData(c.id);
    const tags = clientTagsList[c.id] || [];

    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase());

    const matchesTag = tagFilter === "ALL" || tags.includes(tagFilter);
    const matchesRisk = riskFilter === "ALL" || data.riskStatus === riskFilter;

    return matchesSearch && matchesTag && matchesRisk;
  });

  // ==========================================
  // Client Insights Generator
  // ==========================================
  const insights: string[] = [];
  const clientsWithOutstanding = clients.filter(c => getClientData(c.id).outstanding > 0);
  const totalOutstanding = invoices
    .filter(inv => ["SENT", "VIEWED", "OVERDUE"].includes(inv.status))
    .reduce((sum, inv) => sum + inv.amount, 0);

  if (totalOutstanding > 0) {
    insights.push(`You have ₦${totalOutstanding.toLocaleString()} outstanding from ${clientsWithOutstanding.length} clients.`);
  }

  // Find highest paying client
  if (clients.length > 0) {
    const clientsValuations = clients.map(c => ({
      name: c.name,
      value: getClientData(c.id).totalBilled
    })).sort((a, b) => b.value - a.value);
    
    if (clientsValuations[0]?.value > 0) {
      insights.push(`${clientsValuations[0].name} is your highest paying customer (₦${clientsValuations[0].value.toLocaleString()} invoiced).`);
    }
  }

  // Find late paying clients
  const latePayers = clients.filter(c => getClientData(c.id).overdueCount > 0);
  if (latePayers.length > 0) {
    insights.push(`${latePayers.length} client(s) currently have overdue collections. Follow-up is advised.`);
  }

  // Client Dashboard Summary Widgets data
  const totalClients = clients.length;
  const activeClients = clients.filter(c => getClientData(c.id).invoicesCount > 0).length;
  const clientsOutstandingCount = clientsWithOutstanding.length;
  const clientsOverdueCount = clients.filter(c => getClientData(c.id).overdue > 0).length;

  const formatCurrencyMobile = (val: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="relative flex flex-col space-y-4 animate-in fade-in duration-500 pb-24 min-h-full">
      {/* Background Decorative Blur Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-100/30 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-50/20 rounded-full blur-[120px] pointer-events-none z-0" />
      
      {/* Mobile Native Header */}
      <div className="md:hidden pt-6 pb-2 px-4 flex items-center justify-between relative z-10">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          Clients Registry
          {isLoading && clients.length > 0 && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
        </h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#00B140] hover:bg-[#009933] text-white p-2 rounded-xl transition-all duration-300 flex items-center justify-center active:scale-[0.98] border-none"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Header Area */}
      <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/80 backdrop-blur-md text-slate-800 p-8 rounded-[2rem] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative z-10 mx-4 md:mx-8 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#00B140]" />
            Clients Registry
            {isLoading && clients.length > 0 && (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">Know who owes you money, assess risk, and preserve scope notes</p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#00B140] hover:bg-[#009933] text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-100 hover:translate-y-[-2px] active:translate-y-0 flex items-center gap-2 border-none cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" />
          Add New Client
        </button>
      </div>

      {/* Aggregate metrics (Horizontal Scroll) */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden relative z-10 md:mx-4 md:px-0 mt-4 md:mt-0">
        <div className="flex w-max space-x-3 pr-4 md:grid md:grid-cols-4 md:w-full md:space-x-0 md:gap-4 md:pr-0">
          <div className="min-w-[140px] bg-white border border-slate-100 rounded-2xl p-4 shadow-sm relative z-10 active:scale-[0.98] transition-transform duration-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Total Connections</span>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight font-mono truncate">{totalClients}</h3>
          </div>
          <div className="min-w-[140px] bg-white border border-slate-100 rounded-2xl p-4 shadow-sm relative z-10 active:scale-[0.98] transition-transform duration-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Outstanding</span>
            <h3 className="text-2xl font-black text-amber-500 tracking-tight font-mono truncate">{clientsOutstandingCount}</h3>
          </div>
          <div className="min-w-[140px] bg-white border border-slate-100 rounded-2xl p-4 shadow-sm relative z-10 active:scale-[0.98] transition-transform duration-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Overdue</span>
            <h3 className="text-2xl font-black text-rose-500 tracking-tight font-mono truncate">{clientsOverdueCount}</h3>
          </div>
          <div className="min-w-[140px] bg-white border border-slate-100 rounded-2xl p-4 shadow-sm relative z-10 active:scale-[0.98] transition-transform duration-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Valuation</span>
            <h3 className="text-2xl font-black text-emerald-600 tracking-tight font-mono truncate">₦{invoices.filter(i=>i.status==='PAID').reduce((s,i)=>s+i.amount,0).toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Insights Panel */}
      {insights.length > 0 && (
        <div className="p-6 bg-emerald-50/50 border border-emerald-100/50 rounded-3xl shadow-sm space-y-2 relative z-10 hover:shadow-md transition-all duration-300">
          <h4 className="text-xs font-bold text-emerald-705 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-600 animate-pulse" />
            Automatic Revenue OS Insights
          </h4>
          <ul className="space-y-2 text-xs font-semibold text-slate-700 list-disc list-inside">
            {insights.map((ins, i) => (
              <li key={i} className="leading-relaxed">{ins}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Search and List Container */}
      <div className="bg-transparent md:bg-white md:border md:border-slate-100 md:rounded-3xl md:p-8 md:shadow-sm space-y-4 md:space-y-6 relative z-10 px-4 md:px-0">
        
        {/* Filtering Options */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between md:border-b md:border-slate-100 md:pb-5">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white md:bg-slate-50 border border-slate-100 md:border-slate-200/65 rounded-2xl pl-10 pr-4 py-3 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00B140] transition-all duration-200 placeholder:text-slate-400 text-slate-900 shadow-sm md:shadow-none"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Tag filter */}
            <div className="flex-1 md:flex-none">
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="w-full bg-white md:bg-slate-50 border border-slate-100 md:border-slate-200 rounded-xl px-3 py-2.5 md:py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all duration-150 text-slate-600 font-semibold cursor-pointer shadow-sm md:shadow-none"
              >
                <option value="ALL">All Tags</option>
                {allAvailableTags.map((tag, i) => (
                  <option key={i} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            {/* Risk Filter */}
            <div className="flex-1 md:flex-none">
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full bg-white md:bg-slate-50 border border-slate-100 md:border-slate-200 rounded-xl px-3 py-2.5 md:py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all duration-150 text-slate-600 font-semibold cursor-pointer shadow-sm md:shadow-none"
              >
                <option value="ALL">All Risks</option>
                <option value="Reliable">Reliable</option>
                <option value="Moderate Risk">Moderate</option>
                <option value="High Risk">High Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Clients Bento List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {filteredClients.length === 0 ? (
            <div className="col-span-1 md:col-span-2 py-16 flex flex-col items-center gap-4 text-center bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-slate-500 font-medium text-base mt-3">No client profiles found</h4>
                <p className="text-slate-400 text-sm mt-1">Clear filters or define new clients to track invoices.</p>
              </div>
            </div>
          ) : (
            filteredClients.map((client) => {
              const { 
                totalBilled, 
                totalPaid,
                outstanding, 
                overdue, 
                invoicesCount,
                riskStatus,
                healthScore
              } = getClientData(client.id);

              return (
                <div 
                  key={client.id}
                  className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-100 flex flex-col justify-between gap-4 relative group z-10 active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-50 text-[#00B140] font-bold rounded-full w-10 h-10 flex items-center justify-center shrink-0 border border-emerald-100/50">
                        {getInitials(client.name)}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-bold text-slate-900 text-[15px] leading-tight">
                          {client.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{client.companyName || "Independent"}</p>
                      </div>
                    </div>
                    {/* Action buttons top right */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditModal(client); }} className="p-1.5 text-slate-400 hover:text-[#00B140] bg-slate-50 rounded-lg transition-colors border-none" title="Edit Profile">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePurgeClient(client.id, client.email); }} className="p-1.5 text-slate-400 hover:text-rose-500 bg-slate-50 rounded-lg transition-colors border-none" title="Purge Record">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-xs text-slate-500 truncate">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-xs text-slate-500">{client.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Billed</span>
                        <span className="text-sm font-bold text-slate-900 font-mono mt-0.5">{formatCurrencyMobile(totalBilled)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Paid</span>
                        <span className="text-sm font-bold text-emerald-600 font-mono mt-0.5">{formatCurrencyMobile(totalPaid)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Owed</span>
                        <span className={`text-sm font-bold font-mono mt-0.5 ${outstanding > 0 ? "text-amber-500" : "text-slate-400"}`}>
                          {formatCurrencyMobile(outstanding)}
                        </span>
                      </div>
                    </div>
                    <Link href={`/dashboard/clients/${client.id}`} passHref legacyBehavior>
                      <a className="bg-slate-50 hover:bg-slate-100 text-slate-600 p-1.5 rounded-lg transition-colors border border-slate-200/50 flex items-center justify-center">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add / Edit Client Dialog Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-100 animate-in zoom-in-95 duration-300 flex flex-col gap-6 relative overflow-hidden z-50">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-[#00B140]" />
            
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">{editingClient ? "Modify Client Record" : "Add New Client Record"}</h2>
              <p className="text-xs text-slate-400 mt-1">Configure client details, industry tagging, and notes logs.</p>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Contact Name *</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. Chioma Nze"
                    required
                    className="w-full bg-slate-50 border border-slate-200/65 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00B140] transition-all duration-200 placeholder:text-slate-350"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Company Name</label>
                  <input 
                    type="text" 
                    value={company} 
                    onChange={e => setCompany(e.target.value)} 
                    placeholder="e.g. Flutterwave"
                    className="w-full bg-slate-50 border border-slate-200/65 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00B140] transition-all duration-200 placeholder:text-slate-350"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Email Address *</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="e.g. billing@company.com"
                    required
                    className="w-full bg-slate-50 border border-slate-200/65 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00B140] transition-all duration-200 placeholder:text-slate-350"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Phone Number *</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="e.g. +234 812 345 6789"
                    required
                    className="w-full bg-slate-50 border border-slate-200/65 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00B140] transition-all duration-200 placeholder:text-slate-350"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Location / Country</label>
                  <input 
                    type="text" 
                    value={location} 
                    onChange={e => setLocation(e.target.value)} 
                    placeholder="e.g. Lagos, Nigeria"
                    className="w-full bg-slate-50 border border-slate-200/65 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00B140] transition-all duration-200 placeholder:text-slate-350"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Industry</label>
                  <input 
                    type="text" 
                    value={industry} 
                    onChange={e => setIndustry(e.target.value)} 
                    placeholder="e.g. Fintech"
                    className="w-full bg-slate-50 border border-slate-200/65 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00B140] transition-all duration-200 placeholder:text-slate-350"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Tags (comma separated)</label>
                <input 
                  type="text" 
                  value={customTags} 
                  onChange={e => setCustomTags(e.target.value)} 
                  placeholder="e.g. VIP, Late Payer, Repeat Client, Prospect"
                  className="w-full bg-slate-50 border border-slate-200/65 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00B140] transition-all duration-200 placeholder:text-slate-350"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">General Notes</label>
                <input 
                  type="text" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="e.g. Preferred communication on email. Special invoices format."
                  className="w-full bg-slate-50 border border-slate-200/65 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00B140] transition-all duration-200 placeholder:text-slate-350"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={closeAddModal}
                  className="bg-transparent text-slate-400 hover:text-slate-655 text-sm font-semibold border-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#00B140] hover:bg-[#009933] text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-100 hover:translate-y-[-1px] active:translate-y-0 flex items-center gap-2 border-none cursor-pointer text-sm"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Client Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
