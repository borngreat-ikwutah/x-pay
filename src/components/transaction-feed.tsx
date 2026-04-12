import { ArrowUp, ArrowDown } from "@phosphor-icons/react";

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

interface TransactionFeedProps {
  operations: Operation[];
  address: string;
  isLoading?: boolean;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-muted rounded w-1/3" />
        <div className="h-2.5 bg-muted rounded w-1/2" />
      </div>
      <div className="h-3 bg-muted rounded w-16" />
    </div>
  );
}

function TxRow({ op, address }: { op: Operation; address: string }) {
  const isIncoming = op.to?.toLowerCase() === address?.toLowerCase();
  const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${op.hash}`;

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 active:bg-muted/50 transition-colors"
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
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

      <div className="text-right flex-shrink-0">
        <p
          className={`text-sm font-bold ${isIncoming ? "text-emerald-500" : "text-foreground"}`}
        >
          {isIncoming ? "+" : "-"}
          {parseFloat(op.amount).toFixed(2)} {op.asset}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {new Date(op.timestamp).toLocaleDateString("en-NG", {
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
    </a>
  );
}

export function TransactionFeed({
  operations,
  address,
  isLoading,
}: TransactionFeedProps) {
  return (
    <div className="mx-4 mt-6 rounded-2xl bg-card/60 border border-border/50 overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">Recent Activity</h2>
        <span className="text-xs text-muted-foreground">
          {operations.length} txns
        </span>
      </div>

      <div className="divide-y divide-border/30">
        {isLoading ? (
          <>
            {[0, 1, 2].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </>
        ) : operations.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No transactions yet
          </div>
        ) : (
          operations.map((op) => (
            <TxRow key={op.id} op={op} address={address} />
          ))
        )}
      </div>
    </div>
  );
}
