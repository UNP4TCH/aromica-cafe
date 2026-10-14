import { Mail, Phone, Sparkles } from "lucide-react";
import { MANAGEMENT_DEMO_ATTRIBUTION } from "@core/types/business";

export function DemoAttributionBanner() {
  const { creator, sampleLabels } = MANAGEMENT_DEMO_ATTRIBUTION;

  return (
    <div className="border-b border-[#D9A45B]/20 bg-[#241611]/90 px-4 py-2.5 text-xs text-[#FBF4E8] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#D9A45B]/40 bg-[#D9A45B]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#D9A45B]">
            <Sparkles className="size-3" />
            {sampleLabels.badge}
          </span>
          <span className="font-medium text-[#F6EAD9]">
            {sampleLabels.title}
          </span>
          <span className="hidden sm:inline text-[#8D755F]">·</span>
          <span className="hidden sm:inline text-[#8D755F]">
            {sampleLabels.tagline}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="hidden md:inline text-[#F6EAD9]/70">
            {sampleLabels.contactCta}:
          </span>
          <a
            href={creator.phoneHref}
            className="inline-flex items-center gap-1.5 font-medium text-[#D9A45B] transition-colors hover:text-[#E8C58C]"
          >
            <Phone className="size-3" />
            <span>{creator.phone}</span>
          </a>
          <a
            href={creator.emailHref}
            className="inline-flex items-center gap-1.5 font-medium text-[#D9A45B] transition-colors hover:text-[#E8C58C]"
          >
            <Mail className="size-3" />
            <span>{creator.email}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
