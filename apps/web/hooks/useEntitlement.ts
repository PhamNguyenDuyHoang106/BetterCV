import { useCallback, useEffect } from "react";
import { useEntitlementStore, QuotaState } from "../lib/store/entitlement";
import { useAuthStore } from "../lib/store/auth";
import { Feature, QuotaKey } from "@acv/shared";

export function useEntitlement() {
  const { plan, rendering, features, quotas, loading, error, fetchEntitlements } =
    useEntitlementStore();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken && !plan && !loading) {
      fetchEntitlements(accessToken).catch(() => {});
    }
  }, [accessToken, plan, loading, fetchEntitlements]);

  const canUse = useCallback(
    (feature: Feature) => {
      return features.includes(feature);
    },
    [features]
  );

  const getQuota = useCallback(
    (key: QuotaKey): QuotaState => {
      if (!quotas || !quotas[key]) {
        return {
          limit: null,
          used: 0,
          remaining: null,
          unlimited: true,
          exhausted: false,
          lastReset: null,
          metadata: null,
        };
      }
      return quotas[key];
    },
    [quotas]
  );

  return {
    plan,
    rendering,
    loading,
    error,
    canUse,
    getQuota,
    fetchEntitlements,
  };
}
