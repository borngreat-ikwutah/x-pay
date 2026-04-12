import { useState } from "react";
import {
  ShieldCheck,
  Robot,
  CurrencyDollar,
  Lightning,
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
import { Spinner } from "~/components/ui/spinner";
import { toast } from "sonner";

const CONTRACT_ID = "CD6G6FF2NTMK4XHXPYQNTGR5FRSHPURIPIPOUZDT37OBHLUWPGXFU35W";

interface AllowanceDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AllowanceDrawer({ open, onClose }: AllowanceDrawerProps) {
  const [agentKey, setAgentKey] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [period, setPeriod] = useState("86400");
  const [loading, setLoading] = useState(false);

  const formattedAmount = formatXlmAmount(maxAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentKey || !maxAmount) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 1200));
      toast.success(
        `Allowance set successfully: ${formattedAmount} XLM over ${formatPeriod(
          period,
        )}`,
      );
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <ShieldCheck weight="duotone" className="w-6 h-6" />
            </div>
            <div>
              <DrawerTitle className="text-base font-bold">
                Set Agent Allowance
              </DrawerTitle>
              <DrawerDescription className="font-mono truncate max-w-[200px]">
                {CONTRACT_ID.slice(0, 16)}…
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="px-4 space-y-4">
          <FormField
            icon={<Robot weight="duotone" className="w-3.5 h-3.5" />}
            label="Agent Public Key"
          >
            <input
              type="text"
              value={agentKey}
              onChange={(e) => setAgentKey(e.target.value)}
              placeholder="G..."
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm font-mono
                placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </FormField>

          <FormField
            icon={<CurrencyDollar weight="duotone" className="w-3.5 h-3.5" />}
            label="Max Amount (XLM)"
          >
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="0.0000"
              min="0"
              step="0.0001"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm
                placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {maxAmount
                ? `Formatted: ${formattedAmount} XLM`
                : "Enter an amount to preview formatting"}
            </p>
          </FormField>

          <FormField
            icon={<Lightning weight="duotone" className="w-3.5 h-3.5" />}
            label="Period"
          >
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="3600">1 Hour</option>
              <option value="86400">1 Day</option>
              <option value="604800">1 Week</option>
              <option value="2592000">1 Month</option>
            </select>
          </FormField>
        </form>

        <DrawerFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 rounded-xl text-base font-bold"
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Spinner className="size-4 text-primary-foreground" />
                Setting Allowance…
              </span>
            ) : (
              "Confirm Allowance"
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function FormField({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

function formatXlmAmount(value: string) {
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount)) return "0.0000";
  return amount.toFixed(4);
}

function formatPeriod(value: string) {
  switch (value) {
    case "3600":
      return "1 hour";
    case "86400":
      return "1 day";
    case "604800":
      return "1 week";
    case "2592000":
      return "1 month";
    default:
      return `${value} seconds`;
  }
}
