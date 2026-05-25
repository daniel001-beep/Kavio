"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/src/lib/supabase-client";
import { 
  Shield, 
  Activity, 
  Wifi, 
  WifiOff, 
  Globe, 
  Laptop, 
  Clock, 
  User, 
  AlertTriangle 
} from "lucide-react";

// Define strict TypeScript types matching the database schema
export interface AuditLog {
  id: string;
  user_tenant: string;
  action_event: string;
  location_ip: string;
  device_info: string;
  created_at: string;
}

export default function AuditLogsTable() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [latestRowId, setLatestRowId] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  // 1. Fetch initial 20 historical logs on mount and subscribe to WebSockets
  useEffect(() => {
    async function fetchHistoricalLogs() {
      try {
        setError(null);
        // Fetch the last 20 audit logs sorted by newest first
        const { data, error: dbError } = await supabase
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);

        if (dbError) {
          // If table doesn't exist yet, we capture that specifically to aid developers
          if (dbError.code === "P0001" || dbError.message.includes("does not exist")) {
            throw new Error("The 'audit_logs' table does not exist in your Supabase database. Please apply the SQL schema first.");
          }
          throw dbError;
        }

        setLogs(data || []);
      } catch (err: any) {
        console.error("Error loading audit logs:", err);
        setError(err.message || "Failed to fetch audit logs.");
      } finally {
        setLoading(false);
      }
    }

    fetchHistoricalLogs();

    // 2. Establish a persistent Supabase Realtime WebSocket subscription
    try {
      setRealtimeStatus("connecting");
      
      const channel = supabase
        .channel("audit_logs_realtime_feed")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "audit_logs",
          },
          (payload) => {
            const newRecord = payload.new as AuditLog;
            if (newRecord && newRecord.id) {
              // Optimistic UI state update: Prepend the event to the top of the array instantly
              setLogs((prevLogs) => {
                const updated = [newRecord, ...prevLogs];
                // Keep the list capped at the 20 most recent logs
                return updated.slice(0, 20);
              });

              // Set the ID of the new row to trigger the CSS flash effect
              setLatestRowId(newRecord.id);

              // Reset flash effect target after animation finishes
              setTimeout(() => {
                setLatestRowId((curr) => (curr === newRecord.id ? null : curr));
              }, 3000);
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setRealtimeStatus("connected");
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            setRealtimeStatus("disconnected");
          }
        });

      subscriptionRef.current = channel;
    } catch (realtimeErr) {
      console.error("Failed to establish Supabase Realtime subscription:", realtimeErr);
      setRealtimeStatus("disconnected");
    }

    // Cleanup subscription on component unmount
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);

  // Helper: Format datetime strings into a premium readable local string
  const formatTimestamp = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + 
        " " + date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return dateString;
    }
  };

  // Helper: Truncate long UUIDs or User Agents gracefully
  const truncateString = (str: string, maxLen: number = 30) => {
    if (!str) return "Unknown";
    return str.length > maxLen ? `${str.slice(0, maxLen)}...` : str;
  };

  // Helper: Render visually harmonious pill badges for event categories
  const renderEventBadge = (event: string) => {
    const evUpper = event.toUpperCase();
    if (evUpper.includes("LOGIN") || evUpper.includes("SIGNIN") || evUpper.includes("AUTH_SUCCESS") || evUpper.includes("REGISTER")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {event}
        </span>
      );
    }
    if (evUpper.includes("LOGOUT") || evUpper.includes("SIGNOUT") || evUpper.includes("SESSION_EXPIRED")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          {event}
        </span>
      );
    }
    if (evUpper.includes("BLOCKED") || evUpper.includes("LOCKDOWN") || evUpper.includes("UNAUTHORIZED") || evUpper.includes("FAIL") || evUpper.includes("DENIED")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
          {event}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        {event}
      </span>
    );
  };

  // Helper: Try parsing User Agent for sleek UI displays (Chrome/Windows etc.)
  const parseUserAgent = (ua: string) => {
    if (!ua) return "Unknown Browser";
    
    let browser = "Other Browser";
    let os = "Unknown OS";

    // Basic Browser parsing
    if (ua.includes("Firefox/")) browser = "Firefox";
    else if (ua.includes("Edg/")) browser = "Edge";
    else if (ua.includes("Chrome/")) browser = "Chrome";
    else if (ua.includes("Safari/")) browser = "Safari";

    // Basic OS parsing
    if (ua.includes("Windows NT")) os = "Windows";
    else if (ua.includes("Macintosh")) os = "macOS";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("Linux")) os = "Linux";

    return `${browser} on ${os}`;
  };

  return (
    <div className="w-full bg-zinc-950/80 backdrop-blur-md rounded-xl border border-zinc-800/60 shadow-2xl overflow-hidden relative">
      
      {/* 1. Embed the Self-Contained Keyframe Animations for Instant Highlighting */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes row-flash-in {
          0% {
            background-color: rgba(16, 185, 129, 0.22);
            border-color: rgba(16, 185, 129, 0.4);
            transform: scale(1.003);
          }
          100% {
            background-color: transparent;
            border-color: rgba(39, 39, 42, 0.6);
            transform: scale(1);
          }
        }
        .animate-row-flash {
          animation: row-flash-in 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Header Bar */}
      <div className="px-6 py-5 border-b border-zinc-800/60 bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-zinc-400">
            <Shield className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
              Platform Access & Real-Time Event Audit Logs
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Securely capturing and auditing incoming security authentication & network activity logs.
            </p>
          </div>
        </div>

        {/* WebSocket Pulse Indicator */}
        <div className="flex items-center self-start sm:self-center">
          {realtimeStatus === "connected" && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="w-3.5 h-3.5" />
              LIVE Realtime Active
            </div>
          )}
          {realtimeStatus === "connecting" && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-pulse"></span>
              </span>
              <Activity className="w-3.5 h-3.5 animate-spin" />
              Establishing Feed...
            </div>
          )}
          {realtimeStatus === "disconnected" && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <WifiOff className="w-3.5 h-3.5" />
              WebSocket Offline
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full overflow-x-auto">
        {loading ? (
          /* Premium Skeleton State */
          <div className="w-full divide-y divide-zinc-900">
            <div className="bg-zinc-900/10 px-6 py-4 flex justify-between gap-4 animate-pulse">
              <div className="h-5 w-1/4 bg-zinc-800 rounded"></div>
              <div className="h-5 w-1/6 bg-zinc-800 rounded"></div>
              <div className="h-5 w-1/5 bg-zinc-800 rounded"></div>
              <div className="h-5 w-1/6 bg-zinc-800 rounded"></div>
            </div>
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="px-6 py-5 flex items-center justify-between gap-6 animate-pulse">
                <div className="flex items-center gap-3 w-1/4">
                  <div className="w-8 h-8 bg-zinc-800 rounded-full"></div>
                  <div className="h-4 bg-zinc-800 rounded w-2/3"></div>
                </div>
                <div className="h-4 bg-zinc-800 rounded w-1/6"></div>
                <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
                <div className="h-4 bg-zinc-800 rounded w-1/12"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State Card with developer diagnostic guidance */
          <div className="p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto">
            <div className="p-3 bg-rose-500/10 rounded-full border border-rose-500/20 text-rose-500 mb-4 animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-zinc-200 font-semibold text-base">Audit logs fetch interrupted</h3>
            <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
              {error}
            </p>
            <div className="mt-6 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-left w-full">
              <span className="text-[10px] text-zinc-500 font-mono block uppercase mb-1">Developer Solution:</span>
              <code className="text-xs text-zinc-300 font-mono block select-all overflow-x-auto whitespace-nowrap p-1 bg-black/40 rounded">
                supabase/migrations/20260525_audit_logs.sql
              </code>
              <span className="text-[10px] text-zinc-400 block mt-2">
                Make sure you run the migrations inside your Supabase SQL editor to create the `audit_logs` table!
              </span>
            </div>
          </div>
        ) : logs.length === 0 ? (
          /* Empty Database State */
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="p-4 bg-zinc-900 rounded-full border border-zinc-800 text-zinc-400 mb-4">
              <Activity className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-zinc-300 font-medium">No events logged yet</h3>
            <p className="text-zinc-500 text-xs mt-1 max-w-sm">
              Incoming security activities, sign-ins, and user actions will stream directly to this feed in real-time.
            </p>
          </div>
        ) : (
          /* Premium Table Rendering */
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-900/10 text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Tenant / User</th>
                <th className="px-6 py-4">Action / Event</th>
                <th className="px-6 py-4">Location IP</th>
                <th className="px-6 py-4">Device & OS</th>
                <th className="px-6 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {logs.map((log) => {
                const isNew = log.id === latestRowId;
                return (
                  <tr
                    key={log.id}
                    className={`transition-all duration-300 hover:bg-zinc-900/30 group ${
                      isNew ? "animate-row-flash" : "border-zinc-850"
                    }`}
                  >
                    {/* User / Tenant */}
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:border-zinc-700/80 transition-colors">
                          <User className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-zinc-200 group-hover:text-zinc-100 transition-colors">
                            {truncateString(log.user_tenant, 24)}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                            ID: {log.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Action / Event */}
                    <td className="px-6 py-4.5">
                      {renderEventBadge(log.action_event)}
                    </td>

                    {/* Location IP */}
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-xs font-mono text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800/80">
                          {log.location_ip}
                        </span>
                      </div>
                    </td>

                    {/* Device / OS User Agent */}
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-2 group/ua">
                        <Laptop className="w-3.5 h-3.5 text-zinc-500" />
                        <span 
                          className="text-xs text-zinc-300 cursor-help"
                          title={log.device_info}
                        >
                          {parseUserAgent(log.device_info)}
                        </span>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="px-6 py-4.5 text-right">
                      <div className="inline-flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        {formatTimestamp(log.created_at)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer statistics counter bar */}
      <div className="px-6 py-4 border-t border-zinc-800/60 bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          Showing last {logs.length} tracked events.
        </span>
        <span>
          Next.js 15 App Router &bull; Secure Encoded SSL Endpoints
        </span>
      </div>
    </div>
  );
}
