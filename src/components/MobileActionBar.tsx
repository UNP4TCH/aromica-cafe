import { MapPin, MessageCircle, Phone, ShoppingBag } from "lucide-react";
import { cafe } from "@/data/cafe";

export function MobileActionBar() {
  return (
    <aside
      aria-label="Mobile quick actions"
      className="animate-action-bar-in fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 items-center border-t border-mocha/40 bg-espresso/95 pb-[env(safe-area-inset-bottom,0px)] text-paper shadow-2xl backdrop-blur-lg md:hidden"
    >
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
    </aside>
  );
}
