import { Link } from "@tanstack/react-router";
import { ShieldCheck, ShieldSlash, CaretRight } from "@phosphor-icons/react";

interface GuardStatusWidgetProps {
  isActive?: boolean;
}

export function GuardStatusWidget({
  isActive = false,
}: GuardStatusWidgetProps) {
  return (
    <Link
      to="/guard"
      className="mx-4 mt-4 flex items-center gap-3 p-4 rounded-2xl
        bg-card/60 border border-border/50 backdrop-blur-sm
        active:scale-[0.98] transition-all duration-150"
    >
      <div
        className={`p-2.5 rounded-xl ${
          isActive
            ? "bg-emerald-500/10 text-emerald-500"
            : "bg-destructive/10 text-destructive"
        }`}
      >
        {isActive ? (
          <ShieldCheck weight="duotone" className="w-6 h-6" />
        ) : (
          <ShieldSlash weight="duotone" className="w-6 h-6" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">
          AI Guard {isActive ? "Active" : "Inactive"}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {isActive
            ? "Spending limits enforced by smart contract"
            : "Tap to configure agent spending limits"}
        </p>
      </div>

      <div
        className={`w-2 h-2 rounded-full shrink-0 ${
          isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"
        }`}
      />
      <CaretRight
        weight="bold"
        className="w-4 h-4 text-muted-foreground shrink-0"
      />
    </Link>
  );
}
