import { Clock3, Mail, MapPin, MessageCircle, Phone, ShoppingBag, Sparkles } from "lucide-react";
import { cafe } from "@/data/cafe";
import { demoConfig } from "@/data/demoConfig";
import { openOrderDemoModal } from "@/lib/demoModal";
import { InstagramIcon } from "@/components/brand-icons";

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  const handleOrderClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (demoConfig.enabled && demoConfig.externalActions.demoMode) {
      e.preventDefault();
      openOrderDemoModal();
    }
  };

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="border-t border-mocha/40 bg-espresso pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] text-paper md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Brand identity */}
        <div className="space-y-4">
          <div>
            <p className="font-display text-3xl italic text-paper">{cafe.name}</p>
            {demoConfig.enabled ? (
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
                  {demoConfig.attribution.label}
                </span>
                <span className="text-xs text-paper/60">by {demoConfig.owner.name}</span>
              </div>
            ) : (
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gold">
                {cafe.tagline}
              </p>
            )}
          </div>
          <p className="text-sm leading-relaxed text-paper/80">
            {cafe.description}
          </p>
          <div className="flex items-center gap-2 pt-2">
            <a
              href={cafe.instagram.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram profile"
              className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-coffee text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-caramel hover:text-paper active:scale-95"
            >
              <InstagramIcon className="size-4" />
            </a>
            {demoConfig.enabled ? (
              <>
                <a
                  href={demoConfig.owner.phoneHref}
                  aria-label={`Call ${demoConfig.owner.name} (Demo Owner)`}
                  className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-coffee text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-caramel hover:text-paper active:scale-95"
                >
                  <Phone className="size-4" />
                </a>
                <a
                  href={demoConfig.owner.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`WhatsApp ${demoConfig.owner.name} (Demo Owner)`}
                  className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-coffee text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-caramel hover:text-paper active:scale-95"
                >
                  <MessageCircle className="size-4 text-wa" />
                </a>
                <a
                  href={demoConfig.owner.emailHref}
                  aria-label={`Email ${demoConfig.owner.name} (Demo Owner)`}
                  className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-coffee text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-caramel hover:text-paper active:scale-95"
                >
                  <Mail className="size-4 text-gold" />
                </a>
              </>
            ) : (
              <>
                <a
                  href={cafe.phone.href}
                  aria-label="Call Aromica Café"
                  className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-coffee text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-caramel hover:text-paper active:scale-95"
                >
                  <Phone className="size-4" />
                </a>
                <a
                  href={cafe.whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp Aromica Café"
                  className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-coffee text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-caramel hover:text-paper active:scale-95"
                >
                  <MessageCircle className="size-4 text-wa" />
                </a>
              </>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">
            Explore
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-paper/80">
            <li>
              <a
                href="#menu"
                onClick={(e) => handleScrollTo(e, "#menu")}
                className="hover:text-gold hover:underline"
              >
                Food &amp; Beverage Menu
              </a>
            </li>
            <li>
              <a
                href="#atmosphere"
                onClick={(e) => handleScrollTo(e, "#atmosphere")}
                className="hover:text-gold hover:underline"
              >
                Atmosphere &amp; Comfort
              </a>
            </li>
            <li>
              <a
                href="#gallery"
                onClick={(e) => handleScrollTo(e, "#gallery")}
                className="hover:text-gold hover:underline"
              >
                Photo Gallery
              </a>
            </li>
            <li>
              <a
                href="#visit"
                onClick={(e) => handleScrollTo(e, "#visit")}
                className="hover:text-gold hover:underline"
              >
                Directions &amp; Map
              </a>
            </li>
            <li>
              <a
                href={cafe.orderOnline.href}
                onClick={handleOrderClick}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-gold hover:underline"
              >
                <ShoppingBag className="size-3.5" />
                <span>{demoConfig.enabled ? "Order Online Demo" : "Order Online"}</span>
              </a>
            </li>
            {demoConfig.enabled && (
              <li>
                <a
                  href="#demo-contact"
                  onClick={(e) => handleScrollTo(e, "#demo-contact")}
                  className="inline-flex items-center gap-1.5 font-semibold text-gold hover:underline"
                >
                  <Sparkles className="size-3.5 text-gold" />
                  <span>Sales Demo Inquiries</span>
                </a>
              </li>
            )}
          </ul>
        </div>

        {/* Location & Address */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">
            Address
          </p>
          <div className="mt-4 flex gap-3 text-sm leading-relaxed text-paper/80">
            <MapPin className="mt-1 size-4 shrink-0 text-caramel" />
            <div>
              <p className="font-semibold text-paper">{cafe.neighborhood}</p>
              <p className="mt-1 break-words [overflow-wrap:anywhere]">
                {cafe.address.full}
              </p>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">
            Opening Hours
          </p>
          <div className="mt-4 flex gap-3 text-sm text-paper/80">
            <Clock3 className="mt-1 size-4 shrink-0 text-caramel" />
            <div>
              <p className="font-semibold text-paper">{cafe.hours.daysOpenSummary}</p>
              <p className="mt-0.5">{cafe.hours.timeOpenSummary}</p>
              <p className="mt-2 text-xs text-paper/60">{cafe.hours.closedDaySummary}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-foreground/15 px-5 py-6 text-center text-xs text-primary-foreground/60">
        {demoConfig.enabled ? (
          <div className="mx-auto max-w-2xl space-y-1.5">
            <p className="font-semibold text-paper/90">
              Aromica Café — {demoConfig.attribution.label}
            </p>
            <p className="text-paper/70">
              {demoConfig.attribution.subline}
            </p>
            <p className="text-[11px] text-paper/45">
              {demoConfig.attribution.footerDisclaimer}
            </p>
          </div>
        ) : (
          <p>© {CURRENT_YEAR} Aromica Café · Kolkata. All rights reserved.</p>
        )}
      </div>
    </footer>
  );
}
