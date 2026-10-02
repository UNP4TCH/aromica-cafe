import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { cafe, weeklySchedule } from "@/data/cafe";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const kolkataFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

interface StatusInfo {
  isOpen: boolean;
  label: string;
  isClosingSoon?: boolean;
}

function calculateCurrentStatus(): StatusInfo {
  try {
    const parts = kolkataFormatter.formatToParts(new Date());
    const getVal = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const currentDay = WEEKDAY_INDEX[getVal("weekday")] ?? 0;
    const hour = parseInt(getVal("hour"), 10) || 0;
    const minute = parseInt(getVal("minute"), 10) || 0;
    const currentMinutes = hour * 60 + minute;

    const todaySchedule = weeklySchedule.find((s) => s.dayIndex === currentDay);

    const findNextOpenDay = (): { dayText: string; openDisplay: string } => {
      for (let offset = 1; offset <= 7; offset++) {
        const checkDay = (currentDay + offset) % 7;
        const sched = weeklySchedule.find((s) => s.dayIndex === checkDay);
        if (sched && !sched.isClosed) {
          const dayText = offset === 1 ? "tomorrow" : (DAY_NAMES[checkDay] || "soon");
          const openDisplay = sched.openDisplay || "5:00 PM";
          return { dayText, openDisplay };
        }
      }
      return { dayText: "soon", openDisplay: "5:00 PM" };
    };

    if (
      todaySchedule &&
      !todaySchedule.isClosed &&
      todaySchedule.openMinutes !== undefined &&
      todaySchedule.closeMinutes !== undefined
    ) {
      const openMin = todaySchedule.openMinutes;
      const closeMin = todaySchedule.closeMinutes;
      const openDisplay = todaySchedule.openDisplay || "5:00 PM";
      const closeDisplay = todaySchedule.closeDisplay || "10:30 PM";

      if (currentMinutes >= openMin && currentMinutes < closeMin) {
        const minutesLeft = closeMin - currentMinutes;
        if (minutesLeft <= 30) {
          return {
            isOpen: true,
            label: `Open Now · Closes at ${closeDisplay}`,
            isClosingSoon: true,
          };
        }
        return {
          isOpen: true,
          label: `Open Now · Until ${closeDisplay}`,
        };
      }

      if (currentMinutes < openMin) {
        return {
          isOpen: false,
          label: `Closed · Opens today at ${openDisplay}`,
        };
      }
    }

    // Currently closed (either day is closed or after closing time)
    const { dayText, openDisplay } = findNextOpenDay();
    return {
      isOpen: false,
      label: `Closed · Opens ${dayText} at ${openDisplay}`,
    };
  } catch {
    return {
      isOpen: false,
      label: cafe.hours.summary,
    };
  }
}

export function OpenStatusBadge({
  className,
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark" | "pill";
}) {
  const [status, setStatus] = useState<StatusInfo>(calculateCurrentStatus);

  useEffect(() => {
    const timer = setInterval(() => {
      setStatus(calculateCurrentStatus());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  if (variant === "pill") {
    return (
      <span
        role="status"
        aria-live="polite"
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium tracking-wide transition-colors",
          status.isOpen
            ? "border-green/30 bg-green/10 text-green"
            : "border-coffee/20 bg-card text-coffee",
          className
        )}
      >
        <span className="relative flex size-2">
          {status.isOpen && (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-75" />
          )}
          <span
            className={cn(
              "relative inline-flex size-2 rounded-full",
              status.isOpen ? "bg-green" : "bg-caramel"
            )}
          />
        </span>
        {status.label}
      </span>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-2 text-xs font-semibold", className)}
    >
      <span className="relative flex size-2.5">
        {status.isOpen && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-75" />
        )}
        <span
          className={cn(
            "relative inline-flex size-2.5 rounded-full",
            status.isOpen ? "bg-green" : "bg-caramel"
          )}
        />
      </span>
      <span className={status.isOpen ? "text-green font-medium" : "text-coffee/90 font-medium"}>
        {status.label}
      </span>
    </div>
  );
}
