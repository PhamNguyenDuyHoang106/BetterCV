import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AtsService } from "./ats.service";
import { CurrentUser, JwtPayload } from "../../core/decorators";
import { IsNotEmpty, IsString } from "class-validator";

export class AtsEvaluateDto {
  @IsString()
  @IsNotEmpty()
  cvId!: string;

  @IsString()
  @IsNotEmpty()
  jobDescription!: string;
}

@UseGuards(AuthGuard("jwt"))
@Controller("ats")
export class AtsController {
  constructor(private readonly atsService: AtsService) {}

  @Post("score")
  async evaluate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AtsEvaluateDto
  ) {
    return this.atsService.evaluateCv(user.sub, dto.cvId, dto.jobDescription);
  }
}
