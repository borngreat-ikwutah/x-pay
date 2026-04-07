import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useWalletStore } from "~/stores/use-wallet";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/(public)/_public/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { status, address, disconnect } = useWalletStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "idle" || !address) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [status, address, navigate]);

  if (status === "idle" || !address) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col p-6 items-center justify-center space-y-6">
      <header className="flex flex-col items-center gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
        <div className="bg-card/40 backdrop-blur-xl border border-white/5 dark:border-white/10 p-4 rounded-xl">
          <p className="text-sm text-muted-foreground font-mono truncate max-w-[250px] sm:max-w-md">
            {address}
          </p>
        </div>
      </header>

      <Button
        variant="destructive"
        onClick={async () => {
          await disconnect();
          navigate({ to: "/onboarding" });
        }}
      >
        Disconnect Wallet
      </Button>
    </div>
  );
}
