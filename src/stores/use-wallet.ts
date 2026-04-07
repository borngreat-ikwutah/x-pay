import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isConnected, requestAccess } from "@stellar/freighter-api";
import { toast } from "sonner";

interface WalletState {
  address: string | null;
  status: "idle" | "connecting" | "connected" | "error";
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      status: "idle",

      connect: async () => {
        set({ status: "connecting" });

        try {
          const connectionStatus = await isConnected();
          if (!connectionStatus.isConnected) {
            toast.error("Freighter not found. Please install the extension.");
            set({ status: "error" });
            return;
          }

          const { address, error } = await requestAccess();

          if (error || !address) {
            toast.error("Access denied. Please unlock your Freighter wallet.");
            set({ status: "error" });
            return;
          }

          set({ address, status: "connected" });
          toast.success("Wallet connected!");
        } catch (err) {
          console.error("Wallet connection error:", err);
          toast.error("Connection failed or cancelled.");
          set({ status: "error" });
        }
      },

      disconnect: () => {
        set({ address: null, status: "idle" });
        toast.info("Wallet disconnected.");
      },
    }),
    {
      name: "xpay-wallet-storage",
    }
  )
);
