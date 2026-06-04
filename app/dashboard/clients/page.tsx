"use client";

import React, { useState, useEffect } from "react";
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
  FileText
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
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const { addNotification } = useNotifications();

  // Form states
  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch clients and invoices
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

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPhone) {
      alert("Name, Email, and Phone number are required.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          phone: newPhone,
          companyName: newCompany || null,
          location: newLocation || null
        })
      });

      if (!res.ok) {
        throw new Error("Failed to create client");
      }

      addNotification({
        type: "SUCCESS",
        title: "Client Added",
        message: `${newName} has been added to your collections directory.`,
      });

      // Reset form
      setNewName("");
      setNewCompany("");
      setNewEmail("");
      setNewPhone("");
      setNewLocation("");
      setShowAddModal(false);
      
      // Refresh
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to create client");
    } finally {
      setIsSaving(false);
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

  // Compute Client Specific Stats
  const getClientStats = (clientId: string) => {
    const clientInvoices = invoices.filter(inv => inv.client.id === clientId);
    const totalBilled = clientInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const outstanding = clientInvoices
      .filter(inv => ["SENT", "VIEWED", "OVERDUE"].includes(inv.status))
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    return {
      totalBilled,
      outstanding,
      invoicesCount: clientInvoices.length
    };
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // Global aggregates
  const totalOutstanding = invoices
    .filter(inv => ["SENT", "VIEWED", "OVERDUE"].includes(inv.status))
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalBilledVal = invoices
    .filter(inv => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.amount, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Loading clients directory...
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
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clients Directory</h1>
          <p className="text-slate-600 text-sm font-semibold mt-1">Manage accounts and payment history with your clients</p>
        </div>

        <Button 
          onClick={() => setShowAddModal(true)}
          className="py-6 px-6 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/20 border-none transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Client
        </Button>
      </div>

      {/* Aggregate metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-none rounded-2xl shadow-sm bg-white hover:bg-slate-50/50 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Connections</span>
              <Users className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{clients.length} Clients</h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Platform-wide contacts</p>
          </CardContent>
        </Card>

        <Card className="border-none rounded-2xl shadow-sm bg-white hover:bg-slate-50/50 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Collected</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 font-mono">₦ {totalBilledVal.toLocaleString()}</h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">All-time earnings paid</p>
          </CardContent>
        </Card>

        <Card className="border-none rounded-2xl shadow-sm bg-white hover:bg-slate-50/50 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Outstanding</span>
              <ArrowUpRight className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 font-mono">₦ {totalOutstanding.toLocaleString()}</h3>
            <p className="text-[10px] text-amber-650 font-semibold mt-1">Awaiting bank transfers</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and List */}
      <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search clients by name or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 py-5 rounded-xl border-slate-200/50 focus-visible:ring-emerald-500 text-xs"
            />
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
                <h4 className="text-sm font-bold text-slate-700">No client connections found</h4>
                <p className="text-xs text-slate-400 mt-1">Create client records to automate invoices and reminder follow-ups.</p>
              </div>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="mt-2 text-xs font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100/50 py-4 rounded-xl"
              >
                Create Client Profile
              </Button>
            </div>
          ) : (
            filteredClients.map((client) => {
              const { totalBilled, outstanding, invoicesCount } = getClientStats(client.id);
              return (
                <div 
                  key={client.id}
                  className="rounded-3xl p-6 shadow-sm hover:shadow-md transition-all bg-white relative group flex flex-col justify-between border-none"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                          {getInitials(client.name)}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-800 leading-tight">{client.name}</h3>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">{client.companyName || "Freelance Client"}</p>
                        </div>
                      </div>
                      <Badge className="font-bold text-[9px] uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border-none">
                        {invoicesCount} Invoices
                      </Badge>
                    </div>

                    <div className="space-y-2.5 mb-6 text-xs text-slate-655">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium truncate">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold">{client.phone}</span>
                      </div>
                      {client.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold">{client.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100/30 flex items-center justify-between">
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Billed</p>
                        <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">₦ {totalBilled.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Outstanding</p>
                        <p className={`text-sm font-bold font-mono mt-0.5 ${outstanding > 0 ? "text-amber-600" : "text-slate-600"}`}>
                          ₦ {outstanding.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Client Dialog / Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Add New Client Record</h2>
              <p className="text-xs text-slate-500 mt-1">Configure client details for automated invoicing and collections.</p>
            </div>

            <form onSubmit={handleAddClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Contact Name *</label>
                  <Input 
                    type="text" 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    placeholder="e.g. Chioma Nze"
                    required
                    className="rounded-xl border-slate-200/50 text-xs py-4"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Company Name</label>
                  <Input 
                    type="text" 
                    value={newCompany} 
                    onChange={e => setNewCompany(e.target.value)} 
                    placeholder="e.g. Flutterwave"
                    className="rounded-xl border-slate-200/50 text-xs py-4"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address *</label>
                <Input 
                  type="email" 
                  value={newEmail} 
                  onChange={e => setNewEmail(e.target.value)} 
                  placeholder="e.g. accounts@flutterwavego.com"
                  required
                  className="rounded-xl border-slate-200/50 text-xs py-4"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number *</label>
                  <Input 
                    type="text" 
                    value={newPhone} 
                    onChange={e => setNewPhone(e.target.value)} 
                    placeholder="e.g. +234 812 345 6789"
                    required
                    className="rounded-xl border-slate-200/50 text-xs py-4"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Location</label>
                  <Input 
                    type="text" 
                    value={newLocation} 
                    onChange={e => setNewLocation(e.target.value)} 
                    placeholder="e.g. Lagos, Nigeria"
                    className="rounded-xl border-slate-200/50 text-xs py-4"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100/30">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddModal(false)}
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
                  Save Client Profile
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
