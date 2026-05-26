import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { AiGenerateDto, AiRewriteDto, AiScoreDto } from './dto/ai.dto';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AiProvider, PromptPayload } from './providers/ai-provider.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    @Inject('AiProvider') private aiProvider: AiProvider,
  ) {}

  async generate(supabaseId: string, dto: AiGenerateDto) {
    return this.runPrompt(
      supabaseId,
      'cv_generate',
      {
        system:
          'You are a CV generator. Return valid JSON. Keep output ATS-friendly and concise.',
        user: 'Generate a CV structure from the provided user profile and job description.',
        input: dto,
      },
      0.0,
    );
  }

  async rewrite(supabaseId: string, dto: AiRewriteDto) {
    return this.runPrompt(
      supabaseId,
      'cv_rewrite',
      {
        system:
          'You rewrite CV sections. Return valid JSON. Keep output ATS-friendly and consistent.',
        user: 'Rewrite the section to match the requested style.',
        input: dto,
      },
      0.4,
    );
  }

  async score(supabaseId: string, dto: AiScoreDto) {
    return this.runPrompt(
      supabaseId,
      'cv_score',
      {
        system: 'You score CV vs JD. Return JSON with score 0-100 and reasoning.',
        user: 'Score the CV content against the job description.',
        input: dto,
      },
      0.0,
    );
  }

  async keywords(supabaseId: string, dto: AiScoreDto) {
    return this.runPrompt(
      supabaseId,
      'cv_keywords',
      {
        system:
          'You extract keywords and missing skills. Return JSON with keywords and gaps.',
        user: 'Analyze CV content against job description for keywords and missing skills.',
        input: dto,
      },
      0.0,
    );
  }

  async analyzeJobDescription(supabaseId: string, jobDescription: string) {
    return this.runPrompt(
      supabaseId,
      'jd_analyze',
      {
        system:
          'You analyze job descriptions. Return JSON summary and required skills.',
        user: 'Analyze the job description for key requirements.',
        input: { jobDescription },
      },
      0.0,
    );
  }

  async generateStream(supabaseId: string, dto: AiGenerateDto, res: Response) {
    return this.streamPrompt(
      supabaseId,
      'cv_generate',
      {
        system:
          'You are a CV generator. Return valid JSON. Keep output ATS-friendly and concise.',
        user: 'Generate a CV structure from the provided user profile and job description.',
        input: dto,
      },
      res,
      0.0,
    );
  }

  async rewriteStream(supabaseId: string, dto: AiRewriteDto, res: Response) {
    return this.streamPrompt(
      supabaseId,
      'cv_rewrite',
      {
        system:
          'You rewrite CV sections. Return valid JSON. Keep output ATS-friendly and consistent.',
        user: 'Rewrite the section to match the requested style.',
        input: dto,
      },
      res,
      0.4,
    );
  }

  // ── Core AI Pipeline ──────────────────────────────────────────

  // ── Core AI Pipeline ──────────────────────────────────────────

  private async runPrompt(
    supabaseId: string,
    promptKey: string,
    payload: PromptPayload,
    temperature = 0.4,
  ) {
    const userId = await this.resolveUserId(supabaseId);
    await this.assertQuota(userId);
    await this.applySafetyRules(payload.input);

    const promptVersion = await this.getActivePrompt(promptKey, payload.system);
    const request = await this.prisma.aiRequest.create({
      data: { userId, promptKey, input: toInputJson(payload.input) },
    });

    const response = await this.aiProvider.generate(
      {
        system: promptVersion.content,
        user: payload.user,
        input: payload.input,
      },
      temperature,
    );

    await this.prisma.aiResponse.create({
      data: {
        requestId: request.id,
        output: toInputJson(response.output),
        tokens: response.tokens,
      },
    });
    await this.incrementUsage(userId, response.tokens);

    return response.output;
  }

  private async streamPrompt(
    supabaseId: string,
    promptKey: string,
    payload: PromptPayload,
    res: Response,
    temperature = 0.4,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const userId = await this.resolveUserId(supabaseId);
    await this.assertQuota(userId);
    await this.applySafetyRules(payload.input);

    const promptVersion = await this.getActivePrompt(promptKey, payload.system);
    const request = await this.prisma.aiRequest.create({
      data: { userId, promptKey, input: toInputJson(payload.input) },
    });

    const result = await this.aiProvider.stream(
      {
        system: promptVersion.content,
        user: payload.user,
        input: payload.input,
      },
      res,
      temperature,
    );

    await this.prisma.aiResponse.create({
      data: {
        requestId: request.id,
        output: toInputJson({ raw: result.text }),
        tokens: result.tokens,
      },
    });
    await this.incrementUsage(userId, result.tokens);

    res.write(`event: done\ndata: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }

  private async resolveUserId(supabaseId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) {
      throw new ForbiddenException('User not found');
    }
    return user.id;
  }

  private async getActivePrompt(key: string, fallback: string) {
    const prompt = await this.prisma.prompt.findUnique({ where: { key } });
    if (!prompt) {
      return this.prisma.promptVersion.create({
        data: {
          prompt: { create: { key } },
          version: 1,
          content: fallback,
          isActive: true,
        },
      });
    }
    const active = await this.prisma.promptVersion.findFirst({
      where: { promptId: prompt.id, isActive: true },
    });
    if (active) return active;
    return this.prisma.promptVersion.create({
      data: {
        promptId: prompt.id,
        version: 1,
        content: fallback,
        isActive: true,
      },
    });
  }

  private async applySafetyRules(input: unknown) {
    const rules = await this.prisma.safetyRule.findMany({
      where: { isActive: true },
    });
    if (rules.length === 0) return;
    const haystack = JSON.stringify(input ?? '').toLowerCase();
    for (const rule of rules) {
      try {
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(haystack)) {
          throw new ForbiddenException('Unsafe input detected');
        }
      } catch (e) {
        if (e instanceof ForbiddenException) throw e;
        continue;
      }
    }
  }

  private async assertQuota(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: { in: ['active', 'trialing'] } },
          include: { plan: true },
        },
      },
    });
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const planQuota =
      user.subscriptions[0]?.plan?.monthlyAiQuota ??
      (user.role === 'FREE' ? 2000 : 0);

    const periodStart = new Date();
    periodStart.setUTCDate(1);
    periodStart.setUTCHours(0, 0, 0, 0);
    const periodEnd = new Date(periodStart);
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);

    const quota = await this.prisma.usageQuota.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        periodStart,
        periodEnd,
        usedRequests: 0,
        usedTokens: 0,
      },
    });

    if (quota.usedTokens >= planQuota) {
      throw new ForbiddenException('AI quota exceeded');
    }
  }

  private async incrementUsage(userId: string, tokens: number) {
    await this.prisma.usageQuota.update({
      where: { userId },
      data: {
        usedTokens: { increment: tokens },
        usedRequests: { increment: 1 },
      },
    });
    await this.prisma.aiUsage.create({ data: { userId, tokens, requests: 1 } });
  }
}

// ── Utilities ─────────────────────────────────────────────────────

const safeJsonParse = (value: string): Record<string, unknown> => {
  try {
    return JSON.parse(value);
  } catch {
    return { raw: value };
  }
};

const toInputJson = (
  value: unknown,
): Prisma.InputJsonValue | Prisma.JsonNullValueInput => {
  if (value === undefined) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
};
