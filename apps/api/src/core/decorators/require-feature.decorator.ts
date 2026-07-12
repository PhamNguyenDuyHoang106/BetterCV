import { SetMetadata } from '@nestjs/common';
import { Feature } from '@acv/shared';

export const REQUIRE_FEATURE_KEY = 'require_feature';
export const RequireFeature = (feature: Feature) =>
  SetMetadata(REQUIRE_FEATURE_KEY, feature);
