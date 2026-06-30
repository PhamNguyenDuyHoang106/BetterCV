import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AiFeature } from '@prisma/client';
import { TokenUsage } from './providers/ai-provider.interface';
import { RequestContextStore } from '../../core/context/request-context.store';
import {
  MODEL_PRICING,
  DEFAULT_PRICING,
} from './constants/ai-pricing.constants';
import { Decimal } from '@prisma/client/runtime/library';

export interface RecordUsageParams {
  userId?: string;
  feature: AiFeature;
  model: string;
  usage?: TokenUsage;
  success: boolean;
}

/**
 * AiUsageService handles AI cost tracking and token usage accounting.
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * - This service is designed primarily for observability, analytics, and cost monitoring.
 * - Because it operates on a fire-and-forget promise pattern (recordUsage does not block),
 *   it is NOT guaranteed to be 100% durable in cases of sudden process termination.
 * - DO NOT use this service as the primary authoritative source for direct financial billing,
 *   customer invoicing, or strict quota enforcement. For billing use cases, migrate this
 *   mechanism to a durable event-driven worker queue (e.g. BullMQ).
 */
@Injectable()
export class AiUsageService {
  private readonly logger = new Logger(AiUsageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Fire-and-forget usage recording.
   * Never throws — failures are logged but never propagate to callers.
   */
  recordUsage(params: RecordUsageParams): void {
    void this.persistLog(params);
  }

  private async persistLog(params: RecordUsageParams): Promise<void> {
    try {
      const { userId, feature, model, usage, success } = params;
      const requestId = RequestContextStore.get('requestId') ?? null;

      const promptTokens = usage?.promptTokens ?? 0;
      const completionTokens = usage?.completionTokens ?? 0;
      const totalTokens = usage?.totalTokens ?? 0;

      // Resolve pricing from model name
      const pricing = MODEL_PRICING[model] ?? DEFAULT_PRICING;
      const estimatedCostUsd =
        (promptTokens * pricing.inputUsdPer1M) / 1_000_000 +
        (completionTokens * pricing.outputUsdPer1M) / 1_000_000;

      await this.prisma.aiUsageLog.create({
        data: {
          userId: userId ?? null,
          feature,
          provider: pricing.provider,
          model,
          promptTokens,
          completionTokens,
          totalTokens,
          estimatedCostUsd: new Decimal(estimatedCostUsd.toFixed(8)),
          requestId,
          success,
        },
      });

      this.logger.debug({
        event: 'ai_usage_recorded',
        feature,
        model,
        totalTokens,
        estimatedCostUsd: estimatedCostUsd.toFixed(8),
        success,
      });
    } catch (err: any) {
      // Critical: never let accounting failures propagate
      this.logger.error({
        event: 'ai_usage_record_failed',
        error: err.message,
        feature: params.feature,
        model: params.model,
      });
    }
  }
}
