import type { ReactNode } from "react";
import { BottomNav } from "~/components/bottom-nav";

interface MobileLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function MobileLayout({ children, showNav = true }: MobileLayoutProps) {
  return (
    <div className="flex justify-center w-full min-h-dvh bg-background">
      <div className="relative w-full max-w-[480px] flex flex-col min-h-dvh overflow-x-hidden">
        <main
          className={`flex-1 overflow-y-auto ${showNav ? "pb-[calc(4rem+env(safe-area-inset-bottom))]" : ""}`}
        >
          {children}
        </main>
        {showNav && <BottomNav />}
      </div>
    </div>
  );
}
