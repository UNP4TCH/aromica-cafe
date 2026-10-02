import { useEffect, useState } from "react";
import { Mail, MessageCircle, Phone, ShoppingBag, X } from "lucide-react";
import { demoConfig } from "@/data/demoConfig";
import { OPEN_ORDER_MODAL_EVENT } from "@/lib/demoModal";

export function DemoOrderModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener(OPEN_ORDER_MODAL_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_ORDER_MODAL_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!demoConfig.enabled || !isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-order-modal-title"
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-darkest/80 p-4 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="animate-dialog-in relative w-full max-w-lg rounded-2xl border border-gold/30 bg-espresso p-6 sm:p-8 text-paper shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close demo ordering notice"
          className="absolute right-4 top-4 flex size-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-full bg-coffee/80 text-paper transition-all hover:bg-caramel hover:text-paper active:scale-95 focus-visible:outline-2 focus-visible:outline-gold"
        >
          <X className="size-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-paper shadow-sm">
            <ShoppingBag className="size-6" />
          </div>
          <div>
            <span className="rounded bg-caramel/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
              Demonstration Notice
            </span>
            <h3 id="demo-order-modal-title" className="mt-1 font-display text-xl text-paper sm:text-2xl">
              {demoConfig.externalActions.orderingNotice.title}
            </h3>
          </div>
        </div>

        {/* Notice Explanation */}
        <p className="mt-4 text-sm leading-relaxed text-paper/80">
          {demoConfig.externalActions.orderingNotice.message}
        </p>

        {/* Sales Prompt */}
        <div className="mt-6 rounded-xl border border-gold/20 bg-coffee/40 p-4 sm:p-5">
          <p className="font-display text-base text-gold sm:text-lg">
            {demoConfig.externalActions.orderingNotice.pitch}
          </p>
          <p className="mt-1 text-xs text-paper/70">
            {demoConfig.salesCta.supportingCopy}
          </p>

          <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2.5">
            <a
              href={demoConfig.owner.phoneHref}
              className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-full bg-caramel px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-paper transition-all hover:bg-caramel/90 active:scale-95"
            >
              <Phone className="size-3.5" />
              <span>{demoConfig.externalActions.orderingNotice.ctaTalk}</span>
            </a>

            <a
              href={demoConfig.owner.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-full bg-wa px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:opacity-95 active:scale-95"
            >
              <MessageCircle className="size-3.5" />
              <span>{demoConfig.externalActions.orderingNotice.ctaWhatsApp}</span>
            </a>

            <a
              href={demoConfig.owner.emailHref}
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-paper/20 bg-paper/5 px-4 py-2.5 text-xs font-medium text-paper transition-all hover:bg-paper/10 active:scale-95"
            >
              <Mail className="size-3.5 text-gold" />
              <span>Email</span>
            </a>
          </div>
        </div>

        {/* Secondary Contact Info */}
        <div className="mt-4 flex items-center justify-between border-t border-paper/10 pt-3 text-[11px] text-paper/50">
          <span>Demo by {demoConfig.owner.name}</span>
          <a
            href={demoConfig.secondaryContact.phoneHref}
            className="text-paper/70 hover:text-gold hover:underline"
          >
            Secondary: {demoConfig.secondaryContact.name} ({demoConfig.secondaryContact.phone})
          </a>
        </div>
      </div>
    </div>
  );
}
