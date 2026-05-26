import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FeatureFlagService {
  private flags: Record<string, boolean> = {
    aiVisionOCR: true,
    experimentalATS: true,
    streamingSummary: true,
  };

  constructor(private config: ConfigService) {
    // Enable overriding flags via environment variables (e.g. FEATURE_AI_VISION_OCR=false)
    for (const key of Object.keys(this.flags)) {
      const envKey = `FEATURE_${this.decamelize(key).toUpperCase()}`;
      const envValue = this.config.get<string>(envKey);
      if (envValue !== undefined) {
        this.flags[key] = envValue === 'true';
      }
    }
  }

  /**
   * Evaluates if a given feature flag is enabled.
   * Can accept an optional userId to handle targeted rollouts or beta groups.
   */
  isEnabled(flag: string, userId?: string): boolean {
    const isEnabled = this.flags[flag];
    if (isEnabled === undefined) {
      return false;
    }
    
    // Extensible targeting logic can be placed here later, e.g.:
    // if (flag === 'experimentalATS' && userId) {
    //   return userId.startsWith('beta_');
    // }
    
    return isEnabled;
  }

  private decamelize(str: string): string {
    return str.replace(/([a-z\d])([A-Z])/g, '$1_$2');
  }
}
