import { IsIn, IsInt, IsObject, IsOptional, IsString } from 'class-validator';

const sectionTypes = [
  'PROFILE',
  'SUMMARY',
  'EXPERIENCE',
  'EDUCATION',
  'SKILLS',
  'PROJECTS',
] as const;

export class CvSectionUpsertDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsIn(sectionTypes)
  type!: (typeof sectionTypes)[number];

  @IsObject()
  content!: Record<string, unknown>;

  @IsInt()
  order!: number;

  @IsOptional()
  @IsInt()
  version?: number;
}
