"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  ArrowUpRight, 
  ShieldCheck, 
  Trash2,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  activeProjects: number;
  totalBilled: number;
  outstanding: number;
  status: "ACTIVE" | "INACTIVE";
}

const BASELINE_CLIENTS: Client[] = [];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form states
  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newTotalBilled, setNewTotalBilled] = useState("0");

  useEffect(() => {
    const saved = localStorage.getItem("kavio_clients");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter((c: Client) => !["c-1", "c-2", "c-3", "c-4"].includes(c.id));
        setClients(filtered);
        localStorage.setItem("kavio_clients", JSON.stringify(filtered));
      } catch (e) {
        setClients([]);
      }
    } else {
      setClients([]);
      localStorage.setItem("kavio_clients", JSON.stringify([]));
    }
  }, []);

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCompany || !newEmail) {
      alert("Please fill in Name, Company, and Email.");
      return;
    }

    const newClient: Client = {
      id: `c-${Date.now()}`,
      name: newName,
      company: newCompany,
      email: newEmail,
      phone: newPhone || "N/A",
      location: newLocation || "Nigeria",
      activeProjects: 0,
      totalBilled: parseFloat(newTotalBilled) || 0,
      outstanding: 0,
      status: "ACTIVE",
    };

    const updated = [newClient, ...clients];
    setClients(updated);
    localStorage.setItem("kavio_clients", JSON.stringify(updated));

    // Reset fields
    setNewName("");
    setNewCompany("");
    setNewEmail("");
    setNewPhone("");
    setNewLocation("");
    setNewTotalBilled("0");
    setShowAddModal(false);
  };

  const deleteClient = (id: string) => {
    if (confirm("Are you sure you want to delete this client?")) {
      const updated = clients.filter(c => c.id !== id);
      setClients(updated);
      localStorage.setItem("kavio_clients", JSON.stringify(updated));
    }
  };

  const filteredClients = clients.filter(c => {
    const matchesFilter = filter === "ALL" ? true : c.status === filter;
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(w => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Aggregates
  const activeCount = clients.filter(c => c.status === "ACTIVE").length;
  const totalBilledVal = clients.reduce((sum, c) => sum + c.totalBilled, 0);
  const outstandingVal = clients.reduce((sum, c) => sum + c.outstanding, 0);

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clients Directory</h1>
          <p className="text-slate-600 text-sm font-semibold mt-1">Manage and track relationships with your active agencies and companies</p>
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
        <Card className="border border-slate-100 rounded-2xl shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Clients</span>
              <Users className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{clients.length}</h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">{activeCount} active connections</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 rounded-2xl shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Billed</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 font-mono">₦ {totalBilledVal.toLocaleString()}</h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">All-time earnings billed</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 rounded-2xl shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Outstanding Receivables</span>
              <ArrowUpRight className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 font-mono">₦ {outstandingVal.toLocaleString()}</h3>
            <p className="text-[10px] text-amber-600 font-semibold mt-1">Pending payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid controls */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  filter === t
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by client or company name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 py-5 rounded-xl border-slate-200 focus-visible:ring-emerald-500 text-xs"
            />
          </div>
        </div>

        {/* Client Bento List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredClients.length === 0 ? (
            <div className="col-span-2 py-16 flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-700">No clients match your filter</h4>
                <p className="text-xs text-slate-400 mt-1">Get started by creating a client relationship record.</p>
              </div>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="mt-2 text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100/50 py-4 rounded-xl"
              >
                Create Client Profile
              </Button>
            </div>
          ) : (
            filteredClients.map((client) => (
              <div 
                key={client.id}
                className="border border-slate-100 rounded-3xl p-6 hover:shadow-md hover:border-slate-200/80 transition-all bg-white relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                        {getInitials(client.name)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-800 leading-tight">{client.name}</h3>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">{client.company}</p>
                      </div>
                    </div>
                    <Badge 
                      className={`font-bold text-[9px] uppercase px-2.5 py-0.5 rounded-full border ${
                        client.status === "ACTIVE" 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                          : "bg-slate-50 border-slate-100 text-slate-500"
                      }`}
                    >
                      {client.status}
                    </Badge>
                  </div>

                  <div className="space-y-2.5 mb-6 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium truncate">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold">{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold">{client.location}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100/60 flex items-center justify-between">
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Billed</p>
                      <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">₦ {client.totalBilled.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Outstanding</p>
                      <p className={`text-sm font-bold font-mono mt-0.5 ${client.outstanding > 0 ? "text-amber-600" : "text-slate-600"}`}>
                        ₦ {client.outstanding.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => deleteClient(client.id)}
                      className="p-2 hover:bg-slate-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors border border-transparent"
                      title="Delete Client"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Client Dialog / Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Add New Client Record</h2>
              <p className="text-xs text-slate-500 mt-1">Configure client details for automated invoicing and ledgers.</p>
            </div>

            <form onSubmit={handleAddClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Contact Name *</label>
                  <Input 
                    type="text" 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    placeholder="e.g. John Doe"
                    required
                    className="rounded-xl border-slate-200 text-xs py-4"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Company Name *</label>
                  <Input 
                    type="text" 
                    value={newCompany} 
                    onChange={e => setNewCompany(e.target.value)} 
                    placeholder="e.g. Paystack"
                    required
                    className="rounded-xl border-slate-200 text-xs py-4"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address *</label>
                <Input 
                  type="email" 
                  value={newEmail} 
                  onChange={e => setNewEmail(e.target.value)} 
                  placeholder="e.g. accounts@paystack.com"
                  required
                  className="rounded-xl border-slate-200 text-xs py-4"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                  <Input 
                    type="text" 
                    value={newPhone} 
                    onChange={e => setNewPhone(e.target.value)} 
                    placeholder="e.g. +234..."
                    className="rounded-xl border-slate-200 text-xs py-4"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Location</label>
                  <Input 
                    type="text" 
                    value={newLocation} 
                    onChange={e => setNewLocation(e.target.value)} 
                    placeholder="e.g. Lagos, Nigeria"
                    className="rounded-xl border-slate-200 text-xs py-4"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Initial Billed Amount (₦)</label>
                <Input 
                  type="number" 
                  value={newTotalBilled} 
                  onChange={e => setNewTotalBilled(e.target.value)} 
                  placeholder="0"
                  className="rounded-xl border-slate-200 text-xs py-4 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-5 text-xs py-4 border-slate-200 font-semibold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="rounded-xl px-5 text-xs py-4 bg-emerald-600 text-white font-bold hover:bg-emerald-500"
                >
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
