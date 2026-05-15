import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { CvService } from "./cv.service";
import { CvCreateDto, CvUpdateDto } from "./dto/cv.dto";
import { CvSectionUpsertDto } from "./dto/section.dto";

@UseGuards(AuthGuard("jwt"))
@Controller("cvs")
export class CvController {
  constructor(private cvService: CvService) {}

  @Post()
  async create(@Req() req: Request & { user: { sub: string } }, @Body() dto: CvCreateDto) {
    return this.cvService.create(req.user.sub, dto);
  }

  @Get()
  async list(@Req() req: Request & { user: { sub: string } }) {
    return this.cvService.list(req.user.sub);
  }

  @Get(":id")
  async get(@Req() req: Request & { user: { sub: string } }, @Param("id") id: string) {
    return this.cvService.get(req.user.sub, id);
  }

  @Put(":id")
  async update(
    @Req() req: Request & { user: { sub: string } },
    @Param("id") id: string,
    @Body() dto: CvUpdateDto
  ) {
    return this.cvService.update(req.user.sub, id, dto);
  }

  @Post(":id/sections")
  async upsertSection(
    @Req() req: Request & { user: { sub: string } },
    @Param("id") id: string,
    @Body() dto: CvSectionUpsertDto
  ) {
    return this.cvService.upsertSection(req.user.sub, id, dto);
  }

  @Get(":id/versions")
  async versions(
    @Req() req: Request & { user: { sub: string } },
    @Param("id") id: string
  ) {
    return this.cvService.listVersions(req.user.sub, id);
  }

  @Post(":id/share")
  async share(
    @Req() req: Request & { user: { sub: string } },
    @Param("id") id: string
  ) {
    return this.cvService.createShareLink(req.user.sub, id);
  }
}
