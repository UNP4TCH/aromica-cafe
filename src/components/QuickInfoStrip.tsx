import { Clock3, MapPin, MessageCircle, Phone, ShoppingBag } from "lucide-react";
import { cafe } from "@/data/cafe";
import { OpenStatusBadge } from "./OpenStatusBadge";
import { useScrollReveal } from "@/lib/useScrollReveal";

export function QuickInfoStrip() {
  const { ref, isRevealed } = useScrollReveal();

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      ref={ref}
      className={`reveal-fade-up border-y border-coffee/15 bg-card/60 backdrop-blur-xs ${
        isRevealed ? "is-revealed" : ""
      }`}
    >
      <div className="mx-auto grid max-w-7xl divide-y divide-coffee/15 sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
        {/* Hours & Live Status */}
        <div className="flex items-start gap-4 px-6 py-6 transition-colors hover:bg-cream-2/30">
          <Clock3 className="mt-1 size-5 shrink-0 text-caramel" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Hours &amp; Status
            </p>
            <div className="mt-1.5">
              <OpenStatusBadge />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Tue–Sun 5:00 – 10:30 PM (Mon closed)
            </p>
          </div>
        </div>

        {/* Location */}
        <a
          href="#visit"
          onClick={(e) => handleScrollTo(e, "#visit")}
          className="group flex items-start gap-4 px-6 py-6 transition-colors hover:bg-cream-2/40"
        >
          <MapPin className="mt-1 size-5 shrink-0 text-caramel transition-transform group-hover:-translate-y-0.5" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Location
            </p>
            <p className="mt-1 text-sm font-semibold text-coffee group-hover:text-caramel">
              Near Boral High School
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              C/9 Rajnarayan Park, Boral Main Rd
            </p>
          </div>
        </a>

        {/* Call & WhatsApp */}
        <div className="flex items-start gap-4 px-6 py-6 transition-colors hover:bg-cream-2/30">
          <Phone className="mt-1 size-5 shrink-0 text-caramel" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contact Us
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {cafe.phone.display}
            </p>
            <div className="mt-1.5 flex items-center gap-3 text-xs">
              <a
                href={cafe.phone.href}
                className="inline-flex min-h-[36px] items-center font-medium text-coffee hover:text-caramel hover:underline"
              >
                Call
              </a>
              <span className="text-muted-foreground">·</span>
              <a
                href={cafe.whatsapp.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[36px] items-center gap-1 font-semibold text-wa hover:underline"
              >
                <MessageCircle className="size-3 text-wa" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Online Ordering */}
        <a
          href={cafe.orderOnline.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-4 px-6 py-6 transition-colors hover:bg-cream-2/40"
        >
          <ShoppingBag className="mt-1 size-5 shrink-0 text-accent transition-transform group-hover:-translate-y-0.5" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Order Pickup / Delivery
            </p>
            <p className="mt-1 text-sm font-semibold text-accent group-hover:text-accent/80">
              Order Online Now
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              via digital ordering platform
            </p>
          </div>
        </a>
      </div>
    </section>
  );
}
