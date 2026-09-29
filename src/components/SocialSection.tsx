import { ExternalLink, MessageSquareHeart } from "lucide-react";
import { cafe } from "@/data/cafe";
import { InstagramIcon } from "@/components/brand-icons";
import { useScrollReveal } from "@/lib/useScrollReveal";

export function SocialSection() {
  const { ref, isRevealed } = useScrollReveal();

  return (
    <section className="border-t border-coffee/15 bg-card/30 px-5 py-16 lg:px-8 lg:py-20">
      <div
        ref={ref}
        className={`reveal-fade-up mx-auto max-w-7xl ${isRevealed ? "is-revealed" : ""}`}
      >
        <div className="grid gap-8 rounded-3xl border border-coffee/20 bg-card p-5 shadow-paper sm:p-8 lg:p-12 lg:grid-cols-12 lg:items-center">
          {/* Left: Instagram CTA */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-caramel">
              <InstagramIcon className="size-4" />
              <span>Connect on Social</span>
            </div>
            <h2 className="mt-3 font-display text-3xl text-coffee sm:text-4xl">
              Follow our evening moments
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Follow <strong className="font-semibold text-coffee">{cafe.instagram.handle}</strong> on Instagram to catch our daily evening menu updates, upcoming coolers, and cozy neighborhood gatherings.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <a
                href={cafe.instagram.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-coffee px-6 py-3 text-xs font-semibold uppercase tracking-wider text-paper shadow-xs transition-all duration-200 hover:bg-espresso hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                <InstagramIcon className="size-4 transition-transform duration-200 group-hover:scale-110" />
                <span>Visit Instagram Profile</span>
                <ExternalLink className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>

          {/* Right: Guest Feedback Card (Reserved Reviews / Community State) */}
          <div className="rounded-2xl border border-coffee/15 bg-background p-5 sm:p-6 lg:col-span-5">
            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-caramel">
              <MessageSquareHeart className="size-4" />
              <span>Guest Impressions</span>
            </div>
            <h3 className="mt-2 font-display text-xl text-coffee">
              Visited us recently?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              We value honest feedback from our neighbors and visitors. Share your thoughts or tag us on your stories when you visit.
            </p>
            <div className="mt-4 border-t border-coffee/10 pt-4">
              <a
                href="https://www.google.com/maps/search/?api=1&query=AROMICA+CAFE+Boral+Main+Road+Kolkata"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 text-xs font-semibold text-coffee transition-colors hover:text-caramel"
              >
                <span className="link-editorial">Find us on Google Reviews</span>
                <ExternalLink className="size-3 transition-transform duration-200 group-hover:scale-110" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
