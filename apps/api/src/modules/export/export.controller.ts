import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { ExportService } from "./export.service";
import { ExportDto } from "./dto/export.dto";

@UseGuards(AuthGuard("jwt"))
@Controller("exports")
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Post("pdf")
  async exportPdf(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: ExportDto
  ) {
    return this.exportService.exportPdf(req.user.sub, dto.cvId);
  }

  @Post("docx")
  async exportDocx(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: ExportDto
  ) {
    return this.exportService.exportDocx(req.user.sub, dto.cvId);
  }
}
