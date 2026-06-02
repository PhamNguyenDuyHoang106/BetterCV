import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, NotFoundException } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import { ThumbnailService } from './thumbnail.service';

@Processor('thumbnail-queue', { concurrency: 2 })
export class ThumbnailProcessor extends WorkerHost {
  private readonly logger = new Logger(ThumbnailProcessor.name);

  constructor(private readonly thumbnailService: ThumbnailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { cvId, version } = job.data;
    this.logger.log(
      `Processing thumbnail job for CV ${cvId} (Version: ${version}, Job ID: ${job.id})`,
    );

    try {
      await this.thumbnailService.generateThumbnail(cvId, version);
      return { success: true };
    } catch (err: any) {
      this.logger.error(
        `Thumbnail generation failed for job ${job.id}: ${err.message}`,
      );

      // Classify permanent errors (CV or Template not found) and mark as unrecoverable
      if (
        err instanceof NotFoundException ||
        err.message?.includes('not found')
      ) {
        this.logger.warn(
          `Permanent error detected. Marking job ${job.id} as unrecoverable.`,
        );
        throw new UnrecoverableError(err.message);
      }

      // Retryable errors get standard retry/backoff processing
      throw err;
    }
  }
}
