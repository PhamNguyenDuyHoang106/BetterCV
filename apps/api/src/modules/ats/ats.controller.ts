import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AtsService } from './ats.service';
import { CurrentUser, JwtPayload, RequireQuota } from '../../core/decorators';
import { PolicyGuard } from '../../core/guards';
import { QuotaKey } from '@acv/shared';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Throttle } from '@nestjs/throttler';

export class AtsEvaluateDto {
  @IsString()
  @IsNotEmpty()
  cvId!: string;

  @IsString()
  @IsNotEmpty()
  jobDescription!: string;

  @IsString()
  @IsOptional()
  locale?: string;
}

@UseGuards(AuthGuard('jwt'), PolicyGuard)
@Controller('ats')
export class AtsController {
  constructor(private readonly atsService: AtsService) {}

  @RequireQuota(QuotaKey.MAX_DAILY_ATS)
  @Throttle({ ats: { limit: 5, ttl: 60000 } })
  @Post('score')
  async evaluate(@CurrentUser() user: JwtPayload, @Body() dto: AtsEvaluateDto) {
    return this.atsService.evaluateCv(
      user.sub,
      dto.cvId,
      dto.jobDescription,
      dto.locale,
    );
  }
}
