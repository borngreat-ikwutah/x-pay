import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import {
  ArrowRight,
  ShieldCheck,
  Lightning,
  CircleNotch,
} from "@phosphor-icons/react";
import { useWalletStore } from "~/stores/use-wallet";
import { useEffect } from "react";

export const Route = createFileRoute("/onboarding/")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { address, status, connect } = useWalletStore();
  const navigate = useNavigate();

  // If connected, navigate to the dashboard
  useEffect(() => {
    if (status === "connected" && address) {
      navigate({ to: "/" });
    }
  }, [status, address, navigate]);

  return (
    <div className="relative flex flex-col items-center justify-between min-h-[100dvh] p-6 overflow-hidden">
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
            Xpay
          </h1>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto text-center space-y-10 z-10 animate-in fade-in zoom-in-95 duration-1000 delay-200 fill-mode-both">
        <div className="space-y-4">
          <h2 className="text-[2.5rem] leading-[1.1] font-black tracking-tight">
            Frictionless <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
              Micro-Payments
            </span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed px-2 font-medium">
            Authorize AI agents to transact on your behalf with strict on-chain
            guardrails.
          </p>
        </div>

        {/* Feature Cards (Glassmorphism) */}
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center gap-4 bg-card/40 backdrop-blur-xl border border-white/5 dark:border-white/10 p-4 rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/5 transition-transform active:scale-[0.98]">
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

          <div className="flex items-center gap-4 bg-card/40 backdrop-blur-xl border border-white/5 dark:border-white/10 p-4 rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/5 transition-transform active:scale-[0.98]">
            <div className="p-2.5 bg-secondary/10 rounded-full text-secondary shadow-inner">
              <Lightning weight="duotone" className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground text-sm tracking-tight">
                Payment Channels
              </h3>
              <p className="text-xs text-muted-foreground">
                Zero-fee off-chain settlements
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Call to Action */}
      <footer className="w-full max-w-sm pb-8 pt-4 z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both">
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
          ) : status === "connected" ? (
            <>
              Wallet Connected
              <ArrowRight className="w-5 h-5 ml-2" weight="bold" />
            </>
          ) : (
            <>
              Connect Wallet
              <ArrowRight className="w-5 h-5 ml-2" weight="bold" />
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground/70 mt-6 font-medium tracking-wide uppercase">
          Built on Stellar Blockchain
        </p>
      </footer>
    </div>
  );
}
