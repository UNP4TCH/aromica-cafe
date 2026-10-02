import { Clock, Compass, ExternalLink, Mail, MapPin, MessageCircle, Navigation, Phone, Sparkles } from "lucide-react";
import { cafe, weeklySchedule } from "@/data/cafe";
import { demoConfig } from "@/data/demoConfig";
import { PhotoWatermark } from "@/components/PhotoWatermark";
import { OpenStatusBadge } from "./OpenStatusBadge";
import { useScrollReveal } from "@/lib/useScrollReveal";

export function VisitSection() {
  const { ref: headerRevealRef, isRevealed: isHeaderRevealed } = useScrollReveal();

  return (
    <section id="visit" aria-labelledby="visit-title" className="scroll-mt-18 border-t border-primary/20 bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Header with Scroll Reveal */}
        <div
          ref={headerRevealRef}
          className={`reveal-fade-up max-w-2xl ${isHeaderRevealed ? "is-revealed" : ""}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Plan Your Visit
          </p>
          <h2 id="visit-title" className="mt-3 font-display text-4xl text-primary sm:text-5xl lg:text-6xl">
            Find Your Way to {cafe.name}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {cafe.visitDescription}
          </p>
        </div>

        {/* Main Grid: Map & Business Info */}
        <div className="mt-14 grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* Map Container */}
          <div className="flex flex-col gap-4 lg:col-span-7">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-paper sm:aspect-[16/10] lg:aspect-[16/11]">
              <iframe
                title={`${cafe.name} Location Map`}
                src={cafe.directions.embedSrc}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/15 bg-card/60 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Compass className="size-4 text-accent" />
                <span>GPS: {cafe.coordinates.lat}, {cafe.coordinates.lng}</span>
              </div>
              <a
                href={cafe.directions.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary transition-colors hover:text-accent"
              >
                <span className="link-editorial">Open in Google Maps</span>
                <ExternalLink className="size-3.5 transition-transform duration-200 group-hover:scale-110" />
              </a>
            </div>
          </div>

          {/* Business Details Sidebar */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            {/* Address & Navigation Card */}
            <div className="rounded-2xl border border-primary/15 bg-card p-5 sm:p-6 shadow-paper">
              <div className="flex items-center gap-2.5">
                <MapPin className="size-5 text-accent" />
                <h3 className="font-display text-xl text-primary">Café Address</h3>
              </div>

              <address className="mt-4 not-italic text-sm leading-relaxed text-foreground/90">
                <strong className="block font-semibold text-primary">{cafe.name}</strong>
                {cafe.address.street},<br />
                {cafe.address.locality},<br />
                {cafe.address.cityRegion},<br />
                {cafe.address.statePostal}
              </address>

              <div className="mt-4 flex flex-wrap gap-2">
                {cafe.landmarks.map((landmark) => (
                  <span
                    key={landmark}
                    className="rounded-full border border-coffee/15 bg-cream-2/60 px-3 py-1 text-[11px] font-medium text-coffee"
                  >
                    {landmark}
                  </span>
                ))}
              </div>

              {/* Real storefront photo for landmark recognition */}
              <div className="group relative mt-5 overflow-hidden rounded-xl border border-coffee/15 bg-card shadow-xs">
                <img
                  src="/images/aromica-exterior-night-01.webp"
                  alt="AROMICA Café storefront at night with illuminated signage on Boral Main Road"
                  className="aspect-[16/9] w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                  loading="lazy"
                />
                <PhotoWatermark className="bottom-9 right-2.5" />
                <p className="px-3.5 py-2 text-[11px] text-muted-foreground">
                  Storefront on Boral Main Road at night
                </p>
              </div>

              <a
                href={cafe.directions.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-6 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-paper shadow-sm transition-all duration-200 hover:bg-accent/90 hover:-translate-y-0.5 hover:shadow-paper active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Navigation className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                <span>Get Directions</span>
              </a>

              <div className="mt-5 border-t border-coffee/10 pt-4">
                <p className="text-xs font-semibold text-coffee">Landmark guidance</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {cafe.landmarkGuidance}
                </p>
              </div>
            </div>

            {/* Operating Hours Card */}
            <div className="rounded-2xl border border-coffee/15 bg-card p-5 sm:p-6 shadow-paper">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <Clock className="size-5 text-caramel" />
                  <h3 className="font-display text-xl text-coffee">Opening Hours</h3>
                </div>
                <OpenStatusBadge variant="pill" className="self-start sm:self-auto" />
              </div>

              <dl className="mt-4 divide-y divide-coffee/10 text-xs">
                {weeklySchedule.map((item) => (
                  <div key={item.day} className="flex items-center justify-between py-2.5">
                    <dt className="font-medium text-foreground">{item.day}</dt>
                    <dd
                      className={
                        item.isClosed
                          ? "font-semibold text-accent"
                          : "tabular-nums text-muted-foreground"
                      }
                    >
                      {item.hours}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Direct Contact Links / Demo Contact Card */}
            {demoConfig.enabled ? (
              <div className="rounded-2xl border border-gold/30 bg-card p-5 sm:p-6 shadow-paper">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-caramel" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-caramel">
                    Concept Inquiries
                  </span>
                </div>

                <h3 className="mt-2.5 font-display text-lg text-primary">
                  Have a business that could use something like this?
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Designed and developed by{" "}
                  <strong className="font-semibold text-primary">{demoConfig.owner.name}</strong> as an interactive concept. Contact us to discuss a tailored web presence for your café or local business.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {/* Primary: Susmit Dey */}
                  <div className="rounded-xl border border-coffee/15 bg-cream-2/40 p-3.5">
                    <p className="text-xs font-semibold text-primary">
                      {demoConfig.owner.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {demoConfig.owner.role}
                    </p>
                    <div className="mt-2.5 flex flex-col gap-1.5 text-xs">
                      <a
                        href={demoConfig.owner.phoneHref}
                        className="inline-flex items-center gap-1.5 font-medium text-coffee transition-colors hover:text-caramel hover:underline"
                      >
                        <Phone className="size-3 text-caramel" />
                        <span>{demoConfig.owner.phone}</span>
                      </a>
                      <a
                        href={demoConfig.owner.whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-wa hover:underline"
                      >
                        <MessageCircle className="size-3 text-wa" />
                        <span>WhatsApp Chat</span>
                      </a>
                      <a
                        href={demoConfig.owner.emailHref}
                        className="inline-flex items-center gap-1.5 font-medium text-coffee transition-colors hover:text-caramel hover:underline"
                      >
                        <Mail className="size-3 text-caramel" />
                        <span className="truncate">{demoConfig.owner.email}</span>
                      </a>
                    </div>
                  </div>

                  {/* Secondary: Tuhimrahamain */}
                  <div className="rounded-xl border border-coffee/15 bg-cream-2/40 p-3.5">
                    <p className="text-xs font-semibold text-primary">
                      {demoConfig.secondaryContact.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {demoConfig.secondaryContact.role}
                    </p>
                    <div className="mt-2.5 flex flex-col gap-1.5 text-xs">
                      <a
                        href={demoConfig.secondaryContact.phoneHref}
                        className="inline-flex items-center gap-1.5 font-medium text-coffee transition-colors hover:text-caramel hover:underline"
                      >
                        <Phone className="size-3 text-caramel" />
                        <span>{demoConfig.secondaryContact.phone}</span>
                      </a>
                      <a
                        href={demoConfig.secondaryContact.whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-wa hover:underline"
                      >
                        <MessageCircle className="size-3 text-wa" />
                        <span>WhatsApp Chat</span>
                      </a>
                      <a
                        href={demoConfig.secondaryContact.emailHref}
                        className="inline-flex items-center gap-1.5 font-medium text-coffee transition-colors hover:text-caramel hover:underline"
                      >
                        <Mail className="size-3 text-caramel" />
                        <span className="truncate">{demoConfig.secondaryContact.email}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href={cafe.phone.href}
                  className="flex items-center gap-3 rounded-xl border border-coffee/15 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-coffee/30 hover:bg-cream-2/40 active:translate-y-0 active:scale-[0.98]"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-coffee text-paper">
                    <Phone className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Call Directly
                    </span>
                    <span className="block text-xs font-semibold text-foreground">
                      {cafe.phone.display}
                    </span>
                  </div>
                </a>

                <a
                  href={cafe.whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-coffee/15 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-coffee/30 hover:bg-cream-2/40 active:translate-y-0 active:scale-[0.98]"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-wa text-white">
                    <MessageCircle className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      WhatsApp Chat
                    </span>
                    <span className="block text-xs font-semibold text-foreground">
                      Message Us
                    </span>
                  </div>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
