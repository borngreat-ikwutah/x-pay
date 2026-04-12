import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  ArrowRight,
  ShieldCheck,
  Lightning,
  CircleNotch,
  UserCircle,
  Coins,
} from "@phosphor-icons/react";
import { useWalletStore } from "~/stores/use-wallet";
import { useEffect, useState } from "react";
import { ensureWalletProfile } from "~/lib/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding/")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { address, status, connect } = useWalletStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<"connect" | "profile">("connect");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transition to profile setup once wallet connects
  useEffect(() => {
    if (status === "connected" && address && step === "connect") {
      setStep("profile");
    }
  }, [status, address, step]);

  const handleCompleteSetup = async () => {
    if (!address) return;
    setIsSubmitting(true);
    try {
      const res = await ensureWalletProfile({
        userId: address,
        walletAddress: address,
        fullName: displayName.trim() || "xPay User",
      });

      if (!res) {
        throw new Error("Failed to create profile");
      }

      toast.success("Profile setup complete!");
      navigate({ to: "/" });
    } catch (err: any) {
      console.error("Onboarding error:", err);
      toast.error(err.message || "An error occurred during setup");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-between min-h-[100dvh] p-6 overflow-hidden bg-background">
      {/* Ornamental Background Blurs */}
      <div className="absolute top-[10%] -left-[10%] w-72 h-72 bg-primary/20 rounded-full blur-[100px] -z-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-[20%] -right-[10%] w-80 h-80 bg-secondary/15 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Top Header */}
      <header className="w-full flex justify-center pt-8 animate-in fade-in slide-in-from-top-8 duration-1000">
        <div className="flex items-center gap-3">
          <img
            src="/logo.svg"
            alt="Xpay Logo"
            className="w-12 h-12 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          />
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            xPay
          </h1>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto text-center space-y-10 z-10">
        {step === "connect" ? (
          <div className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both w-full space-y-10">
            <div className="space-y-4">
              <h2 className="text-[2.5rem] leading-[1.1] font-black tracking-tight">
                Frictionless <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
                  Micro-Payments
                </span>
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed px-2 font-medium">
                Authorize AI agents to transact on your behalf with strict
                on-chain guardrails.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center gap-4 bg-card/40 backdrop-blur-xl border border-white/5 dark:border-white/10 p-4 rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/5">
                <div className="p-2.5 bg-primary/10 rounded-full text-primary shadow-inner">
                  <ShieldCheck weight="duotone" className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground text-sm tracking-tight">
                    Programmable Guardrails
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Set tight budgets and hard limits
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-card/40 backdrop-blur-xl border border-white/5 dark:border-white/10 p-4 rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/5">
                <div className="p-2.5 bg-secondary/10 rounded-full text-secondary shadow-inner">
                  <Lightning weight="duotone" className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground text-sm tracking-tight">
                    x402 Autonomy
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    AI agents handle payments instantly
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center space-y-6 animate-in slide-in-from-right-8 fade-in duration-500 fill-mode-both">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.18_285)] flex items-center justify-center shadow-lg shadow-primary/30 mb-2">
              <UserCircle
                weight="fill"
                className="w-10 h-10 text-primary-foreground"
              />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">
                Welcome to xPay
              </h2>
              <p className="text-sm text-muted-foreground">
                Let's personalize your wallet experience.
              </p>
            </div>

            <div className="w-full space-y-5 text-left pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                  Display Name
                </label>
                <Input
                  placeholder="e.g. Satoshi Nakamoto"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-12 rounded-xl bg-card/50 backdrop-blur-sm border-white/10 text-base px-4"
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 items-start">
                <Coins
                  weight="duotone"
                  className="w-6 h-6 text-amber-500 shrink-0 mt-0.5"
                />
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-amber-500">
                    Testnet Required
                  </p>
                  <p className="text-xs text-amber-500/90 leading-relaxed font-medium">
                    xPay runs on the Stellar Testnet. You must fund your
                    connected wallet with Testnet XLM to use AI Agents and x402
                    services.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Call to Action */}
      <footer className="w-full max-w-sm pb-8 pt-4 z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
        {step === "connect" ? (
          <Button
            onClick={connect}
            disabled={status === "connecting"}
            className="w-full h-14 text-lg font-bold rounded-2xl shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] dark:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {status === "connecting" ? (
              <>
                <CircleNotch
                  className="w-5 h-5 mr-2 animate-spin"
                  weight="bold"
                />
                Connecting...
              </>
            ) : (
              <>
                Connect Wallet
                <ArrowRight className="w-5 h-5 ml-2" weight="bold" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleCompleteSetup}
            disabled={isSubmitting}
            className="w-full h-14 text-lg font-bold rounded-2xl shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] dark:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <CircleNotch
                  className="w-5 h-5 mr-2 animate-spin"
                  weight="bold"
                />
                Setting up Profile...
              </>
            ) : (
              <>
                Enter xPay
                <ArrowRight className="w-5 h-5 ml-2" weight="bold" />
              </>
            )}
          </Button>
        )}
        <p className="text-center text-xs text-muted-foreground/70 mt-6 font-medium tracking-wide uppercase">
          Built on Stellar Blockchain
        </p>
      </footer>
    </div>
  );
}
