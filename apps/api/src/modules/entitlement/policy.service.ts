import { Inject, Injectable } from '@nestjs/common';
import { Feature, QuotaKey } from '@acv/shared';
import { PolicyProvider } from './policy-provider.interface';

@Injectable()
export class PolicyService {
  constructor(
    @Inject('PolicyProvider') private readonly provider: PolicyProvider,
  ) {}

  getPolicyVersion(): string {
    return this.provider.getPolicyVersion();
  }

  isFeatureAllowed(planTier: string, feature: Feature): boolean {
    return this.provider.isFeatureAllowed(planTier, feature);
  }

  getPlanQuota(plan: any, key: QuotaKey): number {
    return this.provider.getPlanQuota(plan, key);
  }
}
