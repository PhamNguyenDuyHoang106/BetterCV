import { IsBoolean, IsString, IsObject, IsArray, IsOptional, IsNumber } from 'class-validator';

export class PlanDto {
  @IsString()
  tier!: string;

  @IsString()
  displayName!: string;
}

export class WatermarkDto {
  @IsBoolean()
  enabled!: boolean;

  @IsString()
  text!: string;
}

export class RenderingDto {
  @IsObject()
  watermark!: WatermarkDto;
}

export class QuotaDto {
  @IsNumber()
  @IsOptional()
  limit!: number | null;

  @IsNumber()
  used!: number;

  @IsNumber()
  @IsOptional()
  remaining!: number | null;

  @IsBoolean()
  unlimited!: boolean;

  @IsBoolean()
  exhausted!: boolean;

  @IsString()
  @IsOptional()
  lastReset!: string | null;

  @IsObject()
  @IsOptional()
  metadata!: Record<string, any> | null;
}

export class EntitlementResponseDto {
  @IsString()
  policyVersion!: string;

  @IsString()
  serverTime!: string;

  @IsObject()
  plan!: PlanDto;

  @IsObject()
  rendering!: RenderingDto;

  @IsArray()
  @IsString({ each: true })
  features!: string[];

  @IsObject()
  quotas!: Record<string, QuotaDto>;
}
