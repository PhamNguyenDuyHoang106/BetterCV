import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { OcrService } from './ocr.service';
import { CurrentUser, JwtPayload, RequireFeature } from '../../core/decorators';
import { PolicyGuard } from '../../core/guards';
import { Feature } from '@acv/shared';

@UseGuards(AuthGuard('jwt'), PolicyGuard)
@Controller('ai')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @RequireFeature(Feature.IMPORT_CV)
  @Post('upload-cv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCv(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    const requestId = req.id || req.headers['x-request-id'];
    return this.ocrService.createJob(user.sub, file, requestId);
  }

  @Get('ocr/status/:jobId')
  async getStatus(
    @CurrentUser() user: JwtPayload,
    @Param('jobId') jobId: string,
  ) {
    return this.ocrService.getJobStatus(jobId);
  }
}
