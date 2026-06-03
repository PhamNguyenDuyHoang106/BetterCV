import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ThumbnailService } from './thumbnail.service';
import { RequestContextStore } from '../../core/context/request-context.store';

@Processor('thumbnail-cleanup-queue')
export class ThumbnailCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(ThumbnailCleanupProcessor.name);

  constructor(private readonly thumbnailService: ThumbnailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { cvId, meta } = job.data;
    const requestId = meta?.requestId || `cleanup-worker-${job.id}`;

    return RequestContextStore.run({ requestId }, async () => {
      this.logger.log({
        msg: `Thumbnail cleanup job started for CV: ${cvId}`,
        module: 'QueueWorker',
        jobType: 'thumbnail-cleanup',
        event: 'job_started',
        queue: 'thumbnail-cleanup-queue',
        jobId: job.id,
        requestId,
      });

      const start = Date.now();
      try {
        await this.thumbnailService.deleteThumbnail(cvId);
        const durationMs = Date.now() - start;

        this.logger.log({
          msg: `Thumbnail cleanup job completed for CV: ${cvId}`,
          module: 'QueueWorker',
          jobType: 'thumbnail-cleanup',
          event: 'job_completed',
          queue: 'thumbnail-cleanup-queue',
          jobId: job.id,
          durationMs,
          requestId,
        });

        return { success: true };
      } catch (err: any) {
        const durationMs = Date.now() - start;
        this.logger.error({
          msg: `Thumbnail cleanup job failed for CV ${cvId}: ${err.message}`,
          module: 'QueueWorker',
          jobType: 'thumbnail-cleanup',
          event: 'job_failed',
          queue: 'thumbnail-cleanup-queue',
          jobId: job.id,
          durationMs,
          requestId,
          errorMessage: err.message,
          errorStack: err.stack,
        });
        throw err;
      }
    });
  }
}
