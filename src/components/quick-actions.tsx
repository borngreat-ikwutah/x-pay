import {
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  ArrowsLeftRight,
} from "@phosphor-icons/react";

const actions = [
  { label: "Send", Icon: ArrowUp, color: "text-primary" },
  { label: "Receive", Icon: ArrowDown, color: "text-emerald-500" },
  { label: "Guard", Icon: ShieldCheck, color: "text-violet-500" },
  { label: "Swap", Icon: ArrowsLeftRight, color: "text-amber-500" },
];

interface QuickActionsProps {
  onGuardClick?: () => void;
}

export function QuickActions({ onGuardClick }: QuickActionsProps) {
  return (
    <div className="mx-4 mt-6 grid grid-cols-4 gap-2">
      {actions.map(({ label, Icon, color }) => (
        <button
          key={label}
          onClick={label === "Guard" ? onGuardClick : undefined}
          className="flex flex-col items-center gap-2 py-4 rounded-2xl
            bg-card/60 backdrop-blur-sm border border-border/50
            active:scale-95 transition-all duration-150
            hover:bg-card/80 shadow-sm"
        >
          <div
            className={`p-2.5 rounded-xl bg-card border border-border/30 ${color}`}
          >
            <Icon weight="duotone" className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
