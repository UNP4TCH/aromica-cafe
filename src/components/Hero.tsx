import { ArrowRight, Compass, ShoppingBag } from "lucide-react";
import { cafe } from "@/data/cafe";

export function Hero() {
  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="top" className="relative overflow-hidden px-5 py-12 sm:py-16 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Left Column: Typography & CTAs */}
        <div className="lg:col-span-6">
          <div className="animate-hero-eyebrow flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-coffee/80">
            <span className="h-px w-8 bg-caramel" aria-hidden="true" />
            <span>Near Boral High School · Kolkata</span>
          </div>

          <h1 className="mt-6 font-signature text-[2.85rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] font-normal leading-[0.98] tracking-[-0.015em] text-coffee">
            <span className="block overflow-hidden pb-1 -mb-1">
              <span className="block animate-hero-brand-line1 will-change-transform">
                Aromica
              </span>
            </span>
            <span className="block overflow-hidden pt-1 pb-1 -mb-1">
              <span className="block animate-hero-brand-line2 italic font-normal text-caramel will-change-transform">
                Café
              </span>
            </span>
          </h1>

          <p className="animate-hero-copy mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-caramel">
            {cafe.tagline}
          </p>

          <p className="animate-hero-copy mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-muted-foreground">
            A warm neighborhood café for unhurried cups of coffee, steaming kullad chai, and freshly prepared comfort food near Boral High School.
          </p>

          <div className="animate-hero-actions mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
            <a
              href="#menu"
              onClick={(e) => handleScrollTo(e, "#menu")}
              className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-coffee px-7 py-3 text-sm font-semibold text-paper shadow-sm transition-all duration-200 hover:bg-espresso hover:-translate-y-0.5 hover:shadow-paper active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-coffee focus-visible:outline-offset-2"
            >
              <span>Explore Menu</span>
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>

            <a
              href={cafe.orderOnline.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-paper shadow-sm transition-all duration-200 hover:bg-accent/90 hover:-translate-y-0.5 hover:shadow-paper active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent"
            >
              <ShoppingBag className="size-4 text-paper transition-transform duration-200 group-hover:scale-105" />
              <span>Order Online</span>
            </a>

            <a
              href="#visit"
              onClick={(e) => handleScrollTo(e, "#visit")}
              className="group inline-flex min-h-[44px] items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-coffee hover:-translate-y-0.5 active:translate-y-0"
            >
              <Compass className="size-4 text-caramel transition-transform duration-300 group-hover:rotate-12" />
              <span>Find Us</span>
            </a>
          </div>
        </div>

        {/* Right Column: Editorial Visual Frame */}
        <div className="animate-hero-image relative pb-6 sm:pb-0 lg:col-span-6 lg:pl-6">
          {/* Subtle architectural backdrop circle */}
          <div
            className="absolute -right-4 -top-4 hidden size-36 rounded-full border border-gold/40 pointer-events-none lg:block"
            aria-hidden="true"
          />

          {/* Arched editorial frame */}
          <div className="relative mx-auto aspect-[4/5] max-h-[620px] w-full max-w-[480px] overflow-hidden rounded-[42%_42%_2.5rem_2.5rem] border border-coffee/15 bg-card shadow-paper lg:max-w-none">
            <img
              src="/images/aromica-exterior-drinks-01.webp"
              alt="AROMICA Café storefront at night with illuminated signage and two chilled drinks held in a toast"
              className="h-full w-full object-cover object-[24%_center] transition-transform duration-700 ease-out hover:scale-[1.025]"
              loading="eager"
              fetchPriority="high"
            />
          </div>

          {/* Floating brand slogan badge with mobile safety margin */}
          <div className="absolute -bottom-4 left-2 sm:left-6 max-w-[calc(100%-1rem)] sm:max-w-none border border-coffee/20 bg-card px-5 py-3.5 sm:px-6 sm:py-4 shadow-paper transition-transform duration-300 hover:-translate-y-0.5">
            <p className="font-display text-sm sm:text-base md:text-lg italic text-coffee">
              {cafe.slogan}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
