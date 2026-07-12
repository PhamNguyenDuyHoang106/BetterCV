import { QuotaKey } from '@acv/shared';

export interface UsageSnapshot {
  used: number;
  lastReset?: Date;
  metadata?: Record<string, unknown>;
}

export interface UsageProvider {
  supports(key: QuotaKey): boolean;
  getCurrentUsage(userId: string, key: QuotaKey): Promise<UsageSnapshot>;
}
