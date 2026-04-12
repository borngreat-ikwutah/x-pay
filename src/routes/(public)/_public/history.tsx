import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MobileLayout } from "~/components/mobile-layout";
import { useWalletStore } from "~/stores/use-wallet";
import { useTransactionHistory } from "~/hooks/use-transaction-history";
import { ActivityHeader } from "~/components/activity/activity-header";
import { SearchFilterBar } from "~/components/activity/search-filter-bar";
import { TransactionList } from "~/components/activity/transaction-list";
import { TxDetailDrawer } from "~/components/activity/tx-detail-drawer";

export const Route = createFileRoute("/(public)/_public/history")({
  component: ActivityPage,
});

interface Operation {
  id: string;
  type: string;
  amount: string;
  asset: string;
  from: string;
  to: string;
  hash: string;
  timestamp: string;
}

function ActivityPage() {
  const { status, address } = useWalletStore();
  const navigate = useNavigate();

  const { transactions, isLoading, refresh } = useTransactionHistory(address);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "sent" | "received">("all");
  const [selectedTx, setSelectedTx] = useState<Operation | null>(null);

  useEffect(() => {
    if (status === "idle" || !address) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [status, address, navigate]);

  useEffect(() => {
    if (address) void refresh();
  }, [address, refresh]);

  if (status === "idle" || !address) return null;

  const operations: Operation[] = useMemo(
    () =>
      transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        asset: tx.asset ?? "XLM",
        from: tx.from ?? "",
        to: tx.to ?? "",
        hash: tx.hash ?? "",
        timestamp: tx.created_at,
      })),
    [transactions],
  );

  const filtered = operations.filter((op) => {
    const isIncoming = op.to?.toLowerCase() === address.toLowerCase();

    if (filter === "sent" && isIncoming) return false;
    if (filter === "received" && !isIncoming) return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        op.hash.toLowerCase().includes(q) ||
        op.from.toLowerCase().includes(q) ||
        op.to.toLowerCase().includes(q) ||
        op.amount.includes(q)
      );
    }

    return true;
  });

  return (
    <MobileLayout>
      <div className="px-4 pt-12 pb-6 space-y-4">
        <ActivityHeader isLoading={isLoading} onRefresh={refresh} />

        <SearchFilterBar
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
        />

        <TransactionList
          operations={filtered}
          address={address}
          isLoading={isLoading}
          hasSearch={!!search}
          onSelect={setSelectedTx}
        />
      </div>

      <TxDetailDrawer
        tx={selectedTx}
        address={address}
        onClose={() => setSelectedTx(null)}
      />
    </MobileLayout>
  );
}
