import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AiService } from './ai.service';
import {
  AiGenerateDto,
  AiRewriteDto,
  AiScoreDto,
  AiGithubAnalyzeDto,
} from './dto/ai.dto';
import { CurrentUser, JwtPayload, RequireFeature } from '../../core/decorators';
import { PolicyGuard } from '../../core/guards';
import { Feature } from '@acv/shared';

@UseGuards(AuthGuard('jwt'), PolicyGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('generate')
  async generate(@CurrentUser() user: JwtPayload, @Body() dto: AiGenerateDto) {
    return this.aiService.generate(user.sub, dto);
  }

  @Post('generate/stream')
  async generateStream(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AiGenerateDto,
    @Res() res: Response,
  ) {
    return this.aiService.generateStream(user.sub, dto, res);
  }

  @RequireFeature(Feature.AI_REWRITE)
  @Post('rewrite')
  async rewrite(@CurrentUser() user: JwtPayload, @Body() dto: AiRewriteDto) {
    return this.aiService.rewrite(user.sub, dto);
  }

  @RequireFeature(Feature.AI_REWRITE)
  @Post('rewrite/stream')
  async rewriteStream(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AiRewriteDto,
    @Res() res: Response,
  ) {
    return this.aiService.rewriteStream(user.sub, dto, res);
  }

  @Post('score')
  async score(@CurrentUser() user: JwtPayload, @Body() dto: AiScoreDto) {
    return this.aiService.score(user.sub, dto);
  }

  @Post('keywords')
  async keywords(@CurrentUser() user: JwtPayload, @Body() dto: AiScoreDto) {
    return this.aiService.keywords(user.sub, dto);
  }

  @Post('skills/suggest')
  async suggestSkills(
    @CurrentUser() user: JwtPayload,
    @Body()
    dto: { jobTitle: string; locale: 'en' | 'vi'; currentSkills?: string[] },
  ) {
    return this.aiService.suggestSkills(dto);
  }

  @RequireFeature(Feature.JD_OPTIMIZATION)
  @Post('jd/analyze')
  async analyzeJd(
    @CurrentUser() user: JwtPayload,
    @Body('jobDescription') jobDescription: string,
  ) {
    return this.aiService.analyzeJobDescription(user.sub, jobDescription);
  }

  @Post('github/analyze')
  async analyzeGithub(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AiGithubAnalyzeDto,
  ) {
    return this.aiService.analyzeGithubRepo(user.sub, dto.url, dto.locale);
  }
}
