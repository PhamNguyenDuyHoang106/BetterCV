import { IsString } from "class-validator";

export class ExportDto {
  @IsString()
  cvId!: string;
}
