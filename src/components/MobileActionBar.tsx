import { BookOpen, MapPin, MessageCircle, Phone, ShoppingBag, Sparkles } from "lucide-react";
import { cafe } from "@/data/cafe";
import { demoConfig } from "@/data/demoConfig";
import { openOrderDemoModal } from "@/lib/demoModal";

export function MobileActionBar() {
  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleOrderClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (demoConfig.enabled && demoConfig.externalActions.demoMode) {
      e.preventDefault();
      openOrderDemoModal();
    }
  };

  return (
    <aside
      aria-label="Mobile quick actions"
      className="animate-action-bar-in fixed inset-x-0 bottom-0 z-40 grid grid-flow-col auto-cols-fr items-center border-t border-mocha/40 bg-espresso/95 pb-[env(safe-area-inset-bottom,0px)] text-paper shadow-2xl backdrop-blur-lg md:hidden"
    >
      {demoConfig.enabled ? (
        <>
          <a
            href="#menu"
            onClick={(e) => handleScrollTo(e, "#menu")}
            className="flex min-h-[52px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-paper/90 transition-all duration-150 active:scale-95 hover:text-gold"
            aria-label="View menu"
          >
            <BookOpen className="size-4 text-caramel" />
            <span>Menu</span>
          </a>

          <a
            href={cafe.directions.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[52px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-paper/90 transition-all duration-150 active:scale-95 hover:text-gold"
            aria-label="Get directions to café"
          >
            <MapPin className="size-4 text-caramel" />
            <span>Directions</span>
          </a>

          <a
            href="#demo-contact"
            onClick={(e) => handleScrollTo(e, "#demo-contact")}
            className="flex min-h-[52px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-gold transition-all duration-150 active:scale-95 hover:text-paper"
            aria-label="Website concept inquiries"
          >
            <Sparkles className="size-4 text-gold" />
            <span>Inquire</span>
          </a>

          <a
            href={cafe.orderOnline.href}
            onClick={handleOrderClick}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[52px] flex-col items-center justify-center gap-1 bg-accent py-2 text-[11px] font-semibold text-paper transition-all duration-150 active:scale-95 hover:bg-accent/90"
            aria-label="Order online demo"
          >
            <ShoppingBag className="size-4 text-paper" />
            <span>Order</span>
          </a>
        </>
      ) : (
        <>
          <a
            href={cafe.phone.href}
            className="flex min-h-[52px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-paper/90 transition-all duration-150 active:scale-95 hover:text-gold"
            aria-label="Call café directly"
          >
            <Phone className="size-4 text-caramel" />
            <span>Call</span>
          </a>

          <a
            href={cafe.whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[52px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-paper/90 transition-all duration-150 active:scale-95 hover:text-gold"
            aria-label="Message on WhatsApp"
          >
            <MessageCircle className="size-4 text-wa" />
            <span>WhatsApp</span>
          </a>

          <a
            href={cafe.directions.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[52px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-paper/90 transition-all duration-150 active:scale-95 hover:text-gold"
            aria-label="Get directions to café"
          >
            <MapPin className="size-4 text-caramel" />
            <span>Directions</span>
          </a>

          {cafe.orderOnline.enabled && (
            <a
              href={cafe.orderOnline.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[52px] flex-col items-center justify-center gap-1 bg-accent py-2 text-[11px] font-semibold text-paper transition-all duration-150 active:scale-95 hover:bg-accent/90"
              aria-label="Order online"
            >
              <ShoppingBag className="size-4 text-paper" />
              <span>Order</span>
            </a>
          )}
        </>
      )}
    </aside>
  );
}
