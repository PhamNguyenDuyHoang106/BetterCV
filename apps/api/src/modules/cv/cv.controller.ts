import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CvService } from "./cv.service";
import { CvCreateDto, CvUpdateDto } from "./dto/cv.dto";
import { CvSectionUpsertDto } from "./dto/section.dto";
import { CurrentUser, JwtPayload } from "../../core/decorators";

@UseGuards(AuthGuard("jwt"))
@Controller("cvs")
export class CvController {
  constructor(private cvService: CvService) {}

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CvCreateDto) {
    return this.cvService.create(user.sub, dto);
  }

  @Get()
  async list(@CurrentUser() user: JwtPayload) {
    return this.cvService.list(user.sub);
  }

  @Get(":id")
  async get(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.cvService.get(user.sub, id);
  }

  @Put(":id")
  async update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: CvUpdateDto,
  ) {
    return this.cvService.update(user.sub, id, dto);
  }

  @Delete(":id")
  async delete(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.cvService.softDelete(user.sub, id);
  }

  @Post(":id/sections")
  async upsertSection(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: CvSectionUpsertDto,
  ) {
    return this.cvService.upsertSection(user.sub, id, dto);
  }

  @Get(":id/versions")
  async versions(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.cvService.listVersions(user.sub, id);
  }

  @Post(":id/share")
  async share(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.cvService.createShareLink(user.sub, id);
  }
}
