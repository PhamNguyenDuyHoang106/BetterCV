import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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
}
