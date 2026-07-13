import { apiFetch } from "./api";
import { createSupabaseClient } from "./supabase";
import { useAuthStore } from "./store/auth";

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
  return profile;
}

/**
 * Sync session after payment — retries up to `maxRetries` times with `delayMs`
 * between attempts. This handles the PayOS webhook race condition where the DB
 * role may not yet be updated when the first sync happens.
 *
 * Stops early if role is no longer FREE (i.e., upgrade was applied).
 */
export async function syncSessionWithRetry(
  maxRetries = 5,
  delayMs = 2000,
): Promise<AuthProfile | null> {
  let lastProfile: AuthProfile | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const profile = await syncSessionToApp();
      lastProfile = profile;

      // If role is now upgraded, stop retrying
      if (profile && profile.role !== "FREE") {
        return profile;
      }
    } catch (err) {
      console.warn(`syncSessionWithRetry attempt ${attempt + 1} failed:`, err);
    }

    // Wait before next attempt (skip delay after last attempt)
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return lastProfile;
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
