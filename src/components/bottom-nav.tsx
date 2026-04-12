import { Link, useRouterState } from "@tanstack/react-router";
import {
  House,
  ShieldCheck,
  ClockCounterClockwise,
  User,
  Compass,
} from "@phosphor-icons/react";

const NAV_ITEMS = [
  { to: "/", label: "Home", Icon: House },
  { to: "/discover", label: "Discover", Icon: Compass },
  { to: "/guard", label: "Guard", Icon: ShieldCheck },
  { to: "/history", label: "Activity", Icon: ClockCounterClockwise },
  { to: "/profile", label: "Settings", Icon: User },
] as const;

export function BottomNav() {
  const { location } = useRouterState();
  const pathname = location.pathname;

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50
        bg-card/80 backdrop-blur-2xl border-t border-border/40
        flex items-center justify-around
        pb-[env(safe-area-inset-bottom)]"
      style={{ height: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      {NAV_ITEMS.map(({ to, label, Icon }) => {
        const isActive =
          to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            // @ts-ignore
            to={to}
            className={`relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200
              ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Icon
              weight={isActive ? "fill" : "regular"}
              className={`w-6 h-6 transition-transform duration-200 ${isActive ? "scale-110" : ""}`}
            />
            <span
              className={`text-[10px] font-semibold tracking-wide ${isActive ? "opacity-100" : "opacity-60"}`}
            >
              {label}
            </span>
            {/* Active dot indicator */}
            {isActive && (
              <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary animate-in fade-in zoom-in duration-200" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
