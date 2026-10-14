import { useState, useEffect } from "react";
import { CheckCircle2, Store, AlertCircle } from "lucide-react";
import type { BusinessProfileContract } from "@core/types/business";
import type { DashboardMode } from "../types";

interface ProfileManagementViewProps {
  mode: DashboardMode;
  profile: BusinessProfileContract;
  onUpdateProfile: (updatedProfile: BusinessProfileContract) => Promise<{ success: boolean; error?: string }>;
}

export function ProfileManagementView({
  mode,
  profile,
  onUpdateProfile,
}: ProfileManagementViewProps) {
  const [tagline, setTagline] = useState(profile.tagline);
  const [slogan, setSlogan] = useState(profile.slogan);
  const [description, setDescription] = useState(profile.description);
  const [phoneDisplay, setPhoneDisplay] = useState(profile.phone.display);
  const [whatsappDisplay, setWhatsappDisplay] = useState(profile.whatsapp.display);
  const [visitDesc, setVisitDesc] = useState(profile.visitDescription);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setTagline(profile.tagline);
    setSlogan(profile.slogan);
    setDescription(profile.description);
    setPhoneDisplay(profile.phone?.display || "");
    setWhatsappDisplay(profile.whatsapp?.display || "");
    setVisitDesc(profile.visitDescription || "");
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setErrorMessage(null);

    const updatedProfile: BusinessProfileContract = {
      ...profile,
      tagline,
      slogan,
      description,
      visitDescription: visitDesc,
      phone: {
        ...profile.phone,
        display: phoneDisplay,
      },
      whatsapp: {
        ...profile.whatsapp,
        display: whatsappDisplay,
      },
    };

    try {
      const result = await onUpdateProfile(updatedProfile);
      if (result.success) {
        setSaveSuccess(
          mode === "live"
            ? "Business profile saved to PostgreSQL database!"
            : "Business profile updated in simulation memory (temporary)."
        );
        setTimeout(() => setSaveSuccess(null), 3000);
      } else {
        setErrorMessage(result.error || "Failed to update business profile.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unexpected save error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-[#F6EAD9]">
          Business Profile & Identity
        </h2>
        <p className="text-xs text-[#8D755F] mt-0.5">
          Update public business identity, contact numbers, and welcoming notes.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-2xl border border-[#3B2417] bg-[#241611]/60 p-6 space-y-4 shadow-lg">
          <div className="flex items-center gap-2 border-b border-[#3B2417] pb-3">
            <Store className="size-4 text-[#D9A45B]" />
            <h3 className="font-serif text-sm font-semibold text-[#F6EAD9]">
              Brand Identity & Storytelling
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
                Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
                Slogan
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
              Short Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
              Visit Section Guidance Note
            </label>
            <textarea
              value={visitDesc}
              onChange={(e) => setVisitDesc(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[#3B2417] bg-[#241611]/60 p-6 space-y-4 shadow-lg">
          <h3 className="font-serif text-sm font-semibold text-[#F6EAD9] border-b border-[#3B2417] pb-3">
            Customer Contact & Actions
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
                Phone Display Number
              </label>
              <input
                type="text"
                value={phoneDisplay}
                onChange={(e) => setPhoneDisplay(e.target.value)}
                placeholder="+91 ••••• •••••"
                className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
                WhatsApp Display Number
              </label>
              <input
                type="text"
                value={whatsappDisplay}
                onChange={(e) => setWhatsappDisplay(e.target.value)}
                placeholder="+91 ••••• •••••"
                className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-[#B0793F] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#FBF4E8] hover:bg-[#B0793F]/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Business Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
