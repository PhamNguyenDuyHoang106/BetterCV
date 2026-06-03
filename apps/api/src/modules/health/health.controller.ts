import {
  Controller,
  Get,
  HttpStatus,
  Res,
  Req,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis/redis.service';
import { BypassTransform } from '../../core/decorators/bypass-transform.decorator';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

/**
 * Creates a timeout promise that rejects after the specified duration.
 * Used as a race barrier to prevent health checks from hanging indefinitely.
 */
function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`Health check timed out after ${ms}ms`)),
      ms,
    ),
  );
}

import { addJobWithTrace } from '../../core/utils/queue.util';

/** Maximum time (ms) to wait for each downstream dependency */
const DEPENDENCY_TIMEOUT_MS = 1000;

@Controller('health')
@BypassTransform()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @InjectQueue('thumbnail-queue') private thumbnailQueue: Queue,
  ) {}

  /**
   * Liveness probe — confirms the Node.js process is alive.
   * Does NOT check downstream dependencies.
   * Returns version and commit SHA for deployment debugging.
   */
  @Get('live')
  getLiveness() {
    return {
      status: 'up',
      version: this.config.get<string>('npm_package_version', '0.1.0'),
      commitSha: this.config.get<string>('COMMIT_SHA', 'unknown'),
    };
  }

  /**
   * Readiness probe — checks all downstream dependencies.
   * Each dependency is race-guarded with a 1000ms timeout.
   * Returns 503 if any dependency is down or frozen.
   */
  @Get('ready')
  async getReadiness(@Res() res: Response) {
    const checks: Record<string, 'up' | 'down'> = {
      database: 'down',
      redis: 'down',
    };

    // ── Database check with timeout barrier ──
    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        timeout(DEPENDENCY_TIMEOUT_MS),
      ]);
      checks.database = 'up';
    } catch {
      checks.database = 'down';
    }

    // ── Redis check with timeout barrier ──
    try {
      await Promise.race([
        this.redis.getClient().ping(),
        timeout(DEPENDENCY_TIMEOUT_MS),
      ]);
      checks.redis = 'up';
    } catch {
      checks.redis = 'down';
    }

    const allHealthy = Object.values(checks).every((s) => s === 'up');
    const status = allHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    res.status(status).json({
      status: allHealthy ? 'ready' : 'unavailable',
      ...checks,
    });
  }

  /**
   * DEV-ONLY endpoint to verify error tracking and log correlation.
   * Throws a real 500 error that triggers:
   * - SentryExceptionFilter → Sentry event with requestId tag
   * - Pino error log with the same requestId
   * Blocked in production unless ALLOW_TEST_ENDPOINTS=true.
   */
  @Get('_test-error')
  testError() {
    const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
    const allowTest =
      this.config.get<string>('ALLOW_TEST_ENDPOINTS') === 'true';
    if (
      (nodeEnv === 'production' || process.env.NODE_ENV === 'production') &&
      !allowTest
    ) {
      throw new NotFoundException();
    }

    this.logger.log(
      'Intentional test error triggered — verifying log correlation',
    );
    throw new InternalServerErrorException(
      'Sprint 5E.1 verification: intentional test error',
    );
  }

  @Get('_test-queue-error')
  async testQueueError(@Req() req: Request) {
    const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
    const allowTest =
      this.config.get<string>('ALLOW_TEST_ENDPOINTS') === 'true';
    if (
      (nodeEnv === 'production' || process.env.NODE_ENV === 'production') &&
      !allowTest
    ) {
      throw new NotFoundException();
    }

    const requestId =
      (req as any).id ||
      req.headers['x-request-id'] ||
      'test-queue-failure-xyz';

    // Use dynamic jobId to prevent BullMQ duplicate rejection from previous runs
    const dynamicJobId = `force-fail-${requestId}-${Date.now()}`;

    await addJobWithTrace(
      this.thumbnailQueue,
      'generate-thumbnail',
      {
        cvId: 'force-fail-cv',
        version: 1,
        meta: {
          requestId,
        },
      },
      {
        jobId: dynamicJobId,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    return {
      success: true,
      message: 'Intentional queue failure job enqueued',
      meta: {
        requestId,
      },
    };
  }
}
