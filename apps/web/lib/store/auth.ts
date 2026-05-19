import { create } from "zustand";

type AuthState = {
  accessToken: string | null;
  user: { id: string; email: string; fullName: string; role: string } | null;
  setAuth: (token: string, user: AuthState["user"]) => void;
  clear: () => void;
  hydrate: () => void;
};

const STORAGE_KEY = "acv-auth";

const isClient = typeof window !== "undefined";

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (accessToken, user) => {
    if (isClient) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken, user }));
    }
    set({ accessToken, user });
  },
  clear: () => {
    if (isClient) {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ accessToken: null, user: null });
  },
  hydrate: () => {
    if (!isClient) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        accessToken?: string;
        user?: AuthState["user"];
      };
      set({
        accessToken: parsed.accessToken ?? null,
        user: parsed.user ?? null,
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
}));
