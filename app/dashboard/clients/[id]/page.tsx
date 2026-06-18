"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  DollarSign, 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  Tag, 
  FileText, 
  MessageSquare, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowLeft, 
  Loader2, 
  Send,
  CalendarDays,
  Smartphone,
  ShieldAlert,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/app/context/NotificationContext";

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { addNotification } = useNotifications();
  const clientId = params?.id as string;

  const [client, setClient] = useState<any>(null);
  const [financials, setFinancials] = useState<any>(null);
  const [behavior, setBehavior] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [crm, setCrm] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  
  // Note Form states
  const [newNote, setNewNote] = useState("");
  const [noteCategory, setNoteCategory] = useState("MEETING");
  const [noteSaving, setNoteSaving] = useState(false);

  // CRM Form states
  const [prefMethod, setPrefMethod] = useState("EMAIL");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [lastContact, setLastContact] = useState("");
  const [crmNotes, setCrmNotes] = useState("");
  const [crmSaving, setCrmSaving] = useState(false);

  // Tag Form states
  const [newTag, setNewTag] = useState("");
  const [tagSaving, setTagSaving] = useState(false);

  const fetchClientProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/clients/${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data.client);
        setFinancials(data.financials);
        setBehavior(data.behavior);
        setNotes(data.notes || []);
        setTags(data.tags || []);
        setActivities(data.activities || []);
        setCrm(data.relationship);

        // Prepopulate CRM form
        if (data.relationship) {
          setPrefMethod(data.relationship.preferredMethod || "EMAIL");
          if (data.relationship.nextFollowUpDate) {
            setNextFollowUp(new Date(data.relationship.nextFollowUpDate).toISOString().substring(0, 10));
          }
          if (data.relationship.lastContactDate) {
            setLastContact(new Date(data.relationship.lastContactDate).toISOString().substring(0, 10));
          }
          setCrmNotes(data.relationship.notes || "");
        }
      } else {
        addNotification({
          type: "ERROR",
          title: "Failed to load profile",
          message: "Client profile could not be retrieved."
        });
        router.push("/dashboard/clients");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClientProfile();
    }
  }, [clientId]);

  // Handle Note Submission
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setNoteSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: newNote,
          category: noteCategory
        })
      });

      if (res.ok) {
        setNewNote("");
        fetchClientProfile();
        addNotification({
          type: "SUCCESS",
          title: "Note Added",
          message: `Scope note cataloged successfully.`
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNoteSaving(false);
    }
  };

  // Handle Tag Addition
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;

    setTagSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: newTag.trim() })
      });

      if (res.ok) {
        setNewTag("");
        fetchClientProfile();
        addNotification({
          type: "SUCCESS",
          title: "Tag Assigned",
          message: `Tag applied successfully.`
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTagSaving(false);
    }
  };

  // Handle Tag Deletion
  const handleRemoveTag = async (tagName: string) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/tags?tag=${encodeURIComponent(tagName)}`, {
        method: "DELETE"
      });

      if (res.ok) {
        fetchClientProfile();
        addNotification({
          type: "SUCCESS",
          title: "Tag Unassigned",
          message: `Tag removed successfully.`
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle CRM Updates
  const handleSaveCRM = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrmSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/crm`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredMethod: prefMethod,
          nextFollowUpDate: nextFollowUp || null,
          lastContactDate: lastContact || null,
          notes: crmNotes
        })
      });

      if (res.ok) {
        fetchClientProfile();
        addNotification({
          type: "SUCCESS",
          title: "CRM Updated",
          message: "Preferred contact and followup details saved."
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCrmSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse font-mono">
            Fetching client profile data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Navigation & Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients" passHref>
          <Button variant="outline" className="p-2 h-9 rounded-lg">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            {client?.name}
            <span className={`w-3 h-3 rounded-full ${
              behavior?.reliabilityStatus === "Reliable" ? "bg-emerald-500" :
              behavior?.reliabilityStatus === "Moderate Risk" ? "bg-amber-500" :
              "bg-rose-500"
            }`} title={behavior?.reliabilityStatus} />
          </h2>
          <p className="text-slate-500 text-xs font-semibold">{client?.companyName || "Freelance Client Profile"}</p>
        </div>
      </div>

      {/* Main Grid: Info sidebar & CRM metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Metadata & CRM Settings */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card: Client Profile Info */}
          <Card className="border-none rounded-2xl shadow-sm bg-white overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-2xl mx-auto border border-emerald-100/40">
                {client?.name.substring(0, 2).toUpperCase()}
              </div>

              <div className="space-y-3.5 text-xs text-slate-655 border-t border-slate-100/60 pt-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold truncate">{client?.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="font-bold">{client?.phone}</span>
                </div>
                {client?.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold">{client?.location}</span>
                  </div>
                )}
                {client?.industry && (
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold">{client?.industry} Industry</span>
                  </div>
                )}
              </div>

              {/* Tags Panel */}
              <div className="border-t border-slate-100/60 pt-4 space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Client Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tg, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="px-2 py-0.5 text-[9px] font-bold text-slate-650 bg-slate-50 border-slate-200 rounded-md flex items-center gap-1 group/badge"
                    >
                      {tg.tag}
                      <button 
                        onClick={() => handleRemoveTag(tg.tag)} 
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
                
                {/* Add Tag Inline Form */}
                <form onSubmit={handleAddTag} className="flex gap-2 pt-1.5">
                  <Input 
                    type="text" 
                    placeholder="New custom tag..." 
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    className="h-8 text-[11px] rounded-lg border-slate-200"
                  />
                  <Button type="submit" disabled={tagSaving} className="h-8 px-3 text-[10px] font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800">
                    Add
                  </Button>
                </form>
              </div>

            </CardContent>
          </Card>

          {/* Card: CRM follow-up configuration */}
          <Card className="border-none rounded-2xl shadow-sm bg-white">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-emerald-600" />
                  Client Settings & Follow-ups
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Configure followups and preferred contacts</p>
              </div>

              <form onSubmit={handleSaveCRM} className="space-y-4 text-xs font-semibold text-slate-600">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Preferred channel</label>
                  <select 
                    value={prefMethod} 
                    onChange={e => setPrefMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="EMAIL">Email Address</option>
                    <option value="WHATSAPP">WhatsApp Message</option>
                    <option value="PHONE">Direct Voice Call</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Last Contact Date</label>
                  <Input 
                    type="date" 
                    value={lastContact} 
                    onChange={e => setLastContact(e.target.value)}
                    className="rounded-xl border-slate-200 text-xs py-4"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Next Follow-Up Date</label>
                  <Input 
                    type="date" 
                    value={nextFollowUp} 
                    onChange={e => setNextFollowUp(e.target.value)}
                    className="rounded-xl border-slate-200 text-xs py-4"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Client Notes</label>
                  <Input 
                    type="text" 
                    value={crmNotes} 
                    onChange={e => setCrmNotes(e.target.value)}
                    placeholder="e.g. Needs final agreement signed."
                    className="rounded-xl border-slate-200 text-xs py-4"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={crmSaving}
                  className="w-full py-2 bg-emerald-600 text-white font-bold hover:bg-emerald-500 rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  {crmSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Settings
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: Dashboards, Timeline & Scope notes */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Dashboard metrics section */}
          {financials && behavior && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-150 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</span>
                <h3 className="text-base font-bold text-slate-800 font-mono mt-1">₦ {financials.totalInvoiced.toLocaleString()}</h3>
                <span className="text-[9px] text-slate-400 mt-1">{behavior.paidInvoicesCount} Invoices paid</span>
              </div>
              <div className="bg-white border border-slate-150 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Outstanding</span>
                <h3 className="text-base font-bold text-slate-800 font-mono mt-1">₦ {financials.outstandingAmount.toLocaleString()}</h3>
                <span className="text-[9px] text-slate-400 mt-1">{behavior.openInvoicesCount} invoices open</span>
              </div>
              <div className="bg-white border border-slate-150 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[8px] font-bold text-rose-500 uppercase tracking-wider">Overdue sum</span>
                <h3 className="text-base font-bold text-rose-650 font-mono mt-1">₦ {financials.overdueAmount.toLocaleString()}</h3>
                <span className="text-[9px] text-rose-500 mt-1">{behavior.overdueInvoicesCount} invoices overdue</span>
              </div>
              <div className="bg-white border border-slate-150 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Payment speed</span>
                <h3 className="text-base font-bold text-slate-800 mt-1">{behavior.avgPaymentTime} days</h3>
                <span className={`text-[9px] font-bold mt-1 uppercase ${
                  behavior.reliabilityStatus === "Reliable" ? "text-emerald-600" :
                  behavior.reliabilityStatus === "Moderate Risk" ? "text-amber-600" :
                  "text-rose-600"
                }`}>{behavior.reliabilityStatus}</span>
              </div>
            </div>
          )}

          {/* Relationship score card */}
          {behavior && (
            <Card className="border-none rounded-2xl shadow-sm bg-white overflow-hidden">
              <CardContent className="p-5 flex items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    behavior.healthStatus === "Excellent" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                    behavior.healthStatus === "Good" ? "bg-blue-50 text-blue-600 border-blue-100" :
                    behavior.healthStatus === "Warning" ? "bg-amber-50 text-amber-600 border-amber-100" :
                    "bg-rose-50 text-rose-600 border-rose-100"
                  }`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider">Client Health Score</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Calculated score based on payment delays, completes, and open amounts.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase ${
                    behavior.healthStatus === "Excellent" ? "bg-emerald-50 text-emerald-700 border border-emerald-250" :
                    behavior.healthStatus === "Good" ? "bg-blue-55 text-blue-700 border border-blue-250" :
                    behavior.healthStatus === "Warning" ? "bg-amber-50 text-amber-700 border border-amber-250" :
                    "bg-rose-50 text-rose-700 border border-rose-250"
                  }`}>
                    {behavior.healthStatus}
                  </span>
                  <span className="text-2xl font-black text-slate-800">{behavior.healthScore}<span className="text-slate-400 text-xs font-semibold">/100</span></span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* General Invoices Timeline & History log */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Timeline log */}
            <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Dynamic activities timeline
                </h4>
                <div className="border-l border-slate-100 pl-4 ml-2 space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {activities.length === 0 ? (
                    <p className="text-xs text-slate-400">No events logged yet for this client.</p>
                  ) : (
                    activities.map((item, idx) => (
                      <div key={idx} className="relative space-y-0.5">
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white ring-4 ring-emerald-50" />
                        <div className="flex justify-between text-[9px] font-bold text-slate-400">
                          <span>{item.eventType}</span>
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-650 leading-relaxed">{item.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* General notes log panel */}
            <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Freelancer Notes System
                </h4>
                
                {/* Notes list */}
                <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2">
                  {notes.length === 0 ? (
                    <p className="text-xs text-slate-400">No notes written. Write down agreements, scopes, or WhatsApp changes here.</p>
                  ) : (
                    notes.map((n, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold relative">
                        <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 mb-1">
                          <span className="uppercase">{n.category}</span>
                          <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{n.note}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Note Submission Form */}
              <form onSubmit={handleAddNote} className="space-y-3 pt-4 border-t border-slate-100/60 mt-4">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <select 
                    value={noteCategory} 
                    onChange={e => setNoteCategory(e.target.value)}
                    className="col-span-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold focus:outline-none"
                  >
                    <option value="MEETING">Meeting</option>
                    <option value="AGREEMENT">Agreement</option>
                    <option value="SCOPE_CHANGE">Scope</option>
                    <option value="SPECIAL_REQUEST">Special</option>
                    <option value="PAYMENT_AGREEMENT">Billing</option>
                  </select>
                  <Input 
                    type="text" 
                    placeholder="Type meeting note or scope changes here..." 
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    className="col-span-2 h-8 text-[11px] rounded-lg border-slate-200"
                  />
                </div>
                <Button type="submit" disabled={noteSaving} className="w-full py-1.5 text-[10px] font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-1.5">
                  {noteSaving && <Loader2 className="w-3 animate-spin" />}
                  Save Note to Profile
                </Button>
              </form>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
