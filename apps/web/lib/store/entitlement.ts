import { create } from "zustand";
import { apiFetch } from "../api";
import { Feature, QuotaKey } from "@acv/shared";

export type QuotaState = {
  limit: number | null;
  used: number;
  remaining: number | null;
  unlimited: boolean;
  exhausted: boolean;
  lastReset: string | null;
  metadata: any | null;
};

export type EntitlementState = {
  policyVersion: string | null;
  plan: {
    tier: string;
    displayName: string;
  } | null;
  rendering: {
    watermark: {
      enabled: boolean;
    };
  } | null;
  features: Feature[];
  quotas: Record<QuotaKey, QuotaState> | null;
  loading: boolean;
  error: string | null;
  fetchEntitlements: (accessToken: string | null) => Promise<void>;
  invalidate: () => void;
};

export const useEntitlementStore = create<EntitlementState>((set) => ({
  policyVersion: null,
  plan: null,
  rendering: null,
  features: [],
  quotas: null,
  loading: false,
  error: null,

  fetchEntitlements: async (accessToken: string | null) => {
    if (!accessToken) {
      set({ plan: null, rendering: null, features: [], quotas: null, error: null });
      return;
    }

    set({ loading: true, error: null });
    try {
      const res = await apiFetch<any>("/auth/entitlements", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = res?.data || res;
      set({
        policyVersion: data.policyVersion,
        plan: data.plan,
        rendering: data.rendering,
        features: data.features as Feature[],
        quotas: data.quotas,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err?.message || "Failed to fetch entitlements", loading: false });
    }
  },

  invalidate: () => {
    set({
      policyVersion: null,
      plan: null,
      rendering: null,
      features: [],
      quotas: null,
    });
  },
}));
