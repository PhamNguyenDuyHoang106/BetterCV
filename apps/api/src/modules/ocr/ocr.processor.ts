import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { OcrService } from './ocr.service';

@Processor('ocr-queue', { concurrency: 5 })
@Injectable()
export class OcrProcessor extends WorkerHost {
  private readonly logger = new Logger(OcrProcessor.name);

  constructor(private readonly ocrService: OcrService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { jobId, storageKey, filename, mimetype } = job.data;
    this.logger.log(
      `Processing OCR job ${jobId} from queue (Storage: ${storageKey})`,
    );

    try {
      await this.ocrService.processJob(jobId, storageKey, filename, mimetype);
    } catch (err: any) {
      this.logger.error(`Failed to process OCR job ${jobId}: ${err.message}`);
      throw err;
    } finally {
      // Dọn dẹp file tạm trên Supabase Storage để đảm bảo scale ngang an toàn
      try {
        await this.ocrService.deleteStorageFile(storageKey);
      } catch (cleanupErr: any) {
        this.logger.warn(
          `Failed to clean up temporary storage file ${storageKey}: ${cleanupErr.message}`,
        );
      }
    }
  }
}
