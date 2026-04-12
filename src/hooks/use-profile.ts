import { useState, useEffect, useCallback } from "react";
import { getSupabaseClient, type UserProfile } from "~/lib/supabase/client";

export function useProfile(address: string | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!address) {
      setProfile(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", address)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setProfile(data as UserProfile | null);
    } catch (err: any) {
      console.error("useProfile error:", err);
      setError(err.message || "Failed to fetch profile");
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refresh: fetchProfile,
  };
}
