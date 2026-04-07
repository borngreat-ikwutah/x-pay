import { useEffect } from "react";
import { useDeviceStore } from "~/stores/device-store";
import { useRouteContext } from "@tanstack/react-router";

export function MobileGuard({ children }: { children: React.ReactNode }) {
  const { isMobileUA } = useRouteContext({ from: "__root__" }) as {
    isMobileUA: boolean;
  };
  const { isMobile, checkDevice } = useDeviceStore();

  useEffect(() => {
    // First run on mount, we trust the UA but also double check window width
    checkDevice();

    const handleResize = () => checkDevice();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [checkDevice]);

  // Use the server-side hint before hydration completes
  const activeIsMobile = typeof window === "undefined" ? isMobileUA : isMobile;

  if (!activeIsMobile) {
    return (
      <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-6 text-center">
        <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-xl border max-w-md w-full flex flex-col items-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-full text-primary mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M192,20H64A20,20,0,0,0,44,40V216a20,20,0,0,0,20,20H192a20,20,0,0,0,20-20V40A20,20,0,0,0,192,20Zm-64,192a12,12,0,1,1,12-12A12,12,0,0,1,128,212Zm60-44H68V44H188Z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            This app is only accessible on mobile devices
          </h1>
          <p className="text-muted-foreground text-sm">
            For the best experience, please open this application on your
            smartphone.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
