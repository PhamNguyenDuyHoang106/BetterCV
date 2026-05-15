import { ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { AiGenerateDto, AiRewriteDto, AiScoreDto } from "./dto/ai.dto";
import { Response } from "express";
import { Prisma } from "@prisma/client";

type PromptPayload = {
  system: string;
  user: string;
  input: unknown;
};

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async generate(userId: string, dto: AiGenerateDto) {
    return this.runPrompt(userId, "cv_generate", {
      system:
        "You are a CV generator. Return valid JSON. Keep output ATS-friendly and concise.",
      user: "Generate a CV structure from the provided user profile and job description.",
      input: dto
    });
  }

  async rewrite(userId: string, dto: AiRewriteDto) {
    return this.runPrompt(userId, "cv_rewrite", {
      system:
        "You rewrite CV sections. Return valid JSON. Keep output ATS-friendly and consistent.",
      user: "Rewrite the section to match the requested style.",
      input: dto
    });
  }

  async score(userId: string, dto: AiScoreDto) {
    return this.runPrompt(userId, "cv_score", {
      system: "You score CV vs JD. Return JSON with score 0-100 and reasoning.",
      user: "Score the CV content against the job description.",
      input: dto
    });
  }

  async keywords(userId: string, dto: AiScoreDto) {
    return this.runPrompt(userId, "cv_keywords", {
      system:
        "You extract keywords and missing skills. Return JSON with keywords and gaps.",
      user: "Analyze CV content against job description for keywords and missing skills.",
      input: dto
    });
  }

  async analyzeJobDescription(userId: string, jobDescription: string) {
    return this.runPrompt(userId, "jd_analyze", {
      system: "You analyze job descriptions. Return JSON summary and required skills.",
      user: "Analyze the job description for key requirements.",
      input: { jobDescription }
    });
  }

  async generateStream(userId: string, dto: AiGenerateDto, res: Response) {
    return this.streamPrompt(userId, "cv_generate", {
      system:
        "You are a CV generator. Return valid JSON. Keep output ATS-friendly and concise.",
      user: "Generate a CV structure from the provided user profile and job description.",
      input: dto
    }, res);
  }

  async rewriteStream(userId: string, dto: AiRewriteDto, res: Response) {
    return this.streamPrompt(userId, "cv_rewrite", {
      system:
        "You rewrite CV sections. Return valid JSON. Keep output ATS-friendly and consistent.",
      user: "Rewrite the section to match the requested style.",
      input: dto
    }, res);
  }

  private async runPrompt(userId: string, promptKey: string, payload: PromptPayload) {
    await this.assertQuota(userId);
    await this.applySafetyRules(payload.input);
    const promptVersion = await this.getActivePrompt(promptKey, payload.system);
    const request = await this.prisma.aiRequest.create({
      data: {
        userId,
        promptKey,
        input: toInputJson(payload.input)
      }
    });
    const response = await this.callModel({
      system: promptVersion.content,
      user: payload.user,
      input: payload.input
    });
    await this.prisma.aiResponse.create({
      data: {
        requestId: request.id,
        output: toInputJson(response.output),
        tokens: response.tokens
      }
    });
    await this.incrementUsage(userId, response.tokens);
    return response.output;
  }

  private async streamPrompt(
    userId: string,
    promptKey: string,
    payload: PromptPayload,
    res: Response
  ) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    await this.assertQuota(userId);
    await this.applySafetyRules(payload.input);
    const promptVersion = await this.getActivePrompt(promptKey, payload.system);
    const request = await this.prisma.aiRequest.create({
      data: {
        userId,
        promptKey,
        input: toInputJson(payload.input)
      }
    });

    const result = await this.callModelStream({
      system: promptVersion.content,
      user: payload.user,
      input: payload.input
    }, res);

    await this.prisma.aiResponse.create({
      data: {
        requestId: request.id,
        output: toInputJson({ raw: result.text }),
        tokens: result.tokens
      }
    });
    await this.incrementUsage(userId, result.tokens);
    res.write(`event: done\ndata: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }

  private async callModel(payload: PromptPayload) {
    const baseUrl = this.config.get<string>("OPENAI_BASE_URL");
    const apiKey = this.config.get<string>("OPENAI_API_KEY");
    if (!baseUrl || !apiKey) {
      throw new ForbiddenException("AI provider not configured");
    }
    const body = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: payload.system },
        {
          role: "user",
          content: `${payload.user}\n\nINPUT:\n${JSON.stringify(payload.input)}`
        }
      ],
      temperature: 0.4
    };
    const result = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
    if (!result.ok) {
      throw new ForbiddenException("AI request failed");
    }
    const json = await result.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    const tokens = json.usage?.total_tokens ?? 0;
    return { output: safeJsonParse(content), tokens };
  }

  private async callModelStream(payload: PromptPayload, res: Response) {
    const baseUrl = this.config.get<string>("OPENAI_BASE_URL");
    const apiKey = this.config.get<string>("OPENAI_API_KEY");
    if (!baseUrl || !apiKey) {
      throw new ForbiddenException("AI provider not configured");
    }
    const body = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: payload.system },
        {
          role: "user",
          content: `${payload.user}\n\nINPUT:\n${JSON.stringify(payload.input)}`
        }
      ],
      temperature: 0.4,
      stream: true,
      stream_options: { include_usage: true }
    };
    const result = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
    if (!result.ok || !result.body) {
      throw new ForbiddenException("AI request failed");
    }
    const reader = result.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";
    let totalTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) {
          continue;
        }
        const data = line.slice(6).trim();
        if (data === "[DONE]") {
          continue;
        }
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            fullText += delta;
            res.write(`data: ${delta}\n\n`);
          }
          if (parsed.usage?.total_tokens) {
            totalTokens = parsed.usage.total_tokens;
          }
        } catch {
          continue;
        }
      }
    }

    return { text: fullText, tokens: totalTokens || 0 };
  }

  private async getActivePrompt(key: string, fallback: string) {
    const prompt = await this.prisma.prompt.findUnique({ where: { key } });
    if (!prompt) {
      return this.prisma.promptVersion.create({
        data: {
          prompt: { create: { key } },
          version: 1,
          content: fallback,
          isActive: true
        }
      });
    }
    const active = await this.prisma.promptVersion.findFirst({
      where: { promptId: prompt.id, isActive: true }
    });
    if (active) {
      return active;
    }
    return this.prisma.promptVersion.create({
      data: {
        promptId: prompt.id,
        version: 1,
        content: fallback,
        isActive: true
      }
    });
  }

  private async applySafetyRules(input: unknown) {
    const rules = await this.prisma.safetyRule.findMany({
      where: { isActive: true }
    });
    if (rules.length === 0) {
      return;
    }
    const haystack = normalize(input);
    for (const rule of rules) {
      try {
        const regex = new RegExp(rule.pattern, "i");
        if (regex.test(haystack)) {
          throw new ForbiddenException("Unsafe input detected");
        }
      } catch {
        continue;
      }
    }
  }

  private async assertQuota(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: { in: ["active", "trialing"] } },
          include: { plan: true }
        }
      }
    });
    if (!user) {
      throw new ForbiddenException("User not found");
    }
    const planQuota =
      user.subscriptions[0]?.plan?.monthlyAiQuota ?? (user.role === "FREE" ? 2000 : 0);
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
        usedTokens: 0
      }
    });
    if (quota.usedTokens >= planQuota) {
      throw new ForbiddenException("AI quota exceeded");
    }
  }

  private async incrementUsage(userId: string, tokens: number) {
    await this.prisma.usageQuota.update({
      where: { userId },
      data: {
        usedTokens: { increment: tokens },
        usedRequests: { increment: 1 }
      }
    });
    await this.prisma.aiUsage.create({ data: { userId, tokens, requests: 1 } });
  }
}

const safeJsonParse = (value: string): Record<string, unknown> => {
  try {
    return JSON.parse(value);
  } catch {
    return { raw: value };
  }
};

const normalize = (value: unknown) => JSON.stringify(value ?? "").toLowerCase();

const toInputJson = (
  value: unknown
): Prisma.InputJsonValue | Prisma.JsonNullValueInput => {
  if (value === undefined) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
};
