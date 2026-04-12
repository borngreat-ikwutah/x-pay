import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MobileLayout } from "~/components/mobile-layout";
import { BalanceCard } from "~/components/balance-card";
import { QuickActions } from "~/components/quick-actions";
import { GuardStatusWidget } from "~/components/guard-status-widget";
import { TransactionFeed } from "~/components/transaction-feed";
import { AllowanceDrawer } from "~/components/allowance-drawer";
import { useXlmBalance } from "~/hooks/use-xlm-balance";
import { useTransactionHistory } from "~/hooks/use-transaction-history";
import { useGuardStore } from "~/stores/use-guard";
import { useWalletStore } from "~/stores/use-wallet";
import { useProfile } from "~/hooks/use-profile";

export const Route = createFileRoute("/(public)/_public/")({
  component: DashboardPage,
});

type FeedOperation = {
  id: string;
  type: string;
  amount: string;
  asset: string;
  from: string;
  to: string;
  hash: string;
  timestamp: string;
};

function DashboardPage() {
  const { status, address } = useWalletStore();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    balance,
    isLoading: isBalanceLoading,
    refresh: refreshBalance,
  } = useXlmBalance(address);

  const { profile } = useProfile(address);

  const {
    transactions,
    isLoading: isHistoryLoading,
    refresh: refreshHistory,
  } = useTransactionHistory(address);

  const { isActive: guardActive } = useGuardStore();

  const startY = useRef(0);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    if (status === "idle" || !address) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [status, address, navigate]);

  useEffect(() => {
    if (!address) return;
    void refreshBalance();
    void refreshHistory();
  }, [address, refreshBalance, refreshHistory]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - startY.current;
    if (delta > 70 && !(isBalanceLoading || isHistoryLoading)) {
      setIsPulling(true);
      Promise.all([refreshBalance(), refreshHistory()]).finally(() =>
        setIsPulling(false),
      );
    }
  };

  if (status === "idle" || !address) return null;

  const operations: FeedOperation[] = transactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    asset: tx.asset || "XLM",
    from: tx.from,
    to: tx.to,
    hash: tx.hash,
    timestamp: tx.created_at,
  }));

  return (
    <MobileLayout>
      <div
        className="pb-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="px-4 pt-12 pb-2 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
              Good day, {profile?.full_name?.split(" ")[0] || "User"} 👋
            </p>
            <h1 className="text-xl font-extrabold tracking-tight">Dashboard</h1>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">
              {address.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </div>

        {isPulling && (
          <p className="text-center text-xs text-muted-foreground py-1 animate-pulse">
            Refreshing…
          </p>
        )}

        <BalanceCard
          address={address}
          balance={balance}
          isLoading={isBalanceLoading}
          onRefresh={refreshBalance}
        />

        <QuickActions onGuardClick={() => setDrawerOpen(true)} />

        <GuardStatusWidget isActive={guardActive} />

        <TransactionFeed
          operations={operations}
          address={address}
          isLoading={isHistoryLoading}
        />
      </div>

      <AllowanceDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </MobileLayout>
  );
}
