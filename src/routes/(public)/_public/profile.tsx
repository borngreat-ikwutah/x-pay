import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MobileLayout } from "~/components/mobile-layout";
import { useWalletStore } from "~/stores/use-wallet";
import { Copy, CheckCircle, SignOut, User, Globe } from "@phosphor-icons/react";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { useProfile } from "~/hooks/use-profile";

export const Route = createFileRoute("/(public)/_public/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { address, disconnect } = useWalletStore();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { profile } = useProfile(address);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    disconnect();
    navigate({ to: "/onboarding" });
  };

  return (
    <MobileLayout>
      <div className="px-4 pt-12 pb-6 space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
            Account
          </p>
          <h1 className="text-xl font-extrabold tracking-tight">Profile</h1>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div
            className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.18_285)]
            flex items-center justify-center shadow-lg shadow-primary/30"
          >
            <User weight="fill" className="w-10 h-10 text-primary-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {profile?.full_name || "Stellar Wallet"}
          </p>
          <p className="text-xs text-muted-foreground">Testnet</p>
        </div>

        {/* Address Card */}
        <div className="rounded-2xl bg-card/60 border border-border/50 p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Public Key
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs font-mono text-foreground break-all flex-1 leading-relaxed">
              {address}
            </p>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 p-2 rounded-xl bg-muted/50 active:bg-muted transition-colors"
            >
              {copied ? (
                <CheckCircle
                  weight="fill"
                  className="w-4 h-4 text-emerald-500"
                />
              ) : (
                <Copy weight="bold" className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Links */}
        <div className="rounded-2xl bg-card/60 border border-border/50 overflow-hidden divide-y divide-border/30">
          <a
            href={`https://stellar.expert/explorer/testnet/account/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-4 active:bg-muted/50 transition-colors"
          >
            <Globe
              weight="duotone"
              className="w-5 h-5 text-primary flex-shrink-0"
            />
            <span className="text-sm font-semibold">
              View on Stellar Expert
            </span>
          </a>
        </div>

        {/* Disconnect */}
        <Button
          variant="destructive"
          onClick={handleDisconnect}
          className="w-full py-4 rounded-xl text-base font-bold"
        >
          <SignOut weight="bold" className="w-5 h-5 mr-2" />
          Disconnect Wallet
        </Button>
      </div>
    </MobileLayout>
  );
}
