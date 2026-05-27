import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExportService } from './export.service';
import { ExportDto } from './dto/export.dto';
import { CurrentUser, JwtPayload } from '../../core/decorators';

@UseGuards(AuthGuard('jwt'))
@Controller('exports')
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Post('pdf')
  async exportPdf(@CurrentUser() user: JwtPayload, @Body() dto: ExportDto) {
    return this.exportService.exportPdf(user.sub, dto.cvId);
  }

  @Post('docx')
  async exportDocx(@CurrentUser() user: JwtPayload, @Body() dto: ExportDto) {
    return this.exportService.exportDocx(user.sub, dto.cvId);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: any,
  ) {
    return this.exportService.uploadAvatar(user.sub, file);
  }
}
