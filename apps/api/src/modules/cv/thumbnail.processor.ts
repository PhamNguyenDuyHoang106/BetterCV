import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, NotFoundException } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import { ThumbnailService } from './thumbnail.service';
import * as Sentry from '@sentry/node';
import { RequestContextStore } from '../../core/context/request-context.store';

@Processor('thumbnail-queue', { concurrency: 2 })
export class ThumbnailProcessor extends WorkerHost {
  private readonly logger = new Logger(ThumbnailProcessor.name);

  constructor(private readonly thumbnailService: ThumbnailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { cvId, version, meta, trace } = job.data;
    const requestId = trace?.requestId || meta?.requestId || null;

    // Re-establish AsyncLocalStorage context so downstream services
    // (ThumbnailService, PrismaService, etc.) automatically inherit requestId.
    return RequestContextStore.run(
      { requestId: requestId || `worker-${job.id}` },
      async () => {
        const queueDelayMs = Date.now() - (trace?.createdAt || job.timestamp);

        this.logger.log({
          msg: 'Queue job started processing',
          module: 'QueueWorker',
          jobType: 'thumbnail',
          event: 'job_started',
          queue: 'thumbnail-queue',
          jobId: job.id,
          queueDelayMs,
          requestId,
        });

        const start = Date.now();
        try {
          if (cvId === 'force-fail-cv') {
            throw new Error('Forced queue job failure for Test 10');
          }
          await this.thumbnailService.generateThumbnail(cvId, version);
          const durationMs = Date.now() - start;

          this.logger.log({
            msg: 'Queue job completed successfully',
            module: 'QueueWorker',
            jobType: 'thumbnail',
            event: 'job_completed',
            queue: 'thumbnail-queue',
            jobId: job.id,
            queueDelayMs,
            durationMs,
            requestId,
          });
          return { success: true };
        } catch (err: any) {
          const durationMs = Date.now() - start;
          this.logger.error({
            msg: `Thumbnail generation failed for job ${job.id}: ${err.message}`,
            module: 'QueueWorker',
            jobType: 'thumbnail',
            event: 'job_failed',
            queue: 'thumbnail-queue',
            jobId: job.id,
            queueDelayMs,
            durationMs,
            requestId,
            errorMessage: err.message,
            errorStack: err.stack,
          });

          // Classify permanent errors (CV or Template not found) and mark as unrecoverable
          if (
            err instanceof NotFoundException ||
            err.message?.includes('not found')
          ) {
            this.logger.warn({
              msg: `Permanent error detected. Marking job ${job.id} as unrecoverable.`,
              module: 'QueueWorker',
              jobType: 'thumbnail',
              requestId,
            });
            throw new UnrecoverableError(err.message);
          }

          // Retryable errors get standard retry/backoff processing
          throw err;
        }
      },
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<any, any, string>, err: Error) {
    const { meta, trace } = job.data || {};
    const requestId = trace?.requestId || meta?.requestId || null;

    // Log locally
    this.logger.error({
      msg: 'Queue job failed permanently',
      module: 'QueueWorker',
      jobType: 'thumbnail',
      event: 'job_failed',
      queue: 'thumbnail-queue',
      jobId: job.id,
      errorMessage: err.message,
      errorStack: err.stack,
      requestId,
    });

    // Report to Sentry
    Sentry.withScope((scope) => {
      scope.setTag('requestId', requestId);
      scope.setTag('queue', 'thumbnail-queue');
      scope.setTag('jobId', job.id);
      scope.setContext('job_data', job.data);
      Sentry.captureException(err);
    });
  }
}
