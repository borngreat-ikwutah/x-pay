import { useState, useEffect } from "react";
import { CurrencyDollar, Lightning, FloppyDisk } from "@phosphor-icons/react";
import { Button } from "~/components/ui/button";

interface DailyAllowanceProps {
  dailyLimit: number;
  totalSpent: number;
  onLimitChange: (limit: number) => void;
  isUpdating?: boolean;
}

export function DailyAllowance({
  dailyLimit,
  totalSpent,
  onLimitChange,
  isUpdating = false,
}: DailyAllowanceProps) {
  const [inputValue, setInputValue] = useState(dailyLimit.toString());

  // Sync state if dailyLimit changes externally
  useEffect(() => {
    setInputValue(dailyLimit.toString());
  }, [dailyLimit]);

  const handleSave = () => {
    const val = parseFloat(inputValue);
    if (!isNaN(val) && val >= 0) {
      onLimitChange(val);
    }
  };

  return (
    <div className="rounded-2xl bg-card/60 border border-border/50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <CurrencyDollar weight="duotone" className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold">Daily Allowance</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-3xl font-black tracking-tight">
            {dailyLimit.toFixed(1)}
          </span>
          <span className="text-sm font-bold text-muted-foreground">
            XLM / day
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-base font-bold outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            placeholder="e.g. 5.5"
            step="0.1"
            min="0"
          />
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            className="rounded-xl px-6 py-6"
          >
            {isUpdating ? (
              "Saving..."
            ) : (
              <>
                <FloppyDisk weight="bold" className="w-4 h-4 mr-2" /> Save Limit
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2 pt-4 border-t border-border/30">
          <Lightning
            weight="duotone"
            className="w-3.5 h-3.5 text-amber-500 shrink-0"
          />
          <span className="text-xs text-muted-foreground">
            Spent today:{" "}
            <span className="font-bold text-foreground">
              {totalSpent.toFixed(3)} XLM
            </span>{" "}
            <span className="text-muted-foreground/70">
              of {dailyLimit.toFixed(1)} XLM
            </span>
          </span>
        </div>

        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-primary to-emerald-500 transition-all duration-500"
            style={{
              width: `${dailyLimit > 0 ? Math.min((totalSpent / dailyLimit) * 100, 100) : 0}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
