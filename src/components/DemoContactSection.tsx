import { Mail, MessageCircle, Phone, Sparkles } from "lucide-react";
import { demoConfig } from "@/data/demoConfig";
import { useScrollReveal } from "@/lib/useScrollReveal";

export function DemoContactSection() {
  const { ref, isRevealed } = useScrollReveal();

  if (!demoConfig.enabled) return null;

  return (
    <section
      id="demo-contact"
      aria-labelledby="sales-cta-title"
      className="scroll-mt-18 border-t border-coffee/20 bg-espresso text-paper py-16 sm:py-20 lg:py-24"
    >
      <div
        ref={ref}
        className={`reveal-fade-up mx-auto max-w-7xl px-5 lg:px-8 ${
          isRevealed ? "is-revealed" : ""
        }`}
      >
        <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-coffee/40 p-6 sm:p-10 lg:p-12 shadow-2xl backdrop-blur-md">
          {/* Subtle warm glow background */}
          <div
            className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-caramel/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            {/* Left: Core Sales Pitch, CTAs & Capabilities */}
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold">
                  <Sparkles className="size-3 text-gold" />
                  <span>{demoConfig.salesCta.badge}</span>
                </span>
                <span className="text-xs text-paper/60 uppercase tracking-wider">
                  {demoConfig.attribution.label}
                </span>
              </div>

              <h2
                id="sales-cta-title"
                className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl text-paper leading-[1.12]"
              >
                {demoConfig.salesCta.headline}
              </h2>

              <p className="mt-3 text-base sm:text-lg font-medium text-gold-soft">
                {demoConfig.salesCta.supportingCopy}
              </p>

              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-paper/80 max-w-xl">
                This project demonstrates a tailored, mobile-first web system created by{" "}
                <strong className="font-semibold text-paper">{demoConfig.owner.name}</strong> for neighborhood cafés and dining spaces. Built as a flexible foundation customized around your business.
              </p>

              {/* Primary & Secondary Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={demoConfig.owner.phoneHref}
                  className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-caramel px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-paper shadow-sm transition-all duration-150 hover:bg-caramel/90 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-gold"
                >
                  <Phone className="size-3.5 transition-transform group-hover:scale-110" />
                  <span>Talk to Susmit</span>
                </a>

                <a
                  href={demoConfig.owner.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-wa px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-all duration-150 hover:opacity-95 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-white"
                >
                  <MessageCircle className="size-3.5 transition-transform group-hover:scale-110" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={demoConfig.owner.emailHref}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-paper/20 bg-paper/5 px-5 py-2.5 text-xs font-medium text-paper transition-all duration-150 hover:bg-paper/10 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-gold"
                >
                  <Mail className="size-3.5 text-gold" />
                  <span>Email</span>
                </a>
              </div>

              {/* Compact Capability Section: Built around your business (Editorial definition list) */}
              <div className="mt-10 border-t border-paper/15 pt-6">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gold">
                  {demoConfig.salesCta.capabilitiesTitle}
                </p>
                <dl className="mt-4 grid gap-x-6 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {demoConfig.salesCta.capabilities.map((item) => (
                    <div key={item.title} className="border-l border-gold/35 pl-3">
                      <dt className="text-xs font-semibold text-paper">{item.title}</dt>
                      <dd className="mt-0.5 text-[11px] leading-snug text-paper/70">
                        {item.desc}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Right: Contact & Conversation Starter Cards */}
            <div className="flex flex-col gap-4 lg:col-span-5">
              <div className="mb-1">
                <h3 className="font-display text-2xl text-paper">
                  Let&apos;s build yours.
                </h3>
                <p className="mt-1 text-xs text-paper/70">
                  Have a business that could use something like this? Get in touch directly.
                </p>
              </div>

              {/* Primary Contact: Susmit Dey */}
              <div className="rounded-2xl border border-gold/40 bg-espresso/95 p-5 sm:p-6 shadow-paper">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-caramel/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
                    Demo Owner
                  </span>
                  <span className="text-xs text-paper/50">{demoConfig.owner.role}</span>
                </div>

                <h4 className="mt-3 font-display text-2xl text-paper">
                  {demoConfig.owner.name}
                </h4>

                <div className="mt-4 flex flex-col gap-2 text-xs">
                  <a
                    href={demoConfig.owner.phoneHref}
                    className="inline-flex items-center gap-2 font-medium text-paper/90 transition-colors hover:text-gold hover:underline"
                  >
                    <Phone className="size-3.5 text-caramel" />
                    <span>{demoConfig.owner.phone}</span>
                  </a>

                  <a
                    href={demoConfig.owner.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-semibold text-wa hover:underline"
                  >
                    <MessageCircle className="size-3.5 text-wa" />
                    <span>WhatsApp Chat</span>
                  </a>

                  <a
                    href={demoConfig.owner.emailHref}
                    className="inline-flex items-center gap-2 text-paper/80 transition-colors hover:text-gold hover:underline"
                  >
                    <Mail className="size-3.5 text-gold" />
                    <span className="truncate">{demoConfig.owner.email}</span>
                  </a>
                </div>
              </div>

              {/* Secondary Contact: Tuhimrahamain */}
              <div className="rounded-2xl border border-paper/15 bg-espresso/80 p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-paper/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-paper/70">
                    Secondary Contact
                  </span>
                  <span className="text-[11px] text-paper/50">{demoConfig.secondaryContact.role}</span>
                </div>

                <h4 className="mt-2 font-display text-lg text-paper">
                  {demoConfig.secondaryContact.name}
                </h4>

                <div className="mt-3 flex flex-col gap-2 text-xs">
                  <a
                    href={demoConfig.secondaryContact.phoneHref}
                    className="inline-flex items-center gap-2 font-medium text-paper/90 transition-colors hover:text-gold hover:underline"
                  >
                    <Phone className="size-3.5 text-caramel" />
                    <span>{demoConfig.secondaryContact.phone}</span>
                  </a>

                  <a
                    href={demoConfig.secondaryContact.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-semibold text-wa hover:underline"
                  >
                    <MessageCircle className="size-3.5 text-wa" />
                    <span>WhatsApp Chat</span>
                  </a>

                  <a
                    href={demoConfig.secondaryContact.emailHref}
                    className="inline-flex items-center gap-2 text-paper/80 transition-colors hover:text-gold hover:underline truncate"
                  >
                    <Mail className="size-3.5 text-caramel" />
                    <span className="truncate">{demoConfig.secondaryContact.email}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
