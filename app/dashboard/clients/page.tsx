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
      setIsLoading(true);
      const [clientsRes, invoicesRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/invoices")
      ]);

      if (clientsRes.ok && invoicesRes.ok) {
        const clientsData = await clientsRes.json();
        const invoicesData = await invoicesRes.json();
        setClients(clientsData);
        setInvoices(invoicesData);

        // Fetch tags for each client
        const tagsMap: Record<string, string[]> = {};
        for (const client of clientsData) {
          try {
            const tagsRes = await fetch(`/api/clients/${client.id}`);
            if (tagsRes.ok) {
              const detail = await tagsRes.json();
              tagsMap[client.id] = (detail.tags || []).map((t: any) => t.tag);
            }
          } catch (e) {
            console.error("Failed to load tags for client " + client.id, e);
          }
        }
        setClientTagsList(tagsMap);
      }
    } catch (e) {
      console.error("Failed to load clients data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        throw new Error("Failed to save client profile");
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Booting collections database...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-8 h-8 text-emerald-600" />
            Clients & CRM
          </h1>
          <p className="text-slate-600 text-sm font-semibold mt-1">Know who owes you money, assess risk, and preserve scope notes</p>
        </div>

        <Button 
          onClick={() => setShowAddModal(true)}
          className="py-6 px-6 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/20 border-none transition-all duration-200 flex items-center gap-2 animate-bounce"
        >
          <Plus className="w-4 h-4" />
          Add New Client
        </Button>
      </div>

      {/* Aggregate metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-none rounded-2xl shadow-sm bg-white hover:bg-slate-50/50 transition-all">
          <CardContent className="p-5 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Connections</span>
            <h3 className="text-xl font-bold text-slate-800 mt-2">{totalClients} Clients</h3>
            <p className="text-[9px] text-slate-500 mt-1">{activeClients} actively invoiced</p>
          </CardContent>
        </Card>

        <Card className="border-none rounded-2xl shadow-sm bg-white hover:bg-slate-50/50 transition-all">
          <CardContent className="p-5 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Accounts</span>
            <h3 className="text-xl font-bold text-slate-800 mt-2">{clientsOutstandingCount} Clients</h3>
            <p className="text-[9px] text-slate-500 mt-1">Awaiting settled bank wires</p>
          </CardContent>
        </Card>

        <Card className="border-none rounded-2xl shadow-sm bg-white hover:bg-slate-50/50 transition-all">
          <CardContent className="p-5 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Overdue Accounts</span>
            <h3 className="text-xl font-bold text-rose-650 mt-2">{clientsOverdueCount} Clients</h3>
            <p className="text-[9px] text-rose-500 mt-1">Requires immediate follow-up</p>
          </CardContent>
        </Card>

        <Card className="border-none rounded-2xl shadow-sm bg-white hover:bg-slate-50/50 transition-all">
          <CardContent className="p-5 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans">Collected Valuation</span>
            <h3 className="text-xl font-bold text-slate-850 mt-2 font-mono">₦ {invoices.filter(i=>i.status==='PAID').reduce((s,i)=>s+i.amount,0).toLocaleString()}</h3>
            <p className="text-[9px] text-emerald-600 mt-1">Settled invoices value</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights Panel */}
      {insights.length > 0 && (
        <div className="p-5 bg-emerald-50/40 border border-emerald-100/60 rounded-3xl space-y-2">
          <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Automatic Revenue OS Insights
          </h4>
          <ul className="space-y-2 text-xs font-semibold text-slate-700 list-disc list-inside">
            {insights.map((ins, i) => (
              <li key={i} className="leading-relaxed">{ins}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Search and List */}
      <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* Filtering Options */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, company, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 py-5 rounded-xl border-slate-200/50 focus-visible:ring-emerald-500 text-xs"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Tag filter */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <Tag className="w-3.5 h-3.5" />
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] focus:outline-none"
              >
                <option value="ALL">All Tags</option>
                {allAvailableTags.map((tag, i) => (
                  <option key={i} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            {/* Risk Filter */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <AlertCircle className="w-3.5 h-3.5" />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] focus:outline-none"
              >
                <option value="ALL">All Risk Statuses</option>
                <option value="Reliable">Reliable (🟢)</option>
                <option value="Moderate Risk">Moderate (🟡)</option>
                <option value="High Risk">High Risk (🔴)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Clients Bento List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredClients.length === 0 ? (
            <div className="col-span-2 py-16 flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-330">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-700">No client profiles matching query</h4>
                <p className="text-xs text-slate-400 mt-1">Clear filters or define new clients to trigger automated invoicing and nudge follow-ups.</p>
              </div>
            </div>
          ) : (
            filteredClients.map((client) => {
              const { 
                totalBilled, 
                outstanding, 
                overdue, 
                invoicesCount,
                riskStatus,
                healthScore
              } = getClientData(client.id);

              const tags = clientTagsList[client.id] || [];

              return (
                <div 
                  key={client.id}
                  className="rounded-3xl p-6 shadow-xs hover:shadow-md transition-all bg-slate-50/50 hover:bg-white relative group flex flex-col justify-between border border-slate-100/50"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base shadow-sm shrink-0 border border-emerald-100/40">
                          {getInitials(client.name)}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-800 leading-tight flex items-center gap-2">
                            {client.name}
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              riskStatus === "Reliable" ? "bg-emerald-500" :
                              riskStatus === "Moderate Risk" ? "bg-amber-500" :
                              "bg-rose-500"
                            }`} title={riskStatus} />
                          </h3>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">{client.companyName || "Solo Business Owner"}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <Badge className="font-bold text-[9px] uppercase px-2 rounded-md bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100">
                          {invoicesCount} Invoices
                        </Badge>
                        <span className="text-[10px] font-black text-slate-400">Score: {healthScore}</span>
                      </div>
                    </div>

                    {/* Metadata contact lines */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 font-medium py-3 border-t border-b border-slate-100/60 my-4">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                      {client.location && (
                        <div className="flex items-center gap-2 truncate col-span-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{client.location}</span>
                        </div>
                      )}
                      {client.industry && (
                        <div className="flex items-center gap-2 truncate col-span-2">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{client.industry}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags log */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {tags.map((tg, idx) => (
                          <Badge key={idx} variant="outline" className="px-2 py-0.5 text-[9px] font-bold text-slate-500 rounded-md border-slate-200">
                            {tg}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-4">
                    <div className="grid grid-cols-3 gap-2 flex-1">
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Total Billed</span>
                        <p className="text-xs font-bold text-slate-800 font-mono mt-0.5">₦ {totalBilled.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Outstanding</span>
                        <p className={`text-xs font-bold font-mono mt-0.5 ${outstanding > 0 ? "text-amber-600" : "text-slate-650"}`}>
                          ₦ {outstanding.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-rose-500 uppercase tracking-wider">Overdue</span>
                        <p className={`text-xs font-bold font-mono mt-0.5 ${overdue > 0 ? "text-rose-650 font-black" : "text-slate-650"}`}>
                          ₦ {overdue.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Action controls */}
                    <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/dashboard/clients/${client.id}`} passHref>
                        <Button variant="outline" className="p-2 h-8 rounded-lg" title="Open CRM Profile">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <Button variant="outline" onClick={() => openEditModal(client)} className="p-2 h-8 rounded-lg" title="Edit Profile">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="outline" onClick={() => handlePurgeClient(client.id, client.email)} className="p-2 h-8 hover:bg-rose-50 hover:text-rose-600 rounded-lg border-rose-100" title="Purge Record">
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add / Edit Client Dialog Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-black text-slate-800">{editingClient ? "Modify Client Record" : "Add New Client Record"}</h2>
              <p className="text-xs text-slate-500 mt-1">Configure client details, industry tagging, and notes logs.</p>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Contact Name *</label>
                  <Input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. Chioma Nze"
                    required
                    className="rounded-xl border-slate-200/50 text-xs py-4"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Company Name</label>
                  <Input 
                    type="text" 
                    value={company} 
                    onChange={e => setCompany(e.target.value)} 
                    placeholder="e.g. Flutterwave"
                    className="rounded-xl border-slate-200/50 text-xs py-4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address *</label>
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="e.g. billing@company.com"
                    required
                    className="rounded-xl border-slate-200/50 text-xs py-4"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number *</label>
                  <Input 
                    type="text" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="e.g. +234 812 345 6789"
                    required
                    className="rounded-xl border-slate-200/50 text-xs py-4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Location / Country</label>
                  <Input 
                    type="text" 
                    value={location} 
                    onChange={e => setLocation(e.target.value)} 
                    placeholder="e.g. Lagos, Nigeria"
                    className="rounded-xl border-slate-200/50 text-xs py-4"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Industry</label>
                  <Input 
                    type="text" 
                    value={industry} 
                    onChange={e => setIndustry(e.target.value)} 
                    placeholder="e.g. Fintech"
                    className="rounded-xl border-slate-200/50 text-xs py-4"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tags (comma separated)</label>
                <Input 
                  type="text" 
                  value={customTags} 
                  onChange={e => setCustomTags(e.target.value)} 
                  placeholder="e.g. VIP, Late Payer, Repeat Client, Prospect"
                  className="rounded-xl border-slate-200/50 text-xs py-4"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">General Notes</label>
                <Input 
                  type="text" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="e.g. Preferred communication on email. Special invoices format."
                  className="rounded-xl border-slate-200/50 text-xs py-4"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100/60">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={closeAddModal}
                  className="rounded-xl px-5 text-xs py-4 border-slate-200/50 font-semibold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl px-5 text-xs py-4 bg-emerald-600 text-white font-bold hover:bg-emerald-500 flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Client details
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
