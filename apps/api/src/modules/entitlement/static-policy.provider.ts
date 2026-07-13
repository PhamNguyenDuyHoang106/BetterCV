import { Injectable } from '@nestjs/common';
import { Feature, QuotaKey, PLAN_ENTITLEMENTS, POLICY_VERSION } from '@acv/shared';
import { PolicyProvider } from './policy-provider.interface';

@Injectable()
export class StaticPolicyProvider implements PolicyProvider {
  getPolicyVersion(): string {
    return POLICY_VERSION;
  }

  isFeatureAllowed(planTier: string, feature: Feature): boolean {
    const activeFeatures = PLAN_ENTITLEMENTS[planTier];
    if (!activeFeatures) return false;
    return activeFeatures.has(feature);
  }

  getPlanQuota(plan: any, key: QuotaKey): number {
    if (!plan) return -1;
    if (key === QuotaKey.MAX_CV) {
      return typeof plan.maxCV === 'number' ? plan.maxCV : -1;
    }
    if (key === QuotaKey.MAX_DAILY_ATS) {
      return typeof plan.maxDailyATS === 'number' ? plan.maxDailyATS : -1;
    }
    return -1;
  }
}
