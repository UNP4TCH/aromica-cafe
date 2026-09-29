import { cafe } from "@/data/cafe";
import { useScrollReveal } from "@/lib/useScrollReveal";

export function AtmosphereHook() {
  const { ref, isRevealed } = useScrollReveal();

  return (
    <section
      id="atmosphere"
      ref={ref}
      aria-label="Atmosphere and comfort pause"
      className="relative scroll-mt-18 border-t border-coffee/15 bg-background py-14 sm:py-16 lg:py-20"
    >
      {/* Anchor alias for existing #showcase links */}
      <span id="showcase" className="absolute -top-18" aria-hidden="true" />

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-coffee/15 bg-card/60 p-5 shadow-paper sm:rounded-3xl sm:p-8 lg:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Left: Editorial Typographic Pause */}
            <div
              className={`reveal-fade-up flex flex-col justify-center lg:col-span-5 ${
                isRevealed ? "is-revealed" : ""
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-caramel">
                Coffee · Chai · Comfort
              </p>
              <h2 className="mt-3 font-display text-2xl italic text-coffee sm:text-3xl lg:text-4xl">
                {cafe.slogan}
              </h2>
              <div className="mt-4 h-px w-12 bg-caramel/50" aria-hidden="true" />
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                A warm neighborhood corner near Boral High School for unhurried evenings, quiet conversations, and freshly prepared comfort food.
              </p>
            </div>

            {/* Right: Single Atmospheric Visual */}
            <div
              className={`reveal-fade-up reveal-delay-1 lg:col-span-7 ${
                isRevealed ? "is-revealed" : ""
              }`}
            >
              <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-coffee/20 bg-espresso/5 shadow-inner sm:aspect-[16/9]">
                <img
                  src="/images/aromica-interior-01.webp"
                  alt="Interior wall with painted green arches, framed artwork, and woven pendant lamps inside Aromica Café"
                  className="h-full w-full object-cover object-center transition-transform duration-700 md:group-hover:scale-[1.025]"
                  loading="lazy"
                />
                {/* Subtle vignette overlay */}
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-darkest/40 via-transparent to-transparent opacity-50"
                  aria-hidden="true"
                />
                <span className="absolute bottom-3 right-3 rounded-full border border-gold/30 bg-darkest/75 px-3 py-1 text-[11px] font-medium tracking-wide text-cream backdrop-blur-xs transition-transform duration-300 group-hover:-translate-y-0.5">
                  Inside Aromica · Boral
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
