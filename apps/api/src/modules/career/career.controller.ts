import { Body, Controller, Get, Param, Post, UseGuards, Res, Query, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CareerService } from './career.service';
import { CareerCoachService } from './career-coach.service';
import { CurrentUser, JwtPayload } from '../../core/decorators';
import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';

export class CreateRoadmapDto {
  @IsString()
  @IsNotEmpty()
  atsScanId!: string;

  @IsString()
  @IsNotEmpty()
  currentRole!: string;

  @IsString()
  @IsNotEmpty()
  targetRole!: string;
}

export class AddSkillToCvDto {
  @IsString()
  @IsNotEmpty()
  roadmapId!: string;

  @IsString()
  @IsNotEmpty()
  skillId!: string;
}

export class GenerateSkillBulletDto {
  @IsString()
  @IsNotEmpty()
  skillId!: string;

  @IsString()
  @IsNotEmpty()
  roadmapId!: string;
}

export class RescoreAtsDto {
  @IsString()
  @IsNotEmpty()
  roadmapId!: string;
}

export class CareerCoachChatDto {
  @IsString()
  @IsNotEmpty()
  roadmapId!: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsArray()
  @IsNotEmpty()
  messages!: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  roadmapId!: string;

  @IsString()
  @IsOptional()
  title?: string;
}

export class RenameSessionDto {
  @IsString()
  @IsNotEmpty()
  title!: string;
}

@UseGuards(AuthGuard('jwt'))
@Controller('career')
export class CareerController {
  constructor(
    private readonly careerService: CareerService,
    private readonly coachService: CareerCoachService,
  ) {}

  @Post('roadmap')
  async createRoadmap(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRoadmapDto,
  ) {
    return this.careerService.createRoadmap(user.sub, dto);
  }

  @Get('roadmaps')
  async listRoadmaps(@CurrentUser() user: JwtPayload) {
    return this.careerService.listRoadmaps(user.sub);
  }

  @Get('roadmap/:id')
  async getRoadmap(
    @CurrentUser() user: JwtPayload,
    @Param('id') roadmapId: string,
  ) {
    return this.careerService.getRoadmap(user.sub, roadmapId);
  }

  @Post('add-skill-to-cv')
  async addSkillToCv(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddSkillToCvDto,
  ) {
    return this.careerService.addSkillToCv(user.sub, dto);
  }

  @Post('generate-skill-bullet')
  async generateSkillBullet(
    @CurrentUser() user: JwtPayload,
    @Body() dto: GenerateSkillBulletDto,
  ) {
    return this.careerService.generateSkillBullet(user.sub, dto);
  }

  @Post('rescore-ats')
  async rescoreAts(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RescoreAtsDto,
  ) {
    return this.careerService.rescoreAts(user.sub, dto);
  }

  @Throttle({ coach: { limit: 10, ttl: 60000 } })
  @Post('coach-chat')
  async coachChat(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CareerCoachChatDto,
    @Res({ passthrough: false }) res: Response,
  ) {
    return this.coachService.streamCoachChat(user.sub, dto, res);
  }

  @Get('coach/sessions/:roadmapId')
  async listCoachSessions(
    @CurrentUser() user: JwtPayload,
    @Param('roadmapId') roadmapId: string,
  ) {
    return this.coachService.listSessions(user.sub, roadmapId);
  }

  @Post('coach/session/:id/archive')
  async archiveCoachSession(
    @CurrentUser() user: JwtPayload,
    @Param('id') sessionId: string,
  ) {
    return this.coachService.archiveSession(user.sub, sessionId);
  }

  @Post('coach/session')
  async createSession(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSessionDto,
  ) {
    return this.coachService.createNewSession(user.sub, dto);
  }

  @Patch('coach/session/:id')
  async renameSession(
    @CurrentUser() user: JwtPayload,
    @Param('id') sessionId: string,
    @Body() dto: RenameSessionDto,
  ) {
    return this.coachService.renameSession(user.sub, sessionId, dto.title);
  }

  @Get('coach/session/:id/messages')
  async getSessionMessages(
    @CurrentUser() user: JwtPayload,
    @Param('id') sessionId: string,
    @Query('beforeTimestamp') beforeTimestamp?: string,
  ) {
    return this.coachService.getSessionMessages(user.sub, sessionId, beforeTimestamp);
  }

  @Get('coach/search')
  async searchConversations(
    @CurrentUser() user: JwtPayload,
    @Query('roadmapId') roadmapId: string,
    @Query('query') query: string,
  ) {
    return this.coachService.searchMessages(user.sub, roadmapId, query);
  }

  @Get('coach/analytics/:roadmapId')
  async getCoachAnalytics(
    @CurrentUser() user: JwtPayload,
    @Param('roadmapId') roadmapId: string,
  ) {
    return this.coachService.getCoachAnalytics(user.sub, roadmapId);
  }
}

