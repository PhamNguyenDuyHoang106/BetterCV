import { SetMetadata } from '@nestjs/common';
import { QuotaKey } from '@acv/shared';

export const REQUIRE_QUOTA_KEY = 'require_quota';
export const RequireQuota = (quotaKey: QuotaKey) =>
  SetMetadata(REQUIRE_QUOTA_KEY, quotaKey);
