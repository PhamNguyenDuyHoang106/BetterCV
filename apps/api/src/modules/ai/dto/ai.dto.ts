import { IsIn, IsObject, IsOptional, IsString } from "class-validator";

export class AiGenerateDto {
  @IsIn(["en", "vi"])
  locale!: "en" | "vi";

  @IsObject()
  userProfile!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  jobDescription?: string;
}

export class AiRewriteDto {
  @IsIn(["en", "vi"])
  locale!: "en" | "vi";

  @IsString()
  sectionType!: string;

  @IsObject()
  content!: Record<string, unknown>;

  @IsIn(["professional", "concise", "ats"])
  style!: "professional" | "concise" | "ats";
}

export class AiScoreDto {
  @IsIn(["en", "vi"])
  locale!: "en" | "vi";

  @IsObject()
  cvContent!: Record<string, unknown>;

  @IsString()
  jobDescription!: string;
}
