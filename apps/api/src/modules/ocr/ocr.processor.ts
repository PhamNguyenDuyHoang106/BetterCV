import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { OcrService } from './ocr.service';
import * as Sentry from '@sentry/node';
import { RequestContextStore } from '../../core/context/request-context.store';

@Processor('ocr-queue', { concurrency: 5 })
@Injectable()
export class OcrProcessor extends WorkerHost {
  private readonly logger = new Logger(OcrProcessor.name);

  constructor(private readonly ocrService: OcrService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { jobId, storageKey, filename, mimetype, meta, trace } = job.data;
    const requestId = trace?.requestId || meta?.requestId || null;

    // Re-establish AsyncLocalStorage context so downstream services
    // (OcrService, PrismaService, etc.) automatically inherit requestId.
    return RequestContextStore.run(
      { requestId: requestId || `worker-${job.id}` },
      async () => {
        const queueDelayMs = Date.now() - (trace?.createdAt || job.timestamp);

        this.logger.log({
          msg: 'Queue job started processing',
          module: 'QueueWorker',
          jobType: 'ocr',
          event: 'job_started',
          queue: 'ocr-queue',
          jobId: job.id,
          queueDelayMs,
          requestId,
        });

        const start = Date.now();
        try {
          await this.ocrService.processJob(
            jobId,
            storageKey,
            filename,
            mimetype,
          );
          const durationMs = Date.now() - start;

          this.logger.log({
            msg: 'Queue job completed successfully',
            module: 'QueueWorker',
            jobType: 'ocr',
            event: 'job_completed',
            queue: 'ocr-queue',
            jobId: job.id,
            queueDelayMs,
            durationMs,
            requestId,
          });
        } catch (err: any) {
          const durationMs = Date.now() - start;
          this.logger.error({
            msg: `Failed to process OCR job ${jobId}: ${err.message}`,
            module: 'QueueWorker',
            jobType: 'ocr',
            event: 'job_failed',
            queue: 'ocr-queue',
            jobId: job.id,
            queueDelayMs,
            durationMs,
            requestId,
            errorMessage: err.message,
            errorStack: err.stack,
          });
          throw err;
        } finally {
          // Dọn dẹp file tạm trên Supabase Storage để đảm bảo scale ngang an toàn
          try {
            await this.ocrService.deleteStorageFile(storageKey);
          } catch (cleanupErr: any) {
            this.logger.warn({
              msg: `Failed to clean up temporary storage file ${storageKey}: ${cleanupErr.message}`,
              module: 'QueueWorker',
              jobType: 'ocr',
              requestId,
            });
          }
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
      jobType: 'ocr',
      event: 'job_failed',
      queue: 'ocr-queue',
      jobId: job.id,
      errorMessage: err.message,
      errorStack: err.stack,
      requestId,
    });

    // Report to Sentry
    Sentry.withScope((scope) => {
      scope.setTag('requestId', requestId);
      scope.setTag('queue', 'ocr-queue');
      scope.setTag('jobId', job.id);
      scope.setContext('job_data', job.data);
      Sentry.captureException(err);
    });
  }
}
