import { Module } from '@nestjs/common';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { CvModule } from '../cv/cv.module';
import { AiModule } from '../ai/ai.module';

// OcrProcessor (BullMQ worker) đã được loại bỏ vì pipeline OCR hiện dùng
// setImmediate inline processing — không cần Redis/BullMQ worker.
// OcrProcessor vẫn giữ lại file nhưng không đăng ký ở đây để hỗ trợ
// horizontal scaling trong tương lai nếu cần.

@Module({
  imports: [
    CvModule,
    AiModule,
  ],
  controllers: [OcrController],
  providers: [OcrService],
  exports: [OcrService],
})
export class OcrModule {}
