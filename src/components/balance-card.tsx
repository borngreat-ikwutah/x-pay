import { useState } from "react";
import { ArrowClockwise, Eye, EyeSlash } from "@phosphor-icons/react";

const XLM_TO_NGN_RATE = 500; // placeholder rate

interface BalanceCardProps {
  address: string;
  balance: string;
  isLoading: boolean;
  onRefresh: () => void;
}

export function BalanceCard({
  address,
  balance,
  isLoading,
  onRefresh,
}: BalanceCardProps) {
  const [showBalance, setShowBalance] = useState(true);

  const xlmAmount = parseFloat(balance) || 0;
  const ngnAmount = (xlmAmount * XLM_TO_NGN_RATE).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "—";

  return (
    <div
      className="mx-4 mt-6 rounded-[1.5rem] p-6 relative overflow-hidden
        bg-gradient-to-br from-primary via-[oklch(0.55_0.18_285)] to-[oklch(0.35_0.25_290)]
        text-primary-foreground shadow-xl shadow-primary/30"
    >
      {/* Decorative orbs */}
      <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/5 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-medium opacity-70 uppercase tracking-widest">
            Total Balance
          </p>
          <p className="text-[11px] opacity-50 font-mono mt-0.5">
            {shortAddress}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBalance((v) => !v)}
            className="p-2 rounded-full bg-white/10 active:bg-white/20 transition-colors"
          >
            {showBalance ? (
              <EyeSlash weight="fill" className="w-4 h-4" />
            ) : (
              <Eye weight="fill" className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-full bg-white/10 active:bg-white/20 transition-colors disabled:opacity-50"
          >
            <ArrowClockwise
              weight="bold"
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Balance */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black tracking-tight">
            {showBalance ? (isLoading ? "—" : xlmAmount.toFixed(4)) : "••••••"}
          </span>
          <span className="text-lg font-bold opacity-80">XLM</span>
        </div>
      </div>
    </div>
  );
}
