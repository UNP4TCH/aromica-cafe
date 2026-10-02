import { demoConfig } from "@/data/demoConfig";
import { cn } from "@/lib/utils";

interface PhotoWatermarkProps {
  className?: string;
  variant?: "badge" | "subtle";
}

export function PhotoWatermark({ className, variant = "badge" }: PhotoWatermarkProps) {
  if (!demoConfig.enabled || !demoConfig.watermark.enabled) return null;

  return (
    <span
      className={cn(
        "pointer-events-none select-none z-10 transition-opacity duration-200",
        variant === "badge" &&
          "absolute bottom-2.5 right-2.5 rounded bg-darkest/65 px-2 py-0.5 text-[9px] sm:text-[10px] font-sans font-medium tracking-[0.16em] uppercase text-paper/85 backdrop-blur-[2px] border border-white/10 shadow-xs",
        variant === "subtle" &&
          "text-[9px] uppercase tracking-widest text-gold/80 font-mono",
        className
      )}
      aria-hidden="true"
    >
      {demoConfig.watermark.text}
    </span>
  );
}
