import { Module } from '@nestjs/common';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';
import { BullModule } from '@nestjs/bullmq';
import { ThumbnailService } from './thumbnail.service';
import { ThumbnailProcessor } from './thumbnail.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'thumbnail-queue',
    }),
  ],
  controllers: [CvController],
  providers: [CvService, ThumbnailService, ThumbnailProcessor],
  exports: [CvService, ThumbnailService, ThumbnailProcessor],
})
export class CvModule {}
