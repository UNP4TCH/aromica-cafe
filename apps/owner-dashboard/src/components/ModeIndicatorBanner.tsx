import { useState, useEffect } from "react";
import { Laptop, Lock, RefreshCw, X, AlertTriangle } from "lucide-react";
import { checkSyncServerHealth } from "@core/services/demoSyncService";
import type { DashboardMode } from "../types";

interface ModeIndicatorBannerProps {
  mode: DashboardMode;
  userEmail?: string;
  onOpenAuth: () => void;
  onSwitchToSimulation: () => void;
  onResetSimulationData: () => void;
}

export function ModeIndicatorBanner({
  mode,
  userEmail,
  onOpenAuth,
  onSwitchToSimulation,
  onResetSimulationData,
}: ModeIndicatorBannerProps) {
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isSyncLive, setIsSyncLive] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const ok = await checkSyncServerHealth();
      if (mounted) setIsSyncLive(ok);
    };
    void check();
    const timer = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  if (mode === "live") {
    return (
      <div className="border-b border-emerald-500/30 bg-emerald-950/40 px-4 py-2 text-xs text-emerald-200">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            <span className="font-semibold uppercase tracking-wider text-emerald-400">
              Live Database Mode
            </span>
            <span className="text-emerald-400/40">|</span>
            <span className="text-emerald-200/90">
              Connected to Supabase as <strong className="font-medium text-emerald-100">{userEmail}</strong>
            </span>
            <span className="hidden sm:inline text-emerald-400/70">
              (Changes persist to PostgreSQL under RLS)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSwitchToSimulation}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-900/40 px-3 py-1 text-[11px] font-medium text-emerald-300 transition-colors hover:bg-emerald-800/40"
            >
              <Laptop className="size-3" />
              <span>Switch to Simulation Mode</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-[#D9A45B]/30 bg-[#241611] px-4 py-2 text-xs text-[#FBF4E8]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#D9A45B]/40 bg-[#D9A45B]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#D9A45B]">
              <Laptop className="size-3" />
              Simulation Mode
            </span>
            <span className="font-medium text-[#F6EAD9]">
              Interactive Portfolio Showcase
            </span>
            <span className="hidden md:inline text-[#8D755F]">·</span>
            <span className="hidden md:inline text-[#8D755F]">
              Simulated changes synchronize in real-time across the demo environment.
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isSyncLive !== null && (
              <span
                className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                  isSyncLive
                    ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-400"
                    : "border-amber-500/30 bg-amber-950/40 text-amber-300"
                }`}
                title={
                  isSyncLive
                    ? "Background sync bridge running on port 5176"
                    : "Sync bridge unreachable; falling back to browser storage"
                }
              >
                <span
                  className={`size-1.5 rounded-full ${
                    isSyncLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                <span>{isSyncLive ? "Sync Live (5176)" : "Local Storage"}</span>
              </span>
            )}

            <button
              onClick={() => setIsResetConfirmOpen(true)}
              title="Reset in-memory changes back to original sample data"
              className="inline-flex items-center gap-1 rounded-lg border border-[#3B2417] bg-[#170D08]/80 px-2.5 py-1 text-[11px] font-medium text-[#F6EAD9]/80 transition-colors hover:border-[#D9A45B]/40 hover:text-[#D9A45B]"
            >
              <RefreshCw className="size-3" />
              <span>Reset Demo Data</span>
            </button>

            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9A45B]/40 bg-[#D9A45B]/10 px-3 py-1 text-[11px] font-medium text-[#D9A45B] transition-colors hover:bg-[#D9A45B]/20"
            >
              <Lock className="size-3" />
              <span>Connect Live Supabase</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Reset Demo Data */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-[#D9A45B]/40 bg-[#241611] p-6 shadow-2xl text-[#FBF4E8]">
            <button
              onClick={() => setIsResetConfirmOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-[#8D755F] hover:bg-[#170D08]"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-2.5 text-[#D9A45B] mb-3">
              <AlertTriangle className="size-5 shrink-0 text-[#D9A45B]" />
              <h3 className="font-serif text-lg font-bold text-[#F6EAD9]">
                Reset All Demo Data?
              </h3>
            </div>

            <p className="text-xs text-[#F6EAD9]/80 mb-4 leading-relaxed">
              This will restore the original sample menu, categories, schedule, and business details to their pristine defaults. Any simulated modifications across both the dashboard and public website will be restored.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="rounded-xl border border-[#3B2417] px-4 py-2 text-xs text-[#8D755F] hover:text-[#FBF4E8] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsResetConfirmOpen(false);
                  onResetSimulationData();
                }}
                className="rounded-xl bg-[#B0793F] px-4 py-2 text-xs font-semibold text-[#FBF4E8] hover:bg-[#B0793F]/90 transition-colors"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
