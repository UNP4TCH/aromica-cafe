import { useEffect, useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { cafe } from "@/data/cafe";

const navLinks = [
  { href: "#menu", label: "Menu" },
  { href: "#atmosphere", label: "Atmosphere" },
  { href: "#gallery", label: "Gallery" },
  { href: "#visit", label: "Visit Us" },
  { href: cafe.instagram.href, label: "Instagram", external: true },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      setMobileMenuOpen(false);
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-primary/15 bg-background/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
        {/* Brand / Logo */}
        <a
          href="#top"
          onClick={(e) => handleScrollTo(e, "#top")}
          className="group flex items-baseline gap-2.5 transition-opacity hover:opacity-90"
          aria-label="Aromica Café — Return to top"
        >
          <span className="font-display text-2xl tracking-tight text-primary sm:text-2xl">
            Aromica <span className="font-normal italic text-caramel">Café</span>
          </span>
          <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-muted sm:inline-block">
            Boral · Kolkata
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => !link.external && handleScrollTo(e, link.href)}
              {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="link-editorial text-sm font-medium text-foreground/80 transition-colors hover:text-coffee"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA Button */}
        <div className="hidden items-center gap-4 md:flex">
          <a
            href={cafe.orderOnline.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex min-h-[40px] items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-semibold tracking-wide uppercase text-paper shadow-sm transition-all duration-200 hover:bg-accent/90 hover:-translate-y-0.5 hover:shadow-paper active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            <ShoppingBag className="size-4 transition-transform duration-200 group-hover:scale-105" />
            <span>Order Online</span>
          </a>
        </div>

        {/* Mobile menu toggle with >= 44px touch target */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="inline-flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-coffee/20 text-coffee transition-all duration-150 active:scale-95 hover:bg-cream-2/60 md:hidden"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="animate-menu-slide-down border-t border-coffee/15 bg-background px-5 py-5 shadow-lg md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-base font-medium text-foreground transition-all duration-150 active:scale-[0.99] hover:bg-cream-2/70 hover:text-coffee"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4 border-t border-coffee/15 pt-4">
              <a
                href={cafe.orderOnline.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold tracking-wide text-paper transition-all duration-150 active:scale-[0.98] hover:bg-accent/90"
              >
                <ShoppingBag className="size-4" />
                <span>Order Online</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
