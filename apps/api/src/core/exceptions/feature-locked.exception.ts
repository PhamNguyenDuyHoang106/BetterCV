import { ForbiddenException } from '@nestjs/common';
import { Feature } from '@acv/shared';

export class FeatureLockedException extends ForbiddenException {
  constructor(feature: Feature, requiredPlan: string, message?: string) {
    super({
      statusCode: 403,
      message: message || `Upgrade to ${requiredPlan} to unlock ${feature}.`,
      error: 'Forbidden',
      code: 'FEATURE_LOCKED',
      feature,
      requiredPlan,
      upgradeUrl: '/pricing',
    });
  }
}
