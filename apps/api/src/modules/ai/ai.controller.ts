import { Body, Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request, Response } from "express";
import { AiService } from "./ai.service";
import { AiGenerateDto, AiRewriteDto, AiScoreDto } from "./dto/ai.dto";

@UseGuards(AuthGuard("jwt"))
@Controller("ai")
export class AiController {
  constructor(private aiService: AiService) {}

  @Post("generate")
  async generate(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: AiGenerateDto
  ) {
    return this.aiService.generate(req.user.sub, dto);
  }

  @Post("generate/stream")
  async generateStream(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: AiGenerateDto,
    @Res() res: Response
  ) {
    return this.aiService.generateStream(req.user.sub, dto, res);
  }

  @Post("rewrite")
  async rewrite(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: AiRewriteDto
  ) {
    return this.aiService.rewrite(req.user.sub, dto);
  }

  @Post("rewrite/stream")
  async rewriteStream(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: AiRewriteDto,
    @Res() res: Response
  ) {
    return this.aiService.rewriteStream(req.user.sub, dto, res);
  }

  @Post("score")
  async score(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: AiScoreDto
  ) {
    return this.aiService.score(req.user.sub, dto);
  }

  @Post("keywords")
  async keywords(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: AiScoreDto
  ) {
    return this.aiService.keywords(req.user.sub, dto);
  }

  @Post("jd/analyze")
  async analyzeJd(
    @Req() req: Request & { user: { sub: string } },
    @Body("jobDescription") jobDescription: string
  ) {
    return this.aiService.analyzeJobDescription(req.user.sub, jobDescription);
  }
}
