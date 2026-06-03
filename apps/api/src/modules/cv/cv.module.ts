import { Module } from '@nestjs/common';
import { CvController } from './cv.controller';
import { CvPublicController } from './cv-public.controller';
import { CvService } from './cv.service';
import { BullModule } from '@nestjs/bullmq';
import { ThumbnailService } from './thumbnail.service';
import { ThumbnailProcessor } from './thumbnail.processor';
import { ThumbnailCleanupProcessor } from './thumbnail-cleanup.processor';
import { ThumbnailGcTask } from './thumbnail-gc.task';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'thumbnail-queue',
    }),
    BullModule.registerQueue({
      name: 'thumbnail-cleanup-queue',
    }),
  ],
  controllers: [CvController, CvPublicController],
  providers: [
    CvService,
    ThumbnailService,
    ThumbnailProcessor,
    ThumbnailCleanupProcessor,
    ThumbnailGcTask,
  ],
  exports: [
    CvService,
    ThumbnailService,
    ThumbnailProcessor,
    ThumbnailCleanupProcessor,
    ThumbnailGcTask,
  ],
})
export class CvModule {}
