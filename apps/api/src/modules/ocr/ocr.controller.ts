import { Controller, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FileInterceptor } from "@nestjs/platform-express";
import { OcrService } from "./ocr.service";
import { CurrentUser, JwtPayload } from "../../core/decorators";

@UseGuards(AuthGuard("jwt"))
@Controller("ai")
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post("upload-cv")
  @UseInterceptors(FileInterceptor("file"))
  async uploadCv(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: any
  ) {
    return this.ocrService.createJob(user.sub, file);
  }

  @Get("ocr/status/:jobId")
  async getStatus(
    @CurrentUser() user: JwtPayload,
    @Param("jobId") jobId: string
  ) {
    return this.ocrService.getJobStatus(jobId);
  }
}
