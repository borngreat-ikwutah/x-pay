import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type SupabaseEnv = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

let cachedClient: SupabaseClient | null = null;

function getSupabaseEnv(): SupabaseEnv {
  return import.meta.env as SupabaseEnv;
}

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = getSupabaseEnv();

  if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  cachedClient = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return cachedClient;
}

export type UserProfile = {
  id: string;
  wallet_address: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  onboarding_complete: boolean | null;
  preferred_currency: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CreateProfileInput = {
  id?: string;
  wallet_address?: string | null;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  preferred_currency?: string | null;
  onboarding_complete?: boolean;
};

export async function getOrCreateProfile(
  walletAddress: string,
  defaults: Partial<CreateProfileInput> = {},
): Promise<UserProfile> {
  const supabase = getSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existing) {
    return existing as UserProfile;
  }

  const payload: Omit<CreateProfileInput, "id"> = {
    wallet_address: walletAddress,
    full_name: defaults.full_name ?? null,
    username: defaults.username ?? null,
    avatar_url: defaults.avatar_url ?? null,
    preferred_currency: defaults.preferred_currency ?? "XLM",
    onboarding_complete: defaults.onboarding_complete ?? false,
  };

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert(payload)
    .select("*")
    .single();

  if (insertError) {
    throw insertError;
  }

  return created as UserProfile;
}

export async function updateProfile(
  walletAddress: string,
  updates: Partial<Omit<CreateProfileInput, "id">>,
): Promise<UserProfile> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("wallet_address", walletAddress)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as UserProfile;
}

export async function markOnboardingComplete(
  walletAddress: string,
): Promise<UserProfile> {
  return updateProfile(walletAddress, { onboarding_complete: true });
}

export async function ensureWalletProfile(params: {
  userId?: string;
  walletAddress: string;
  fullName?: string | null;
  username?: string | null;
  preferredCurrency?: string | null;
}): Promise<UserProfile> {
  const {
    walletAddress,
    fullName = null,
    username = null,
    preferredCurrency = "XLM",
  } = params;

  return getOrCreateProfile(walletAddress, {
    wallet_address: walletAddress,
    full_name: fullName,
    username,
    preferred_currency: preferredCurrency,
    onboarding_complete: false,
  });
}
