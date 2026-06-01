import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AiService } from './ai.service';
import { AiGenerateDto, AiRewriteDto, AiScoreDto } from './dto/ai.dto';
import { CurrentUser, JwtPayload } from '../../core/decorators';

@UseGuards(AuthGuard('jwt'))
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

  @Post('rewrite')
  async rewrite(@CurrentUser() user: JwtPayload, @Body() dto: AiRewriteDto) {
    return this.aiService.rewrite(user.sub, dto);
  }

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

  @Post('jd/analyze')
  async analyzeJd(
    @CurrentUser() user: JwtPayload,
    @Body('jobDescription') jobDescription: string,
  ) {
    return this.aiService.analyzeJobDescription(user.sub, jobDescription);
  }
}
