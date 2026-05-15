import { create } from "zustand";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clear: () => void;
  hydrate: () => void;
};

const storageKey = "acv-auth";

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  setTokens: (accessToken, refreshToken) => {
    const payload = { accessToken, refreshToken };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    set(payload);
  },
  clear: () => {
    localStorage.removeItem(storageKey);
    set({ accessToken: null, refreshToken: null });
  },
  hydrate: () => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as {
        accessToken?: string;
        refreshToken?: string;
      };
      set({
        accessToken: parsed.accessToken ?? null,
        refreshToken: parsed.refreshToken ?? null
      });
    } catch {
      localStorage.removeItem(storageKey);
    }
  }
}));
