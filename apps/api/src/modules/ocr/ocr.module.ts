import { Module } from "@nestjs/common";
import { OcrController } from "./ocr.controller";
import { OcrService } from "./ocr.service";
import { CvModule } from "../cv/cv.module";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [CvModule, AiModule],
  controllers: [OcrController],
  providers: [OcrService],
  exports: [OcrService]
})
export class OcrModule {}
