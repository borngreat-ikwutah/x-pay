import { useCallback, useEffect, useMemo, useState } from "react";

const XLM_DECIMALS = 4;

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

function getSupabaseConfig() {
  const env = (import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }).env;

  return {
    url: env?.VITE_SUPABASE_URL,
    anonKey: env?.VITE_SUPABASE_ANON_KEY,
  };
}

export function useTransactionHistory(address?: string | null) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseConfig();

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
  }, [address]);

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
