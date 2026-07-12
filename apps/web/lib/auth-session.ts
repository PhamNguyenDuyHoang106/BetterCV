import { apiFetch } from "./api";
import { createSupabaseClient } from "./supabase";
import { useAuthStore } from "./store/auth";
import { useEntitlementStore } from "./store/entitlement";

export type AuthProfile = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
};

/** Persist Supabase session into app store + backend profile */
export async function syncSessionToApp(fullName?: string): Promise<AuthProfile | null> {
  const supabase = createSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) return null;

  useAuthStore.setState({ accessToken: session.access_token });

  const res = await apiFetch<any>(
    fullName ? "/auth/sync" : "/auth/me",
    fullName
      ? { method: "POST", body: JSON.stringify({ fullName }) }
      : undefined,
  );
  const profile = res?.data || res;

  useAuthStore.getState().setAuth(session.access_token, profile);
  
  // Dynamically fetch user entitlements & quotas in sync with session
  await useEntitlementStore.getState().fetchEntitlements(session.access_token);
  
  return profile;
}

export async function signInWithGoogle(redirectPath = "/dashboard") {
  const supabase = createSupabaseClient();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
  if (error) throw error;
}
