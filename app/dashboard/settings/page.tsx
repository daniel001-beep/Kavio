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
  AlertTriangle,
  Share,
  Smartphone,
  PlusSquare,
  Check,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSession, useSignOut } from "@/app/context/AuthContext";
import { usePWAInstall } from "@/app/hooks/usePWAInstall";

export default function SettingsPage() {
  const { data: session } = useSession();
  const signOut = useSignOut();
  const [activeTab, setActiveTab] = useState<"PROFILE" | "SECURITY" | "TIER" | "ADMIN" | "PWA" | "SUPPORT">("PROFILE");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { isInstallable: isPWAInstallable, triggerInstall: triggerPWAInstall } = usePWAInstall();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (e) {
      setIsSigningOut(false);
    }
  };

  const handleTriggerPWAInstall = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    const success = await triggerPWAInstall();
    setIsLoading(false);
    if (success) {
      setStatusMessage({ type: "success", text: "App installation accepted!" });
    } else {
      setStatusMessage({ type: "error", text: "App installation declined or failed to trigger." });
    }
  };
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isIOS, setIsIOS] = useState(false);

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

  // Promo Tier States
  const [totalUsersCount, setTotalUsersCount] = useState(1);
  const [isFreePromo, setIsFreePromo] = useState(true);

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

    const fetchTierDetails = async () => {
      try {
        const res = await fetch("/api/user/tier");
        if (res.ok) {
          const data = await res.json();
          setTotalUsersCount(data.totalUsers || 1);
          setIsFreePromo(data.isFreePromo !== false);
        }
      } catch (e) {
        console.error("Failed to load settings tier details", e);
      }
    };
    fetchTierDetails();
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(userAgent));
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
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500 pb-16 relative">
      {/* Ambient glow effects */}
      <div className="absolute top-[-5%] left-[-5%] w-[350px] h-[350px] bg-emerald-150/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[300px] h-[300px] bg-emerald-100/5 rounded-full blur-[90px] pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account Command Center</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Configure details, currency preferences, security credentials, and Pro settings</p>
      </div>
 
      {/* Main Layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
        
        {/* Navigation Sidebar Cards */}
        <div className="lg:col-span-1 flex flex-col gap-2.5">
          <button
            onClick={() => { setActiveTab("PROFILE"); setStatusMessage(null); }}
            className={`flex items-center gap-3.5 px-5 py-4 rounded-xl text-[13px] font-bold text-left transition-all shadow-sm border-l-2 ${
              activeTab === "PROFILE"
                ? "bg-emerald-50 text-emerald-700 border-emerald-500 font-extrabold"
                : "bg-white text-slate-55 border-transparent hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <User className="w-[18px] h-[18px]" />
            Account Information
          </button>
 
          <button
            onClick={() => { setActiveTab("SECURITY"); setStatusMessage(null); }}
            className={`flex items-center gap-3.5 px-5 py-4 rounded-xl text-[13px] font-bold text-left transition-all shadow-sm border-l-2 ${
              activeTab === "SECURITY"
                ? "bg-emerald-50 text-emerald-700 border-emerald-500 font-extrabold"
                : "bg-white text-slate-55 border-transparent hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Lock className="w-[18px] h-[18px]" />
            Security & Credentials
          </button>
 
          <button
            onClick={() => { setActiveTab("TIER"); setStatusMessage(null); }}
            className={`flex items-center gap-3.5 px-5 py-4 rounded-xl text-[13px] font-bold text-left transition-all shadow-sm border-l-2 ${
              activeTab === "TIER"
                ? "bg-emerald-50 text-emerald-700 border-emerald-500 font-extrabold"
                : "bg-white text-slate-55 border-transparent hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <CreditCard className="w-[18px] h-[18px]" />
            Subscription Plan
          </button>
 
          <button
            onClick={() => { setActiveTab("PWA"); setStatusMessage(null); }}
            className={`flex items-center gap-3.5 px-5 py-4 rounded-xl text-[13px] font-bold text-left transition-all shadow-sm border-l-2 ${
              activeTab === "PWA"
                ? "bg-emerald-50 text-emerald-700 border-emerald-500 font-extrabold"
                : "bg-white text-slate-55 border-transparent hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Sparkles className="w-[18px] h-[18px] text-amber-500" />
            Install App (PWA)
          </button>
 
          <button
            onClick={() => { setActiveTab("SUPPORT"); setStatusMessage(null); }}
            className={`flex items-center gap-3.5 px-5 py-4 rounded-xl text-[13px] font-bold text-left transition-all shadow-sm border-l-2 ${
              activeTab === "SUPPORT"
                ? "bg-emerald-50 text-emerald-700 border-emerald-500 font-extrabold"
                : "bg-white text-slate-55 border-transparent hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Phone className="w-[18px] h-[18px] text-emerald-55" />
            Contact & Support
          </button>
 
          {session?.user?.isAdmin && (
            <button
              onClick={() => window.location.href = "/fintech/admin"}
              className="flex items-center gap-3.5 px-5 py-4 rounded-xl text-[13px] font-bold text-left transition-all shadow-sm border-l-2 bg-indigo-50 text-indigo-700 border-indigo-500 hover:bg-indigo-100"
            >
              <ShieldCheck className="w-[18px] h-[18px] text-indigo-600" />
              Super Admin Console
            </button>
          )}
 
          {/* Mobile-only Sign Out button inside sidebar */}
          <button
            id="mobile-settings-signout"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="lg:hidden flex items-center gap-3.5 px-5 py-4 rounded-xl text-[13px] font-bold text-left transition-all shadow-sm bg-rose-50 border-l-2 border-rose-500 text-rose-600 hover:bg-rose-100 active:scale-[0.98] disabled:opacity-60 mt-2"
          >
            {isSigningOut ? (
              <Loader2 className="w-[18px] h-[18px] animate-spin" />
            ) : (
              <LogOut className="w-[18px] h-[18px]" />
            )}
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>

        {/* Content Box Panels */}
        <div className="lg:col-span-3">
          <Card className="border border-slate-100 rounded-3xl shadow-sm bg-white overflow-hidden hover:shadow-md transition-all duration-300">
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
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Freelancer Full Name"
                          className="pl-9 py-5 rounded-xl border-slate-250 focus-visible:ring-[#00B140] focus-visible:border-[#00B140] text-xs transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-350" />
                        <Input
                          type="email"
                          value={email}
                          disabled
                          className="pl-9 py-5 rounded-xl border-transparent bg-slate-50/50 text-slate-450 text-xs cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Freelancer / Company Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="e.g. Adebayo Design Studio"
                          className="pl-9 py-5 rounded-xl border-slate-250 focus-visible:ring-[#00B140] focus-visible:border-[#00B140] text-xs transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary Currency</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#00B140] focus:border-[#00B140] text-xs cursor-pointer transition-all"
                        >
                          <option value="NGN">₦ Nigerian Naira (NGN)</option>
                          <option value="USD">$ United States Dollar (USD)</option>
                          <option value="EUR">€ Euro (EUR)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +234 803 123 4567"
                          className="pl-9 py-5 rounded-xl border-slate-250 focus-visible:ring-[#00B140] focus-visible:border-[#00B140] text-xs transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location / Country</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Lagos, Nigeria"
                          className="pl-9 py-5 rounded-xl border-slate-250 focus-visible:ring-[#00B140] focus-visible:border-[#00B140] text-xs transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="py-5 px-6 rounded-xl bg-[#00B140] hover:bg-[#009933] text-white font-bold text-xs transition-all hover:translate-y-[-1px] active:translate-y-[0px] shadow-md shadow-emerald-500/10 flex items-center gap-2"
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
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="pl-9 py-5 rounded-xl border-slate-250 focus-visible:ring-[#00B140] focus-visible:border-[#00B140] text-xs transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          className="pl-9 py-5 rounded-xl border-slate-250 focus-visible:ring-[#00B140] focus-visible:border-[#00B140] text-xs transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Verify new password"
                          className="pl-9 py-5 rounded-xl border-slate-250 focus-visible:ring-[#00B140] focus-visible:border-[#00B140] text-xs transition-all"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="py-5 px-6 rounded-xl bg-[#00B140] hover:bg-[#009933] text-white font-bold text-xs transition-all hover:translate-y-[-1px] active:translate-y-[0px] shadow-md shadow-emerald-500/10 flex items-center gap-2"
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
                    <div className="bg-slate-50/70 border border-slate-100 p-6 rounded-3xl flex flex-col justify-between h-[210px] transition-all hover:border-slate-200">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Account Status</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                          {isFreePromo ? "Early Adopter Pro" : "Kavio Free"}
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase">
                            {isFreePromo ? "Promo Active" : "Free Tier"}
                          </Badge>
                        </h3>
                        <p className="text-xs text-slate-550 font-semibold mt-2.5 leading-relaxed">
                          {isFreePromo 
                            ? "Unlimited billing invoices, automated WhatsApp reminders, client directory nesting, and printable P&L reports."
                            : "Standard freelancer tools, including invoice creation, manual payment logging, and revenue statements."
                          }
                        </p>
                      </div>

                      <div className="text-xs text-slate-500 font-bold flex items-center gap-1.5 mt-2">
                        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                        {isFreePromo 
                          ? `Early Adopter Promotion: Registered user #${totalUsersCount} of 10`
                          : "Standard plan limits apply."
                        }
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="bg-slate-50/30 border border-slate-100/50 p-6 rounded-3xl flex flex-col justify-between h-[210px] transition-all hover:border-slate-200">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                          {isFreePromo ? "Early Adopter Benefits" : "Standard Plan Features"}
                        </span>
                        <ul className="space-y-2.5 text-xs text-slate-600 font-bold">
                          <li className="flex items-center gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-[#00B140]" />
                            Unlimited client profiles and connections
                          </li>
                          <li className="flex items-center gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-[#00B140]" />
                            WhatsApp invoice link reminders
                          </li>
                          <li className="flex items-center gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-[#00B140]" />
                            Deductions & dynamic pre-tax reports
                          </li>
                        </ul>
                      </div>

                      {isFreePromo ? (
                        <div className="text-center font-bold text-xs text-emerald-700 bg-emerald-50/60 border border-emerald-100/40 py-3 rounded-xl uppercase mt-2">
                          ₦0/month (Free Lifetime Access)
                        </div>
                      ) : (
                        <div className="text-center font-bold text-xs text-slate-500 bg-slate-100 py-3 rounded-xl uppercase mt-2">
                          Standard Plan (Free)
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* Tab 4: PWA Installation Options */}
              {activeTab === "PWA" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">Kavio Desktop & Mobile App</h2>
                    <p className="text-xs text-slate-505 mt-1">Install Kavio directly onto your device for quick startup, native notification hooks, and offline operations.</p>
                  </div>

                  {isIOS ? (
                    <div className="bg-slate-50/50 rounded-3xl p-6 sm:p-8 border border-slate-100 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <Smartphone className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">iOS Safari Installation Guide</h4>
                          <p className="text-[11px] text-slate-450 font-semibold">Follow these simple steps to install Kavio on your iPhone or iPad</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                        {/* Step 1 */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-4 shadow-sm hover:border-slate-200 transition-all duration-300">
                          <div className="space-y-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center">
                              1
                            </div>
                            <h5 className="text-xs font-bold text-slate-800">Open Share Menu</h5>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                              Tap the **Share** button in Safari's bottom toolbar (looks like a square with an upward arrow).
                            </p>
                          </div>
                          <div className="flex items-center justify-center p-3.5 bg-slate-50/50 rounded-xl">
                            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-sm">
                              <Share className="w-4 h-4 text-emerald-500" />
                            </div>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-4 shadow-sm hover:border-slate-200 transition-all duration-300">
                          <div className="space-y-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center">
                              2
                            </div>
                            <h5 className="text-xs font-bold text-slate-800">Add to Home Screen</h5>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                              Scroll down the Safari action checklist and select **Add to Home Screen** from the choices.
                            </p>
                          </div>
                          <div className="flex items-center justify-center p-3.5 bg-slate-50/50 rounded-xl">
                            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-sm">
                              <PlusSquare className="w-4 h-4 text-emerald-500" />
                            </div>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-4 shadow-sm hover:border-slate-200 transition-all duration-300">
                          <div className="space-y-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center">
                              3
                            </div>
                            <h5 className="text-xs font-bold text-slate-800">Confirm & Launch</h5>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                              Confirm the app details (Kavio) and tap **Add** in the top-right corner. The app will launch directly from your home screen.
                            </p>
                          </div>
                          <div className="flex items-center justify-center p-3.5 bg-slate-50/50 rounded-xl">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                              <Check className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50/60 border border-slate-100 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-sm transition-all duration-300">
                      <div className="space-y-1.5 max-w-md">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Smartphone className="w-4.5 h-4.5 text-slate-500" />
                          Install Status
                        </h4>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                          {isPWAInstallable 
                            ? "Kavio is fully optimized as an installable Progressive Web Application (PWA). You can trigger installation below." 
                            : "Kavio App is either already installed, or your browser environment does not support automatic prompts. You can also install it manually via your browser's address bar settings."
                          }
                        </p>
                      </div>

                      <Button
                        onClick={handleTriggerPWAInstall}
                        disabled={!isPWAInstallable}
                        className="bg-[#00B140] hover:bg-[#009933] disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl text-xs shrink-0 flex items-center gap-2 transition-all hover:translate-y-[-1px] active:translate-y-[0px] shadow-md shadow-emerald-500/10 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-350" />
                        Add to Home Screen
                      </Button>
                    </div>
                  )}
                </div>
              )}



              {/* Tab 6: Contact & Support */}
              {activeTab === "SUPPORT" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">Contact & Support</h2>
                    <p className="text-xs text-slate-505 mt-1">Get in touch with the Kavio founder directly for support, feature requests, or partnerships.</p>
                  </div>

                  <div className="bg-emerald-50/40 rounded-3xl p-6 border border-emerald-100/80 space-y-6 hover:shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg shadow-sm shrink-0 border border-emerald-100/40">
                        💬
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Direct WhatsApp Support</h4>
                        <p className="text-[11px] text-slate-450 font-semibold">Message the founder directly on WhatsApp for instant assistance</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                      <div className="text-left w-full sm:w-auto">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                        <span className="text-sm font-mono font-bold text-slate-750">07011755321</span>
                      </div>
                      
                      <Button
                        onClick={() => window.open("https://wa.me/2347011755321", "_blank")}
                        className="bg-[#00B140] hover:bg-[#009933] text-white font-bold py-4 px-6 rounded-xl text-xs shrink-0 flex items-center gap-2 border-none transition-all hover:translate-y-[-1px] active:translate-y-[0px] shadow-md shadow-emerald-500/10 w-full sm:w-auto justify-center cursor-pointer"
                      >
                        <Phone className="w-4 h-4" />
                        Chat on WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>

      </div>

      {/* Mobile-only sticky footer strip */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/90 backdrop-blur-md border-t border-rose-100 flex items-center gap-3">
        {session?.user?.isAdmin && (
          <button
            onClick={() => window.location.href = "/fintech/admin"}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            Admin Panel
          </button>
        )}
        <button
          id="mobile-sticky-signout"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-sm bg-rose-500 text-white hover:bg-rose-600 active:scale-[0.98] transition-all shadow-lg shadow-rose-500/25 disabled:opacity-60 cursor-pointer"
        >
          {isSigningOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          {isSigningOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>

    </div>
  );
}
