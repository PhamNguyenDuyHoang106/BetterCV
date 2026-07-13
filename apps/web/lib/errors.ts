/**
 * Thrown when the API returns a 403 FEATURE_LOCKED response.
 * Carries structured metadata so the frontend can show a rich upgrade modal.
 */
export class FeatureLockedError extends Error {
  public readonly feature: string;
  public readonly requiredPlan: string;
  public readonly upgradeUrl: string;

  constructor(feature: string, requiredPlan: string, upgradeUrl = "/dashboard?tab=upgrade") {
    super(`Upgrade to ${requiredPlan} to unlock ${feature}.`);
    this.name = "FeatureLockedError";
    this.feature = feature;
    this.requiredPlan = requiredPlan;
    this.upgradeUrl = upgradeUrl;
  }
}

/**
 * Thrown when the API returns a 403 QUOTA_EXCEEDED response.
 */
export class QuotaExceededError extends Error {
  public readonly quotaKey: string;
  public readonly limit: number;
  public readonly upgradeUrl: string;

  constructor(quotaKey: string, limit: number, upgradeUrl = "/dashboard?tab=upgrade") {
    super(`Quota limit of ${limit} for ${quotaKey} exceeded.`);
    this.name = "QuotaExceededError";
    this.quotaKey = quotaKey;
    this.limit = limit;
    this.upgradeUrl = upgradeUrl;
  }
}

import { useUpgradeModalStore } from "./store/upgrade-modal";

/**
 * Checks if the caught error is a FeatureLockedError or QuotaExceededError.
 * If yes, it opens the global upgrade prompt modal and returns true (handled).
 * Otherwise, it returns false.
 */
export function handleFeatureError(err: unknown): boolean {
  const isFeatureLocked = err instanceof FeatureLockedError || (err as any)?.name === "FeatureLockedError";
  const isQuotaExceeded = err instanceof QuotaExceededError || (err as any)?.name === "QuotaExceededError";

  if (isFeatureLocked) {
    useUpgradeModalStore.getState().openUpgradeModal((err as any).feature, (err as any).requiredPlan);
    return true;
  }
  if (isQuotaExceeded) {
    useUpgradeModalStore.getState().openUpgradeModal((err as any).quotaKey, "PRO");
    return true;
  }
  return false;
}

