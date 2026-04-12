import { useCallback, useEffect, useState } from "react";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const POLL_INTERVAL_MS = 15_000;
const XLM_DECIMALS = 4;

export interface XlmBalanceState {
  balance: string;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function formatXlmAmount(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "0.0000";
  return amount.toFixed(XLM_DECIMALS);
}

export function useXlmBalance(address: string | null): XlmBalanceState {
  const [balance, setBalance] = useState("0.0000");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) {
      setBalance("0.0000");
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${HORIZON_URL}/accounts/${address}`);

      if (!response.ok) {
        throw new Error("Failed to load account balance");
      }

      const account = await response.json();
      const nativeBalance =
        account?.balances?.find(
          (entry: { asset_type?: string }) => entry?.asset_type === "native",
        )?.balance ?? "0";

      setBalance(formatXlmAmount(nativeBalance));
    } catch (err) {
      console.error("useXlmBalance error:", err);
      setError("Failed to fetch XLM balance");
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void refresh();

    if (!address) return;

    const interval = setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [address, refresh]);

  return {
    balance,
    isLoading,
    error,
    refresh,
  };
}
