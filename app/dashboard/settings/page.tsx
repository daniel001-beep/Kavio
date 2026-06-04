"use client";

import React, { useState, useEffect } from "react";
import { 
  User, 
  Lock, 
  ShieldCheck, 
  CreditCard, 
  Globe, 
  Sparkles, 
  Mail, 
  Building2, 
  Phone, 
  MapPin, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@/app/context/AuthContext";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"PROFILE" | "SECURITY" | "TIER">("PROFILE");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Profile Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [currency, setCurrency] = useState("NGN");

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Load profile data on mount
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }

    const savedProfile = localStorage.getItem("kavio_profile_details");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.company) setCompany(parsed.company);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.location) setLocation(parsed.location);
        if (parsed.currency) setCurrency(parsed.currency);
      } catch (e) {
        console.warn("Failed to parse cached profile details", e);
      }
    }
  }, [session]);

  // Handle Profile Details Change
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    try {
      // 1. Save Name to the PostgreSQL Database
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile name");
      }

      // 2. Save Company, Phone, Location, Currency client-side (keeps database clean!)
      const profileDetails = { company, phone, location, currency };
      localStorage.setItem("kavio_profile_details", JSON.stringify(profileDetails));
      
      // Update session cookie representation so header updates immediately
      const match = document.cookie.match(/velox-local-user=([^;]+)/);
      if (match) {
        try {
          const parsed = JSON.parse(decodeURIComponent(match[1]));
          parsed.name = name;
          document.cookie = `velox-local-user=${encodeURIComponent(JSON.stringify(parsed))}; path=/; max-age=604800`;
        } catch (cookieErr) {
          console.warn("Failed to update local session cookie", cookieErr);
        }
      }

      setStatusMessage({ type: "success", text: "Profile details successfully updated." });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Change
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    if (newPassword.length < 6) {
      setStatusMessage({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStatusMessage({ type: "success", text: "Password changed successfully." });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to change password." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account Command Center</h1>
        <p className="text-slate-600 text-sm font-semibold mt-1">Configure details, currency preferences, security credentials, and Pro settings</p>
      </div>

      {/* Main Layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar Cards */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <button
            onClick={() => { setActiveTab("PROFILE"); setStatusMessage(null); }}
            className={`flex items-center gap-3.5 px-5 py-4 rounded-2xl text-[13px] font-bold text-left transition-all border shadow-sm ${
              activeTab === "PROFILE"
                ? "bg-emerald-50 border-emerald-100 text-emerald-600 font-extrabold"
                : "bg-white border-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <User className="w-[18px] h-[18px]" />
            Account Information
          </button>

          <button
            onClick={() => { setActiveTab("SECURITY"); setStatusMessage(null); }}
            className={`flex items-center gap-3.5 px-5 py-4 rounded-2xl text-[13px] font-bold text-left transition-all border shadow-sm ${
              activeTab === "SECURITY"
                ? "bg-emerald-50 border-emerald-100 text-emerald-600 font-extrabold"
                : "bg-white border-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Lock className="w-[18px] h-[18px]" />
            Security & Credentials
          </button>

          <button
            onClick={() => { setActiveTab("TIER"); setStatusMessage(null); }}
            className={`flex items-center gap-3.5 px-5 py-4 rounded-2xl text-[13px] font-bold text-left transition-all border shadow-sm ${
              activeTab === "TIER"
                ? "bg-emerald-50 border-emerald-100 text-emerald-600 font-extrabold"
                : "bg-white border-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <CreditCard className="w-[18px] h-[18px]" />
            Subscription Plan
          </button>
        </div>

        {/* Content Box Panels */}
        <div className="lg:col-span-3">
          <Card className="border border-slate-100 rounded-3xl shadow-sm bg-white overflow-hidden">
            <CardContent className="p-8">
              
              {/* Messages banner */}
              {statusMessage && (
                <div className={`mb-6 p-4 rounded-2xl border flex items-start gap-3 text-xs font-bold leading-normal shadow-sm ${
                  statusMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                    : "bg-rose-50 border-rose-100 text-rose-700"
                }`}>
                  {statusMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* Tab 1: Profile Form */}
              {activeTab === "PROFILE" && (
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">Account Information</h2>
                    <p className="text-xs text-slate-500 mt-1">Configure details for system personalization and billing outputs.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Freelancer Full Name"
                          className="pl-9 py-5 rounded-xl border-slate-200 focus-visible:ring-emerald-500 text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-350" />
                        <Input
                          type="email"
                          value={email}
                          disabled
                          className="pl-9 py-5 rounded-xl border-slate-100 bg-slate-50 text-slate-400 text-xs cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Freelancer / Company Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="e.g. Adebayo Design Studio"
                          className="pl-9 py-5 rounded-xl border-slate-200 focus-visible:ring-emerald-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Primary Currency</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
                        >
                          <option value="NGN">₦ Nigerian Naira (NGN)</option>
                          <option value="USD">$ United States Dollar (USD)</option>
                          <option value="EUR">€ Euro (EUR)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +234 803 123 4567"
                          className="pl-9 py-5 rounded-xl border-slate-200 focus-visible:ring-emerald-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location / Country</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Lagos, Nigeria"
                          className="pl-9 py-5 rounded-xl border-slate-200 focus-visible:ring-emerald-500 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="py-5 px-6 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-500/10 flex items-center gap-2"
                    >
                      {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Save Profile Changes
                    </Button>
                  </div>
                </form>
              )}

              {/* Tab 2: Security Form */}
              {activeTab === "SECURITY" && (
                <form onSubmit={handleSavePassword} className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">Security & Credentials</h2>
                    <p className="text-xs text-slate-500 mt-1">Change and secure your login password in the database.</p>
                  </div>

                  <div className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="pl-9 py-5 rounded-xl border-slate-200 focus-visible:ring-emerald-500 text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          className="pl-9 py-5 rounded-xl border-slate-200 focus-visible:ring-emerald-500 text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Verify new password"
                          className="pl-9 py-5 rounded-xl border-slate-200 focus-visible:ring-emerald-500 text-xs"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="py-5 px-6 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-500/10 flex items-center gap-2"
                    >
                      {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Update Password
                    </Button>
                  </div>
                </form>
              )}

              {/* Tab 3: Subscription Plan */}
              {activeTab === "TIER" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">Subscription Plan</h2>
                    <p className="text-xs text-slate-500 mt-1">Manage billing schedules, account limits, and unlock premium features.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    
                    {/* Active Plan Detail Box */}
                    <div className="border border-slate-100 bg-slate-50/50 p-6 rounded-3xl flex flex-col justify-between h-[200px]">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Account Status</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                          Kavio Pro Plan
                          <Badge className="bg-emerald-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase">Active</Badge>
                        </h3>
                        <p className="text-xs text-slate-500 font-semibold mt-2">Unlimited double-entry invoices, category budgeting, category-spend charts, and verified P&L PDF reports.</p>
                      </div>

                      <div className="text-xs text-slate-600 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                        Renews automatically on July 1, 2026
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="border border-slate-100 bg-white p-6 rounded-3xl flex flex-col justify-between h-[200px]">
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-3">Enterprise Pro Benefits</span>
                        <ul className="space-y-2.5 text-xs text-slate-650 font-semibold">
                          <li className="flex items-center gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Unlimited cryptographically signed ledgers
                          </li>
                          <li className="flex items-center gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Multi-currency bank-mutation reconciliation
                          </li>
                          <li className="flex items-center gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Remove invoice branding ("Powered by Kavio")
                          </li>
                        </ul>
                      </div>

                      <Button
                        variant="outline"
                        className="py-4 text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
                      >
                        Manage Billing Portal
                      </Button>
                    </div>

                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
