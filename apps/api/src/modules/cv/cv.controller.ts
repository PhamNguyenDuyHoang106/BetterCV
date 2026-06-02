import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { CvService } from './cv.service';
import { ThumbnailService } from './thumbnail.service';
import { CvCreateDto, CvUpdateDto } from './dto/cv.dto';
import { CvSectionUpsertDto } from './dto/section.dto';
import { CurrentUser, JwtPayload } from '../../core/decorators';

@UseGuards(AuthGuard('jwt'))
@Controller('cvs')
export class CvController {
  constructor(
    private cvService: CvService,
    private thumbnailService: ThumbnailService,
  ) {}

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CvCreateDto) {
    return this.cvService.create(user.sub, dto);
  }

  @Get()
  async list(@CurrentUser() user: JwtPayload) {
    return this.cvService.list(user.sub);
  }

  @Get(':id')
  async get(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.cvService.get(user.sub, id);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CvUpdateDto,
    @Req() req: Request,
  ) {
    const sessionId = req.headers['x-session-id'] as string;
    const device = getDeviceFromUserAgent(req.headers['user-agent']);
    return this.cvService.update(user.sub, id, dto, { sessionId, device });
  }

  @Delete(':id')
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.cvService.softDelete(user.sub, id);
  }

  @Post(':id/sections')
  async upsertSection(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CvSectionUpsertDto,
    @Req() req: Request,
  ) {
    const sessionId = req.headers['x-session-id'] as string;
    const device = getDeviceFromUserAgent(req.headers['user-agent']);
    return this.cvService.upsertSection(user.sub, id, dto, {
      sessionId,
      device,
    });
  }

  @Get(':id/versions')
  async versions(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.cvService.listVersions(user.sub, id);
  }

  @Get(':id/ats-history')
  async atsHistory(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.cvService.listAtsHistory(user.sub, id);
  }

  @Post(':id/versions/:versionId/restore')
  async restoreVersion(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.cvService.restoreVersion(user.sub, id, versionId);
  }

  @Get('internal/thumbnail-health')
  async getThumbnailHealth(@CurrentUser() user: JwtPayload) {
    const isAdmin = user?.role === 'ADMIN';
    const isDev = process.env.NODE_ENV !== 'production';

    if (!isAdmin && !isDev) {
      throw new ForbiddenException(
        'Operational metrics are restricted to administrators.',
      );
    }

    return this.thumbnailService.getHealthMetrics();
  }

  @Post(':id/share')
  async share(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.cvService.createShareLink(user.sub, id);
  }
}

function getDeviceFromUserAgent(userAgent?: string): string {
  if (!userAgent) return 'Unknown Device';
  const ua = userAgent.toLowerCase();
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  if (ua.includes('chrome') || ua.includes('chromium')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';

  return `${browser} on ${os}`;
}
