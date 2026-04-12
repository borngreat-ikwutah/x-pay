import { useCallback, useEffect, useMemo, useState } from "react";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const POLL_INTERVAL_MS = 15_000;
const XLM_DECIMALS = 4;

interface HorizonPayment {
  id: string;
  type: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  from?: string;
  to?: string;
  transaction_hash?: string;
  created_at?: string;
  memo?: string;
}

export interface TransactionRecord {
  id: string;
  created_at: string;
  amount: string;
  asset: string;
  type: string;
  from: string;
  to: string;
  hash: string;
  memo?: string | null;
}

interface BalanceData {
  balance: string;
  operations: {
    id: string;
    type: string;
    amount: string;
    asset: string;
    from: string;
    to: string;
    hash: string;
    timestamp: string;
  }[];
}

interface SupabaseTransactionRow {
  id: string;
  created_at: string;
  amount?: number | string | null;
  asset?: string | null;
  type?: string | null;
  from?: string | null;
  to?: string | null;
  hash?: string | null;
  transaction_hash?: string | null;
  memo?: string | null;
}

function formatXlmAmount(value: number | string | null | undefined) {
  const amount = typeof value === "string" ? Number(value) : Number(value ?? 0);
  if (!Number.isFinite(amount)) return "0.0000";
  return amount.toFixed(XLM_DECIMALS);
}

function normalizeBalance(balance: unknown) {
  const amount = Number(balance);
  if (!Number.isFinite(amount)) return "0.0000";
  return amount.toFixed(XLM_DECIMALS);
}

export function useHorizonBalance(address: string | null) {
  const [data, setData] = useState<BalanceData>({
    balance: "0.0000",
    operations: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) {
      setData({ balance: "0.0000", operations: [] });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accountRes = await fetch(`${HORIZON_URL}/accounts/${address}`);
      if (!accountRes.ok) throw new Error("Account not found");

      const account = await accountRes.json();
      const xlmBalance =
        account.balances?.find(
          (b: { asset_type: string }) => b.asset_type === "native",
        )?.balance ?? "0";

      const paymentsRes = await fetch(
        `${HORIZON_URL}/accounts/${address}/payments?limit=10&order=desc`,
      );

      if (!paymentsRes.ok) {
        throw new Error("Failed to fetch account activity");
      }

      const paymentsData = await paymentsRes.json();
      const payments: HorizonPayment[] = paymentsData._embedded?.records ?? [];

      const operations = payments
        .filter((p) => p.type === "payment" || p.type === "create_account")
        .map((p) => ({
          id: p.id,
          type: p.type,
          amount: formatXlmAmount(p.amount ?? "0"),
          asset: p.asset_code ?? "XLM",
          from: p.from ?? "",
          to: p.to ?? address,
          hash: p.transaction_hash ?? "",
          timestamp: p.created_at ?? "",
        }));

      setData({
        balance: normalizeBalance(xlmBalance),
        operations,
      });
    } catch (err) {
      console.error("Horizon error:", err);
      setError("Failed to fetch balance");
      setData((current) => ({
        ...current,
        balance: current.balance || "0.0000",
      }));
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

  return { data, isLoading, error, refresh };
}

export function useTransactionHistory(address?: string | null) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabaseUrl = (
    import.meta as ImportMeta & { env?: Record<string, string | undefined> }
  ).env?.VITE_SUPABASE_URL;
  const supabaseAnonKey = (
    import.meta as ImportMeta & { env?: Record<string, string | undefined> }
  ).env?.VITE_SUPABASE_ANON_KEY;

  const fetchTransactions = useCallback(async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setError("Supabase is not configured");
      setTransactions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const query = new URL(`${supabaseUrl}/rest/v1/transactions`);
      query.searchParams.set("select", "*");
      query.searchParams.set("order", "created_at.desc");
      query.searchParams.set("limit", "10");
      if (address) {
        query.searchParams.set("or", `(from.eq.${address},to.eq.${address})`);
      }

      const response = await fetch(query.toString(), {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transaction history");
      }

      const rows: SupabaseTransactionRow[] = await response.json();

      setTransactions(
        rows.map((row) => ({
          id: row.id,
          created_at: row.created_at,
          amount: formatXlmAmount(row.amount ?? 0),
          asset: row.asset ?? "XLM",
          type: row.type ?? "transaction",
          from: row.from ?? "",
          to: row.to ?? "",
          hash: row.hash ?? row.transaction_hash ?? "",
          memo: row.memo ?? null,
        })),
      );
    } catch (err) {
      console.error("Transaction history error:", err);
      setError("Failed to fetch transaction history");
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [address, supabaseAnonKey, supabaseUrl]);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  const formattedTransactions = useMemo(
    () =>
      transactions.map((tx) => ({
        ...tx,
        amount: formatXlmAmount(tx.amount),
      })),
    [transactions],
  );

  return {
    transactions: formattedTransactions,
    isLoading,
    error,
    refresh: fetchTransactions,
  };
}
