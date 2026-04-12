import { useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowSquareOut,
  Copy,
  CheckCircle,
} from "@phosphor-icons/react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "~/components/ui/drawer";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";

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

interface TxDetailDrawerProps {
  tx: Operation | null;
  address: string;
  onClose: () => void;
}

export function TxDetailDrawer({ tx, address, onClose }: TxDetailDrawerProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!tx) return null;

  const isIncoming = tx.to?.toLowerCase() === address?.toLowerCase();
  const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${tx.hash}`;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Drawer open={!!tx} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader className="items-center gap-2 pt-2">
          <div
            className={`p-2.5 rounded-xl ${
              isIncoming
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-primary/10 text-primary"
            }`}
          >
            {isIncoming ? (
              <ArrowDown weight="fill" className="w-6 h-6" />
            ) : (
              <ArrowUp weight="fill" className="w-6 h-6" />
            )}
          </div>
          <DrawerTitle className="text-base font-bold">
            {isIncoming ? "Received" : "Sent"}
          </DrawerTitle>
          <DrawerDescription>
            {new Date(tx.timestamp).toLocaleString("en-NG", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 space-y-4">
          {/* Amount */}
          <div className="text-center py-2">
            <p
              className={`text-3xl font-black tracking-tight ${
                isIncoming ? "text-emerald-500" : "text-foreground"
              }`}
            >
              {isIncoming ? "+" : "-"}
              {parseFloat(tx.amount).toFixed(4)}
            </p>
            <p className="text-sm font-bold text-muted-foreground mt-1">
              {tx.asset}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <DetailRow
              label="From"
              value={tx.from}
              onCopy={() => copyToClipboard(tx.from, "from")}
              isCopied={copiedField === "from"}
            />
            <DetailRow
              label="To"
              value={tx.to}
              onCopy={() => copyToClipboard(tx.to, "to")}
              isCopied={copiedField === "to"}
            />
            <DetailRow
              label="Tx Hash"
              value={tx.hash}
              onCopy={() => copyToClipboard(tx.hash, "hash")}
              isCopied={copiedField === "hash"}
            />
          </div>
        </div>

        <DrawerFooter>
          <Button asChild className="w-full rounded-xl font-bold">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              <ArrowSquareOut weight="bold" className="w-4 h-4" />
              View on Stellar Expert
            </a>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function DetailRow({
  label,
  value,
  onCopy,
  isCopied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  isCopied: boolean;
}) {
  return (
    <div className="rounded-xl bg-muted/30 border border-border/30 p-3">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <p className="text-xs font-mono text-foreground break-all flex-1 leading-relaxed">
          {value}
        </p>
        <button
          onClick={onCopy}
          className="shrink-0 p-1.5 rounded-lg active:bg-muted transition-colors"
        >
          {isCopied ? (
            <CheckCircle
              weight="fill"
              className="w-3.5 h-3.5 text-emerald-500"
            />
          ) : (
            <Copy weight="bold" className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}
