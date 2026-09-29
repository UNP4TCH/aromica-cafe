import { ArrowRight, MessageCircle, ShoppingBag } from "lucide-react";
import { cafe } from "@/data/cafe";
import { useScrollReveal } from "@/lib/useScrollReveal";

export function OrderSection() {
  const { ref, isRevealed } = useScrollReveal();

  return (
    <section className="border-t border-coffee/15 bg-cream-2/50 px-5 py-16 lg:px-8 lg:py-20">
      <div
        ref={ref}
        className={`reveal-fade-up mx-auto max-w-7xl ${isRevealed ? "is-revealed" : ""}`}
      >
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-caramel">
              Takeaway &amp; Neighborhood Delivery
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight text-coffee sm:text-4xl lg:text-5xl">
              Craving your favorites this evening?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Place your order directly through our digital ordering platform for quick preparation, or chat with us on WhatsApp for any special requests.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
            <a
              href={cafe.orderOnline.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex min-h-[44px] items-center justify-center gap-2.5 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-paper shadow-paper transition-all duration-200 hover:bg-accent/90 hover:-translate-y-0.5 hover:shadow-paper-lg active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent"
            >
              <ShoppingBag className="size-4 text-paper transition-transform duration-200 group-hover:scale-105" />
              <span>Order Online</span>
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>

            <a
              href={cafe.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-coffee/25 bg-card px-6 py-3.5 text-sm font-semibold text-coffee transition-all duration-200 hover:-translate-y-0.5 hover:bg-cream-2/70 active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-coffee"
            >
              <MessageCircle className="size-4 text-wa transition-transform duration-200 group-hover:scale-110" />
              <span>WhatsApp Us</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
