import { Module } from '@nestjs/common';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { CvModule } from '../cv/cv.module';
import { AiModule } from '../ai/ai.module';
import { BullModule } from '@nestjs/bullmq';
import { OcrProcessor } from './ocr.processor';

@Module({
  imports: [
    CvModule,
    AiModule,
    BullModule.registerQueue({
      name: 'ocr-queue',
    }),
  ],
  controllers: [OcrController],
  providers: [OcrService, OcrProcessor],
  exports: [OcrService, OcrProcessor],
})
export class OcrModule {}
