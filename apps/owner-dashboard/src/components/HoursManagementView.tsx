import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type { DayHoursContract } from "@core/types/business";
import type { DashboardMode } from "../types";

interface HoursManagementViewProps {
  mode: DashboardMode;
  schedule: DayHoursContract[];
  onUpdateSchedule: (updatedSchedule: DayHoursContract[]) => Promise<{ success: boolean; error?: string }>;
}

export function HoursManagementView({
  mode,
  schedule,
  onUpdateSchedule,
}: HoursManagementViewProps) {
  const [localSchedule, setLocalSchedule] = useState<DayHoursContract[]>(schedule);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setLocalSchedule(schedule);
  }, [schedule]);

  const handleToggleClosed = (index: number) => {
    setLocalSchedule((prev) =>
      prev.map((day, i) =>
        i === index
          ? {
              ...day,
              isClosed: !day.isClosed,
              hours: !day.isClosed ? "Closed" : "5:00 PM – 10:30 PM",
            }
          : day
      )
    );
  };

  const handleTimeChange = (index: number, field: "openDisplay" | "closeDisplay", value: string) => {
    setLocalSchedule((prev) =>
      prev.map((day, i) => {
        if (i !== index) return day;
        const open = field === "openDisplay" ? value : (day.openDisplay || "5:00 PM");
        const close = field === "closeDisplay" ? value : (day.closeDisplay || "10:30 PM");
        return {
          ...day,
          [field]: value,
          hours: day.isClosed ? "Closed" : `${open} – ${close}`,
        };
      })
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setErrorMessage(null);

    try {
      const result = await onUpdateSchedule(localSchedule);
      if (result.success) {
        setSaveSuccess(
          mode === "live"
            ? "Operating schedule saved to database!"
            : "Operating schedule updated in simulation memory."
        );
        setTimeout(() => setSaveSuccess(null), 3000);
      } else {
        setErrorMessage(result.error || "Failed to update operating schedule.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unexpected save error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-[#F6EAD9]">
          Business Hours & Schedule
        </h2>
        <p className="text-xs text-[#8D755F] mt-0.5">
          Configure weekly opening hours and toggle off-days.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-[#3B2417] bg-[#241611]/60 shadow-lg">
          <div className="divide-y divide-[#3B2417]/60">
            {localSchedule.map((day, index) => (
              <div
                key={day.day}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-6 hover:bg-[#170D08]/30 transition-colors"
              >
                <div className="flex items-center gap-3 w-36">
                  <span className="text-sm font-semibold text-[#F6EAD9]">
                    {day.day}
                  </span>
                  {day.isClosed ? (
                    <span className="rounded bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/20">
                      Closed
                    </span>
                  ) : (
                    <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                      Open
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {!day.isClosed ? (
                    <div className="flex items-center gap-2 text-xs">
                      <input
                        type="text"
                        value={day.openDisplay || "5:00 PM"}
                        onChange={(e) => handleTimeChange(index, "openDisplay", e.target.value)}
                        className="w-24 rounded-lg border border-[#3B2417] bg-[#170D08] px-2.5 py-1.5 text-center text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
                      />
                      <span className="text-[#8D755F]">to</span>
                      <input
                        type="text"
                        value={day.closeDisplay || "10:30 PM"}
                        onChange={(e) => handleTimeChange(index, "closeDisplay", e.target.value)}
                        className="w-24 rounded-lg border border-[#3B2417] bg-[#170D08] px-2.5 py-1.5 text-center text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
                      />
                    </div>
                  ) : (
                    <span className="text-xs italic text-[#8D755F] px-4">
                      All day off
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleClosed(index)}
                    className="rounded-lg border border-[#3B2417] bg-[#170D08] px-3 py-1.5 text-xs text-[#F6EAD9]/80 hover:border-[#D9A45B]/40 hover:text-[#D9A45B] transition-colors"
                  >
                    {day.isClosed ? "Set Open" : "Mark Closed"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-[#B0793F] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#FBF4E8] hover:bg-[#B0793F]/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Weekly Schedule"}
          </button>
        </div>
      </form>
    </div>
  );
}
