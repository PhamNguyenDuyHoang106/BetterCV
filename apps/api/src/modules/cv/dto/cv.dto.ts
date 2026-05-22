import { IsIn, IsOptional, IsString } from 'class-validator';

export class CvCreateDto {
  @IsString()
  title!: string;

  @IsIn(['en', 'vi'])
  locale!: 'en' | 'vi';

  @IsOptional()
  @IsString()
  templateId?: string;
}

export class CvUpdateDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsIn(['en', 'vi'])
  locale?: 'en' | 'vi';

  @IsOptional()
  @IsString()
  templateId?: string;
}
