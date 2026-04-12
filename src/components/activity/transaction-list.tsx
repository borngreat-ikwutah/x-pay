import { ArrowUp, ArrowDown, Funnel } from "@phosphor-icons/react";

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

interface TransactionListProps {
  operations: Operation[];
  address: string;
  isLoading: boolean;
  hasSearch: boolean;
  onSelect: (op: Operation) => void;
}

export function TransactionList({
  operations,
  address,
  isLoading,
  hasSearch,
  onSelect,
}: TransactionListProps) {
  if (isLoading) return <SkeletonList />;
  if (operations.length === 0) return <EmptyState hasSearch={hasSearch} />;

  const grouped = groupByDate(operations);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, ops]) => (
        <div key={date}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
            {date}
          </p>
          <div className="rounded-2xl bg-card/60 border border-border/50 overflow-hidden divide-y divide-border/30">
            {ops.map((op) => (
              <TxRow
                key={op.id}
                op={op}
                address={address}
                onSelect={() => onSelect(op)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TxRow({
  op,
  address,
  onSelect,
}: {
  op: Operation;
  address: string;
  onSelect: () => void;
}) {
  const isIncoming = op.to?.toLowerCase() === address?.toLowerCase();

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-muted/50 transition-colors text-left"
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
          ${
            isIncoming
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-primary/10 text-primary"
          }`}
      >
        {isIncoming ? (
          <ArrowDown weight="bold" className="w-5 h-5" />
        ) : (
          <ArrowUp weight="bold" className="w-5 h-5" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {isIncoming ? "Received" : "Sent"}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {isIncoming
            ? `From ${op.from?.slice(0, 8)}…`
            : `To ${op.to?.slice(0, 8)}…`}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p
          className={`text-sm font-bold ${isIncoming ? "text-emerald-500" : "text-foreground"}`}
        >
          {isIncoming ? "+" : "-"}
          {parseFloat(op.amount).toFixed(4)} {op.asset}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {new Date(op.timestamp).toLocaleTimeString("en-NG", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </button>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 rounded-2xl bg-card/60 border border-border/50 animate-pulse"
        >
          <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-muted rounded w-1/3" />
            <div className="h-2.5 bg-muted rounded w-1/2" />
          </div>
          <div className="h-3 bg-muted rounded w-16" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="py-16 text-center">
      <Funnel
        weight="duotone"
        className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3"
      />
      <p className="text-sm font-semibold text-muted-foreground">
        No transactions found
      </p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        {hasSearch
          ? "Try a different search term"
          : "Your activity will show up here"}
      </p>
    </div>
  );
}

function groupByDate(operations: Operation[]): Record<string, Operation[]> {
  return operations.reduce<Record<string, Operation[]>>((acc, op) => {
    const date = new Date(op.timestamp).toLocaleDateString("en-NG", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(op);
    return acc;
  }, {});
}
