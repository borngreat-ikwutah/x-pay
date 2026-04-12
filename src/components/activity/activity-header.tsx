import { ArrowsClockwise } from "@phosphor-icons/react";

interface ActivityHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export function ActivityHeader({ isLoading, onRefresh }: ActivityHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
          Nano-payments
        </p>
        <h1 className="text-xl font-extrabold tracking-tight">Activity</h1>
      </div>
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="p-2.5 rounded-xl bg-card/60 border border-border/50 text-muted-foreground
          active:bg-card transition-colors disabled:opacity-50"
      >
        <ArrowsClockwise
          weight="bold"
          className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
        />
      </button>
    </div>
  );
}
