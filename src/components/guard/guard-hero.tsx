import { ShieldCheck, ShieldSlash } from "@phosphor-icons/react";
import { Switch } from "~/components/ui/switch";

interface GuardHeroProps {
  isActive: boolean;
  onToggle: () => void;
}

export function GuardHero({ isActive, onToggle }: GuardHeroProps) {
  return (
    <div
      className={`relative rounded-[1.5rem] p-6 overflow-hidden transition-all duration-500 ${
        isActive
          ? "bg-linear-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/30"
          : "bg-linear-to-br from-destructive/15 via-destructive/5 to-transparent border border-destructive/20"
      }`}
    >
      {isActive && (
        <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none" />
      )}

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-2xl transition-all duration-300 ${
              isActive
                ? "bg-emerald-500/20 text-emerald-500 shadow-lg shadow-emerald-500/20"
                : "bg-destructive/15 text-destructive"
            }`}
          >
            {isActive ? (
              <ShieldCheck weight="fill" className="w-8 h-8" />
            ) : (
              <ShieldSlash weight="fill" className="w-8 h-8" />
            )}
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight">
              Guard is {isActive ? "Active" : "Paused"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isActive
                ? "Smart contract enforcing limits"
                : "All agents are blocked"}
            </p>
          </div>
        </div>
        <Switch checked={isActive} onCheckedChange={onToggle} />
      </div>
    </div>
  );
}
