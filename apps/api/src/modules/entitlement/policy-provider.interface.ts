import { Feature, QuotaKey } from '@acv/shared';

export interface PolicyProvider {
  getPolicyVersion(): string;
  isFeatureAllowed(planTier: string, feature: Feature): boolean;
  getPlanQuota(plan: any, key: QuotaKey): number;
}
