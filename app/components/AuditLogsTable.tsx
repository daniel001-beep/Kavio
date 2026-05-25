"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/src/lib/supabase-client";
import { 
  Shield, 
  Globe, 
  Laptop, 
  Clock, 
  User, 
  Activity, 
  RefreshCw 
} from "lucide-react";

// Strict type-safe AuditLog interface matching layout specifications
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
  const [realtimeStatus, setRealtimeStatus] = useState<"SUBSCRIBED" | "SUBSCRIBE_IN_PROGRESS" | "TIMED_OUT" | "CHANNEL_ERROR" | "DISCONNECTED">("SUBSCRIBE_IN_PROGRESS");
  const [latestRowId, setLatestRowId] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Helper: Format datetime strings into a premium readable local format
  const formatTimestamp = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + 
        " - " + date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return dateString;
    }
  };

  // Helper: Format raw User Agent strings into clean human-readable descriptions
  const parseUserAgent = (ua: string) => {
    if (!ua || ua === "unknown") return "System Agent";
    let browser = "Other Browser";
    let os = "Unknown OS";

    if (ua.includes("Firefox/")) browser = "Firefox";
    else if (ua.includes("Edg/")) browser = "Edge";
    else if (ua.includes("Chrome/")) browser = "Chrome";
    else if (ua.includes("Safari/")) browser = "Safari";

    if (ua.includes("Windows NT")) os = "Windows";
    else if (ua.includes("Macintosh")) os = "macOS";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("Linux")) os = "Linux";

    return `${browser} on ${os}`;
  };

  useEffect(() => {
    // 1. Initial Ingestion - Fetch last 20 historical log records asynchronously
    async function fetchHistoricalLogs() {
      try {
        setLoading(true);
        setError(null);

        // Fetch from public.audit_log (singular active table in Supabase)
        const { data, error: sbError } = await supabase
          .from("audit_log")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(20);

        if (sbError) {
          throw sbError;
        }

        if (data && Array.isArray(data)) {
          const mapped: AuditLog[] = data.map((log: any) => ({
            id: log.id,
            user_tenant: log.metadata?.email || log.user_id || "System Agent",
            action_event: log.event_type || "SYSTEM_EVENT",
            location_ip: log.ip_address || "127.0.0.1",
            device_info: log.user_agent || "System Client",
            created_at: log.timestamp || new Date().toISOString()
          }));
          setLogs(mapped);
        }
      } catch (err: any) {
        console.warn("⚠️ Client-side direct fetch failed/restricted. Triggering secure resilient API fallback:", err.message);
        
        // Fallback: Query Next.js internal secure api which bypasses client-side RLS limits
        try {
          const res = await fetch("/api/admin/dashboard?_t=" + Date.now(), { cache: "no-store" });
          if (res.ok) {
            const fallbackData = await res.json();
            const mapped: AuditLog[] = (fallbackData.auditLogs || []).map((log: any) => ({
              id: log.id,
              user_tenant: log.userEmail || log.userName || log.metadata?.email || "System Agent",
              action_event: log.eventType,
              location_ip: log.ipAddress || "127.0.0.1",
              device_info: log.userAgent || "System Client",
              created_at: log.timestamp || new Date().toISOString()
            }));
            setLogs(mapped.slice(0, 20));
          } else {
            setError("Failed to fetch historical audit logs.");
          }
        } catch (fetchErr) {
          setError("Network error fetching historical audit logs.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchHistoricalLogs();

    // 2. Persistent Real-Time Subscription with Native Connection Status Badge
    let channel: any;
    try {
      channel = supabase
        .channel("audit_logs_realtime_feed")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "audit_log" // Target active singular Postgres audit table
          },
          (payload) => {
            const newRecord = payload.new as any;
            if (newRecord && newRecord.id) {
              // Map the raw payload perfectly to layout interface
              const uiLog: AuditLog = {
                id: newRecord.id,
                user_tenant: newRecord.metadata?.email || newRecord.user_id || "System Agent",
                action_event: newRecord.event_type || "SYSTEM_EVENT",
                location_ip: newRecord.ip_address || "127.0.0.1",
                device_info: newRecord.user_agent || "System Client",
                created_at: newRecord.timestamp || new Date().toISOString()
              };

              // 3. Zero-Lag Optimistic Prepend to State Array
              setLogs((prevLogs) => {
                const updated = [uiLog, ...prevLogs];
                return updated.slice(0, 20); // Keep exact viewport of 20 elements
              });

              // Trigger emerald highlight CSS flash effect on the new row
              setLatestRowId(uiLog.id);
              setTimeout(() => {
                setLatestRowId((curr) => (curr === uiLog.id ? null : curr));
              }, 3000);
            }
          }
        );

      // Track raw WebSocket state transitions using supabase built-in event listener
      channel.on("status", (status: string) => {
        console.log(`[Supabase WebSocket Connection Status]: ${status}`);
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("SUBSCRIBED");
        } else if (status === "SUBSCRIBE_IN_PROGRESS") {
          setRealtimeStatus("SUBSCRIBE_IN_PROGRESS");
        } else if (status === "TIMED_OUT") {
          setRealtimeStatus("TIMED_OUT");
        } else if (status === "CHANNEL_ERROR") {
          setRealtimeStatus("CHANNEL_ERROR");
        } else {
          setRealtimeStatus("DISCONNECTED");
        }
      });

      channel.subscribe();
      subscriptionRef.current = channel;
    } catch (subErr) {
      console.error("Failed to establish real-time subscription:", subErr);
      setRealtimeStatus("CHANNEL_ERROR");
    }

    // 5. Cleanup Lifecycle: Tear down WebSocket listener to prevent severe client-side leaks
    return () => {
      if (subscriptionRef.current) {
        console.log("[Supabase WebSocket] Tearing down connection channel");
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden relative">
      
      {/* Visual Flash Animation style */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes row-flash-in {
          0% {
            background-color: rgba(16, 185, 129, 0.12);
            border-color: rgba(16, 185, 129, 0.3);
            transform: scale(1.001);
          }
          100% {
            background-color: transparent;
            border-color: rgba(241, 245, 249, 1);
            transform: scale(1);
          }
        }
        .animate-row-flash {
          animation: row-flash-in 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Header Bar */}
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-xl border border-slate-200 text-slate-500">
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              Platform Access & Real-Time Event Audit Logs
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Securely capturing and auditing incoming security authentication & network activity logs.
            </p>
          </div>
        </div>

        {/* 1. Native Connection Status Badge */}
        <div className="flex items-center self-start sm:self-center">
          {realtimeStatus === "SUBSCRIBED" ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm transition-all duration-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              🟢 WebSocket Online
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 shadow-sm transition-all duration-300">
              <span className="relative flex h-2 w-2 animate-pulse">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              🔴 WebSocket Offline
            </div>
          )}
        </div>
      </div>

      {/* Main Table Grid / Content View */}
      <div className="w-full overflow-x-auto">
        {loading ? (
          /* Premium Shimmer Skeleton State */
          <div className="w-full divide-y divide-slate-100">
            <div className="bg-slate-50/50 px-6 py-4 flex justify-between gap-4 animate-pulse">
              <div className="h-5 w-1/4 bg-slate-200 rounded"></div>
              <div className="h-5 w-1/6 bg-slate-200 rounded"></div>
              <div className="h-5 w-1/5 bg-slate-200 rounded"></div>
              <div className="h-5 w-1/6 bg-slate-200 rounded"></div>
            </div>
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="px-6 py-5 flex items-center justify-between gap-6 animate-pulse">
                <div className="flex items-center gap-3 w-1/4">
                  <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                </div>
                <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/12"></div>
              </div>
            ))}
          </div>
        ) : error && logs.length === 0 ? (
          /* Error state */
          <div className="p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto">
            <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mb-4" />
            <h3 className="text-slate-800 font-bold text-sm">Failed to connect to ledger</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          /* 4. Layout Fallback Empty State Message */
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="p-4 bg-slate-50 rounded-full border border-slate-150 text-slate-400 mb-4 shadow-inner">
              <Activity className="w-8 h-8 text-slate-400 animate-pulse" />
            </div>
            <h3 className="text-slate-800 font-bold text-sm">No events logged yet</h3>
            <p className="text-slate-500 text-xs mt-2 max-w-lg leading-relaxed font-semibold">
              No events logged yet. Incoming security activities, sign-ins, and user actions will stream directly to this feed in real-time.
            </p>
          </div>
        ) : (
          /* 4. Table Layout Grid */
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4">User / Tenant</th>
                <th className="px-6 py-4">Action / Event</th>
                <th className="px-6 py-4">Location (IP)</th>
                <th className="px-6 py-4">Device Info (UA)</th>
                <th className="px-6 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => {
                const isNew = log.id === latestRowId;
                return (
                  <tr
                    key={log.id}
                    className={`transition-all duration-300 hover:bg-slate-50/50 group ${
                      isNew ? "animate-row-flash" : "border-slate-100"
                    }`}
                  >
                    {/* User / Tenant */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600 transition-all">
                          <User className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                            {log.user_tenant}
                          </div>
                          <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                            ID: {log.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Action / Event */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                        {log.action_event}
                      </span>
                    </td>

                    {/* Location (IP) */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {log.location_ip}
                        </span>
                      </div>
                    </td>

                    {/* Device Info (UA) */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Laptop className="w-3.5 h-3.5 text-slate-400" />
                        <span 
                          className="text-xs font-semibold text-slate-600 cursor-help"
                          title={log.device_info}
                        >
                          {parseUserAgent(log.device_info)}
                        </span>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
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

      {/* Footer bar */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500 font-semibold">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-600" />
          Showing last {logs.length} tracked events.
        </span>
        <span>
          Next.js 15 App Router &bull; Secure Encoded SSL Endpoints
        </span>
      </div>
    </div>
  );
}
