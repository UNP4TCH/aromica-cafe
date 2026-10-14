import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  Clock,
  Coffee,
  Database,
  FileEdit,
  History,
  Image,
  Layers,
  RefreshCw,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import type { ActivityEvent } from "../types";
import { supabase, isSupabaseConfigured } from "@core/lib/supabase";

interface RecentActivityViewProps {
  mode: "simulation" | "live";
  tenantSlug: string;
  simulatedActivities: ActivityEvent[];
  onClearSimulatedHistory: () => void;
}

export function RecentActivityView({
  mode,
  tenantSlug,
  simulatedActivities,
  onClearSimulatedHistory,
}: RecentActivityViewProps) {
  const [liveActivities, setLiveActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLiveAuditLogs = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setErrorMsg("Supabase is not configured. Live audit trail requires connected project.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Resolve tenant UUID
      const { data: tenantData, error: tenantErr } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", tenantSlug)
        .single();

      if (tenantErr || !tenantData) {
        setErrorMsg("Tenant record not found or inaccessible under current session.");
        setLoading(false);
        return;
      }

      // 2. Fetch audit logs strictly isolated to this tenant
      const { data: auditData, error: auditErr } = await supabase
        .from("audit_logs")
        .select("id, action, entity_type, entity_id, old_data, new_data, created_at, user_id")
        .eq("tenant_id", tenantData.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (auditErr) {
        setErrorMsg(`Failed to load audit records: ${auditErr.message}`);
        setLoading(false);
        return;
      }

      const formatted: ActivityEvent[] = (auditData || []).map((row) => {
        let desc = `${row.action} on ${row.entity_type}`;
        if (row.entity_type === "menu_item" && row.new_data) {
          const item = row.new_data as Record<string, unknown>;
          desc = `Modified item: "${item.name || 'Menu Item'}" (₹${item.price || ''})`;
        }

        return {
          id: row.id,
          action: row.action as ActivityEvent["action"],
          entityType: row.entity_type as ActivityEvent["entityType"],
          description: desc,
          details: row.new_data ? JSON.stringify(row.new_data).slice(0, 100) : undefined,
          timestamp: row.created_at,
          userEmail: row.user_id ? `User ${String(row.user_id).slice(0, 8)}...` : "Owner",
          isSimulated: false,
        };
      });

      setLiveActivities(formatted);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unexpected audit fetch error");
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    if (mode === "live") {
      void fetchLiveAuditLogs();
    }
  }, [mode, fetchLiveAuditLogs]);

  const activeList = mode === "simulation" ? simulatedActivities : liveActivities;

  const getEventIcon = (entityType: ActivityEvent["entityType"]) => {
    switch (entityType) {
      case "menu_item":
        return <Coffee className="size-4 text-[#D9A45B]" />;
      case "category":
        return <Layers className="size-4 text-[#C5A880]" />;
      case "operating_schedule":
        return <Clock className="size-4 text-[#D9A45B]" />;
      case "business_profile":
        return <FileEdit className="size-4 text-emerald-400" />;
      case "media_asset":
        return <Image className="size-4 text-sky-400" />;
      default:
        return <Activity className="size-4 text-[#D9A45B]" />;
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
        " · " +
        d.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#3B2417] pb-5">
        <div>
          <h2 className="text-2xl font-serif text-[#F6EAD9] flex items-center gap-2.5">
            <History className="size-6 text-[#D9A45B]" />
            Recent Activity &amp; Audit Trail
          </h2>
          <p className="mt-1 text-xs text-[#C5A880]">
            Review all administrative actions, menu adjustments, and media changes for {tenantSlug}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {mode === "simulation" ? (
            <button
              type="button"
              onClick={onClearSimulatedHistory}
              disabled={simulatedActivities.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#3B2417] bg-[#241611] px-3.5 py-2 text-xs font-medium text-[#8D755F] hover:text-[#F6EAD9] hover:border-[#D9A45B]/40 disabled:opacity-40 transition-colors"
            >
              <Trash2 className="size-3.5" />
              <span>Clear Session Log</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void fetchLiveAuditLogs()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#3B2417] bg-[#241611] px-3.5 py-2 text-xs font-medium text-[#D9A45B] hover:bg-[#D9A45B]/10 disabled:opacity-40 transition-colors"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Records</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Mode State Notice */}
      <div
        className={`rounded-xl border p-4 text-xs flex items-center justify-between ${
          mode === "simulation"
            ? "border-[#D9A45B]/30 bg-[#D9A45B]/10 text-[#F6EAD9]"
            : "border-emerald-500/30 bg-emerald-950/20 text-emerald-200"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {mode === "simulation" ? (
            <Sparkles className="size-4 text-[#D9A45B] shrink-0" />
          ) : (
            <Database className="size-4 text-emerald-400 shrink-0" />
          )}
          <span>
            {mode === "simulation"
              ? "Viewing In-Memory Session History (Simulated changes are kept locally and will not affect the database)."
              : "Viewing Live PostgreSQL Audit Records (Backed by audit_logs with Row Level Security isolation)."}
          </span>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/40">
          {mode === "simulation" ? "Simulation" : "Live DB"}
        </span>
      </div>

      {/* 3. Error Alert */}
      {errorMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-300">
          <AlertCircle className="size-5 shrink-0 text-red-400" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* 4. Activity Timeline / List */}
      <div className="rounded-2xl border border-[#3B2417] bg-[#241611] overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#8D755F]">
            <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-[#D9A45B]" />
            <p>Querying audit records from Supabase...</p>
          </div>
        ) : activeList.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8D755F]">
            <History className="size-8 mx-auto mb-3 opacity-40 text-[#D9A45B]" />
            <p className="text-sm font-medium text-[#F6EAD9]">No activity recorded yet</p>
            <p className="mt-1 max-w-sm mx-auto text-[11px]">
              {mode === "simulation"
                ? "Perform menu edits, availability toggles, or image uploads to generate in-memory session events."
                : "No PostgreSQL audit records have been generated for this tenant yet."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#3B2417]">
            {activeList.map((item) => (
              <li
                key={item.id}
                className="p-4 sm:p-5 hover:bg-[#170D08]/40 transition-colors flex items-start gap-4"
              >
                <div className="size-9 rounded-xl border border-[#3B2417] bg-[#170D08] flex items-center justify-center shrink-0 mt-0.5">
                  {getEventIcon(item.entityType)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#F6EAD9]">
                      {item.description}
                    </p>
                    <span className="text-[11px] text-[#8D755F] tabular-nums">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>

                  {item.details && (
                    <p className="mt-1 text-[11px] font-mono text-[#C5A880] truncate">
                      {item.details}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="rounded bg-[#170D08] px-2 py-0.5 text-[#8D755F] border border-[#3B2417]">
                      {item.action}
                    </span>
                    <span className="rounded bg-[#170D08] px-2 py-0.5 text-[#8D755F] border border-[#3B2417]">
                      {item.entityType}
                    </span>
                    {item.userEmail && (
                      <span className="flex items-center gap-1 text-[#8D755F]">
                        <User className="size-3" />
                        <span>{item.userEmail}</span>
                      </span>
                    )}
                    {item.isSimulated && (
                      <span className="text-[#D9A45B] italic font-semibold">
                        · Simulated Event
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
