import { useState } from "react";
import { AlertCircle, Lock, Play, X, ShieldAlert } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@core/lib/supabase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessfulLogin: (email: string, userId: string) => void;
  onEnterSimulation: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccessfulLogin,
  onEnterSimulation,
}: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLiveLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isSupabaseConfigured) {
      setErrorMessage(
        "Supabase credentials are not yet configured in .env. Live authentication requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
      return;
    }

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else if (data.user) {
        onSuccessfulLogin(data.user.email || email, data.user.id);
        onClose();
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to sign in to Supabase");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedAccess = () => {
    onEnterSimulation();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-[#D9A45B]/30 bg-[#241611] p-5 sm:p-6 shadow-2xl text-[#FBF4E8]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-[#8D755F] hover:bg-[#170D08] hover:text-[#FBF4E8] transition-colors"
          aria-label="Close authentication modal"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#D9A45B]/20 text-[#D9A45B]">
            <Lock className="size-4" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-semibold text-[#F6EAD9]">
              Owner Portal Sign In
            </h2>
            <p className="text-xs text-[#8D755F]">
              Business Management System — Concept Demo
            </p>
          </div>
        </div>

        {/* Option A: One-Click Demo Access */}
        <div className="mt-5 rounded-xl border border-[#D9A45B]/20 bg-[#170D08]/60 p-4">
          <div className="flex items-start gap-2.5">
            <Play className="size-4 text-[#D9A45B] mt-0.5 shrink-0" />
            <div>
              <h3 className="text-xs font-semibold text-[#F6EAD9]">
                Prospective Client / Portfolio Visitor?
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-[#8D755F]">
                Experience the owner dashboard without credentials. Operates in a safe, in-memory simulation mode.
              </p>
              <button
                type="button"
                onClick={handleSimulatedAccess}
                className="mt-3 w-full rounded-lg bg-[#D9A45B]/15 border border-[#D9A45B]/40 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#D9A45B] transition-colors hover:bg-[#D9A45B]/25"
              >
                Enter Portfolio Simulation Demo
              </button>
            </div>
          </div>
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#3B2417]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8D755F]">
            or sign in to live tenant
          </span>
          <div className="h-px flex-1 bg-[#3B2417]" />
        </div>

        {/* Option B: Live Supabase Sign In */}
        <form onSubmit={handleLiveLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
              Owner Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@aromica.demo"
              className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#FBF4E8] placeholder:text-[#8D755F] focus:border-[#D9A45B] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#FBF4E8] placeholder:text-[#8D755F] focus:border-[#D9A45B] focus:outline-none"
            />
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isSupabaseConfigured && (
            <p className="text-[11px] text-[#8D755F] flex items-center gap-1.5">
              <ShieldAlert className="size-3.5 text-[#D9A45B]" />
              <span>Supabase .env currently unconfigured. Use Simulation Demo above.</span>
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#B0793F] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#FBF4E8] transition-colors hover:bg-[#B0793F]/90 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In to Live Database"}
          </button>
        </form>
      </div>
    </div>
  );
}
