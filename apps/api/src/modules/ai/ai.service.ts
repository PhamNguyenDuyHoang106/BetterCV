import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { AiGenerateDto, AiRewriteDto, AiScoreDto } from './dto/ai.dto';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AiProvider, PromptPayload } from './providers/ai-provider.interface';
import { Cron, CronExpression } from '@nestjs/schedule';

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
    if (dto.sectionType === 'SUMMARY') {
      const detectedLocale = this.detectLanguage(
        (dto.resumeContext?.jobTitle as string) || '',
        dto.locale,
      );
      const promptKey = `cv_summary_${dto.style}_${detectedLocale}`;
      const systemPrompt = this.getSummarySystemPrompt(
        dto.style,
        detectedLocale,
      );
      const contextText = this.buildResumeContextText(
        dto.resumeContext,
        detectedLocale,
      );

      const userPrompt = `Generate a customized, professional resume summary now using the following context:\n\n${contextText}\n\nOriginal draft text (use for reference/style only, do not copy verbatim): ${((dto.content as any)?.text as string) || ''}`;

      const output = await this.runPrompt(
        supabaseId,
        promptKey,
        {
          system: systemPrompt,
          user: userPrompt,
          input: dto,
        },
        0.5,
      );

      let cleanedOutput =
        typeof output === 'string'
          ? output
          : (output as any).text || (output as any).raw || '';
      cleanedOutput = this.postValidateAndCleanSummary(cleanedOutput);
      return { text: cleanedOutput };
    }

    const output = await this.runPrompt(
      supabaseId,
      'cv_rewrite',
      {
        system:
          'You are an expert CV enhancer. Your task is to rewrite and optimize CV sections to make them polished and ATS-friendly. ' +
          'CRITICAL: Return ONLY the rewritten plain text. Never return JSON, never wrap in markdown code blocks, and never include any conversational filler. Just the polished plain text.',
        user:
          'Read the INPUT JSON which contains the CV section data and the target style. ' +
          'Extract the text content (either from "text" or "description" field), rewrite it to fit the requested "style" and "locale", ' +
          'and output ONLY the resulting plain text. Do NOT output any JSON structure.',
        input: dto,
      },
      0.4,
    );

    const cleanedOutput =
      typeof output === 'string'
        ? output
        : (output as any).text || (output as any).raw || '';
    return { text: cleanedOutput };
  }

  async score(supabaseId: string, dto: AiScoreDto) {
    return this.runPrompt(
      supabaseId,
      'cv_score',
      {
        system:
          'You score CV vs JD. Return JSON with score 0-100 and reasoning.',
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
    if (dto.sectionType === 'SUMMARY') {
      const detectedLocale = this.detectLanguage(
        (dto.resumeContext?.jobTitle as string) || '',
        dto.locale,
      );
      const promptKey = `cv_summary_${dto.style}_${detectedLocale}`;
      const systemPrompt = this.getSummarySystemPrompt(
        dto.style,
        detectedLocale,
      );
      const contextText = this.buildResumeContextText(
        dto.resumeContext,
        detectedLocale,
      );

      const userPrompt = `Generate a customized, professional resume summary now using the following context:\n\n${contextText}\n\nOriginal draft text (use for reference/style only, do not copy verbatim): ${((dto.content as any)?.text as string) || ''}`;

      return this.streamPrompt(
        supabaseId,
        promptKey,
        {
          system: systemPrompt,
          user: userPrompt,
          input: dto,
        },
        res,
        0.5,
      );
    }

    return this.streamPrompt(
      supabaseId,
      'cv_rewrite',
      {
        system:
          'You are an expert CV enhancer. Your task is to rewrite and optimize CV sections to make them polished and ATS-friendly. ' +
          'CRITICAL: Return ONLY the rewritten plain text. Never return JSON, never wrap in markdown code blocks, and never include any conversational filler. Just the polished plain text.',
        user:
          'Read the INPUT JSON which contains the CV section data and the target style. ' +
          'Extract the text content (either from "text" or "description" field), rewrite it to fit the requested "style" and "locale", ' +
          'and output ONLY the resulting plain text. Do NOT output any JSON structure.',
        input: dto,
      },
      res,
      0.4,
    );
  }

  // ── Core AI Pipeline ──────────────────────────────────────────

  private async runPrompt(
    supabaseId: string,
    promptKey: string,
    payload: PromptPayload,
    temperature = 0.4,
  ) {
    const userId = await this.resolveUserId(supabaseId);
    await this.applySafetyRules(payload.input);

    const promptVersion = await this.getActivePrompt(promptKey, payload.system);

    // 1. Ước lượng tokens và thực hiện Atomic Quota Update (Tạm tính)
    const estimated = this.estimateTokens({
      system: promptVersion.content,
      user: payload.user,
      input: payload.input,
    });
    await this.assertAndReserveQuota(userId, estimated);

    const request = await this.prisma.aiRequest.create({
      data: {
        userId,
        promptKey,
        input: toInputJson(payload.input),
        estimatedTokens: estimated,
        status: 'PENDING',
      },
    });

    try {
      // Chuyển sang trạng thái PROCESSING trước khi gọi OpenAI
      await this.prisma.aiRequest.update({
        where: { id: request.id },
        data: { status: 'PROCESSING' },
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

      // 2. Reconciliation: Điều chỉnh lại quota theo số lượng thực tế
      await this.reconcileQuotaUsage(
        userId,
        response.tokens,
        estimated,
        request.id,
      );

      return response.output;
    } catch (err: any) {
      // 3. Hoàn trả lượng quota tạm tính nếu thất bại
      await this.refundQuotaUsage(userId, estimated, request.id);
      this.logger.error(`AI prompt generation failed: ${err.message}`);
      throw err;
    }
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
    await this.applySafetyRules(payload.input);

    const promptVersion = await this.getActivePrompt(promptKey, payload.system);

    // 1. Ước lượng tokens và thực hiện Atomic Quota Update (Tạm tính)
    const estimated = this.estimateTokens({
      system: promptVersion.content,
      user: payload.user,
      input: payload.input,
    });
    await this.assertAndReserveQuota(userId, estimated);

    const request = await this.prisma.aiRequest.create({
      data: {
        userId,
        promptKey,
        input: toInputJson(payload.input),
        estimatedTokens: estimated,
        status: 'PENDING',
      },
    });

    try {
      // Chuyển sang trạng thái PROCESSING trước khi bắt đầu stream OpenAI
      await this.prisma.aiRequest.update({
        where: { id: request.id },
        data: { status: 'PROCESSING' },
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

      // 2. Reconciliation: Điều chỉnh lại quota theo số lượng thực tế
      await this.reconcileQuotaUsage(
        userId,
        result.tokens,
        estimated,
        request.id,
      );

      res.write(`event: done\ndata: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err: any) {
      // 3. Hoàn trả lượng quota tạm tính nếu thất bại
      await this.refundQuotaUsage(userId, estimated, request.id);
      this.logger.error(`AI prompt streaming failed: ${err.message}`);
      res.write(
        `event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`,
      );
      res.end();
    }
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

  private estimateTokens(payload: PromptPayload): number {
    const text =
      JSON.stringify(payload.input || '') +
      (payload.system || '') +
      (payload.user || '');
    // Ước lượng an toàn: characters * 0.8, tối thiểu 500 tokens
    return Math.max(500, Math.ceil(text.length * 0.8));
  }

  private async assertAndReserveQuota(userId: string, estimatedTokens: number) {
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
      (user.role === 'FREE' ? 500000 : 0);

    const periodStart = new Date();
    periodStart.setUTCDate(1);
    periodStart.setUTCHours(0, 0, 0, 0);
    const periodEnd = new Date(periodStart);
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);

    const existingQuota = await this.prisma.usageQuota.findUnique({
      where: { userId },
    });

    const now = new Date();
    if (!existingQuota) {
      await this.prisma.usageQuota.create({
        data: {
          userId,
          periodStart,
          periodEnd,
          usedRequests: 0,
          usedTokens: 0,
        },
      });
    } else if (now >= existingQuota.periodEnd) {
      await this.prisma.usageQuota.update({
        where: { userId },
        data: {
          periodStart,
          periodEnd,
          usedRequests: 0,
          usedTokens: 0,
        },
      });
    }

    // Thực hiện Conditional Update nguyên tử có kiểm tra giới hạn trên database
    const affectedRows = await this.prisma.$executeRaw`
      UPDATE "UsageQuota"
      SET "usedTokens" = "usedTokens" + ${estimatedTokens},
          "usedRequests" = "usedRequests" + 1,
          "updatedAt" = NOW()
      WHERE "userId" = ${userId}
        AND "usedTokens" + ${estimatedTokens} <= ${planQuota}
    `;

    if (affectedRows === 0) {
      throw new ForbiddenException('AI quota exceeded or system busy');
    }
  }

  private async reconcileQuotaUsage(
    userId: string,
    actualTokens: number,
    estimatedTokens: number,
    requestId?: string,
  ) {
    if (requestId) {
      const request = await this.prisma.aiRequest.findUnique({
        where: { id: requestId },
        select: { status: true },
      });
      if (request && request.status === 'REFUNDED') {
        this.logger.warn(
          `AI Request ${requestId} was already REFUNDED by sweeper. Skipping reconciliation to prevent double adjustment.`,
        );
        return;
      }
    }

    const diff = actualTokens - estimatedTokens;
    const actions: any[] = [
      this.prisma.usageQuota.update({
        where: { userId },
        data: {
          usedTokens: { increment: diff },
        },
      }),
      this.prisma.aiUsage.create({
        data: { userId, tokens: actualTokens, requests: 1 },
      }),
    ];

    if (requestId) {
      actions.push(
        this.prisma.aiRequest.update({
          where: { id: requestId },
          data: { status: 'COMPLETED' },
        }),
      );
    }

    await this.prisma.$transaction(actions);
  }

  private async refundQuotaUsage(
    userId: string,
    estimatedTokens: number,
    requestId?: string,
  ) {
    try {
      if (requestId) {
        const request = await this.prisma.aiRequest.findUnique({
          where: { id: requestId },
          select: { status: true },
        });
        if (request && request.status === 'REFUNDED') {
          this.logger.log(
            `AI Request ${requestId} is already REFUNDED. Skipping double refund.`,
          );
          return;
        }
      }

      const actions: any[] = [
        this.prisma.usageQuota.update({
          where: { userId },
          data: {
            usedTokens: { decrement: estimatedTokens },
            usedRequests: { decrement: 1 },
          },
        }),
      ];

      if (requestId) {
        actions.push(
          this.prisma.aiRequest.update({
            where: { id: requestId },
            data: { status: 'REFUNDED' },
          }),
        );
      }

      await this.prisma.$transaction(actions);
    } catch (err: any) {
      this.logger.error(
        `Failed to refund quota for user ${userId}: ${err.message}`,
      );
    }
  }

  async suggestSkills(dto: {
    jobTitle: string;
    locale: 'en' | 'vi';
    currentSkills?: string[];
  }) {
    const detectedLocale = this.detectLanguage(dto.jobTitle, dto.locale);
    const langInstructions =
      detectedLocale === 'vi'
        ? 'Return the skills in VIETNAMESE (Tiếng Việt).'
        : 'Return the skills in ENGLISH.';

    const currentSkillsStr =
      Array.isArray(dto.currentSkills) && dto.currentSkills.length > 0
        ? `The user already has the following skills: "${dto.currentSkills.join(', ')}".`
        : '';

    const systemPrompt = `You are an expert resume assistant and skill taxonomist.
Your task is to generate 4-6 highly relevant professional skills for the job title provided by the user.

RULES:
1. ${langInstructions}
2. Output ONLY a valid JSON array of strings representing the skill names (containing exactly 4-6 elements).
3. Keep skill names professional, clean, and concise (e.g. "React", "Database Design", "Project Management").
4. Never include any formatting, markdown wrapping (like \`\`\`json), or conversational filler. Just the raw JSON array.
5. ${currentSkillsStr} AT LEAST 2 of the suggested skills in your output array MUST NOT be present in the user's current skills. You can include some existing skills if they are highly relevant, but at least 2 must be completely new.`;

    const userPrompt = `Generate 4-6 skill suggestions for job title: "${dto.jobTitle}"`;

    const output = await this.aiProvider.generate(
      {
        system: systemPrompt,
        user: userPrompt,
        input: { jobTitle: dto.jobTitle },
      },
      0.2,
    );

    let parsed: string[] = [];
    try {
      this.logger.log(`Raw suggested skills output: ${JSON.stringify(output)}`);
      const content = output?.output;

      if (Array.isArray(content)) {
        parsed = content;
      } else if (content && typeof content === 'object') {
        if (Array.isArray((content as any).raw)) {
          parsed = (content as any).raw;
        } else if (typeof (content as any).raw === 'string') {
          let cleanStr = (content as any).raw.trim();
          if (cleanStr.startsWith('```')) {
            cleanStr = cleanStr
              .replace(/^```(json)?/i, '')
              .replace(/```$/i, '')
              .trim();
          }
          parsed = JSON.parse(cleanStr);
        } else {
          parsed =
            (content as any).skills ||
            (Object.values(content).filter(
              (v) => typeof v === 'string',
            ) as string[]);
        }
      } else if (typeof content === 'string') {
        let cleanStr = content.trim();
        if (cleanStr.startsWith('```')) {
          cleanStr = cleanStr
            .replace(/^```(json)?/i, '')
            .replace(/```$/i, '')
            .trim();
        }
        parsed = JSON.parse(cleanStr);
      }

      if (!Array.isArray(parsed)) parsed = [];
    } catch (e) {
      this.logger.error('Failed to parse suggested skills JSON:', e);
      // fallback
      parsed =
        detectedLocale === 'vi'
          ? ['Lập trình', 'Giải quyết vấn đề', 'Làm việc nhóm', 'Giao tiếp']
          : ['Programming', 'Problem Solving', 'Teamwork', 'Communication'];
    }

    return parsed;
  }

  private detectLanguage(
    jobTitle: string,
    defaultLocale: 'en' | 'vi',
  ): 'en' | 'vi' {
    if (!jobTitle) return defaultLocale;
    const lowercaseTitle = jobTitle.toLowerCase();

    // 1. Strict Vietnamese diacritics check (includes "ĩ" in "kĩ sư", "đ" in "giám đốc", etc.)
    const hasViDiacritics =
      /[áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]/i.test(
        lowercaseTitle,
      );
    if (hasViDiacritics) return 'vi';

    // 2. Keyword check fallback (handling i/y spelling variations)
    const viKeywords = [
      'kỹ sư',
      'kĩ sư',
      'lập trình viên',
      'nhân viên',
      'chuyên viên',
      'quản lý',
      'giám đốc',
      'thiết kế',
      'kế toán',
      'trưởng phòng',
      'thực tập sinh',
      'phát triển',
    ];
    const isVietnameseKeyword = viKeywords.some((keyword) =>
      lowercaseTitle.includes(keyword),
    );

    return isVietnameseKeyword ? 'vi' : 'en';
  }

  private getSummarySystemPrompt(
    style: 'professional' | 'concise' | 'ats',
    locale: 'en' | 'vi',
  ): string {
    const langRule =
      locale === 'vi'
        ? 'CRITICAL: The output summary MUST be written 100% in VIETNAMESE (Tiếng Việt). Translate all English inputs, job titles, fields of study, and concepts to Vietnamese naturally (e.g. translate "Software Engineer" to "Kỹ sư phần mềm", "BSc in Computer Science" to "Cử nhân Khoa học máy tính", "from FPT University" to "từ Đại học FPT"). The final output must be pure Vietnamese with absolutely no English words, except for universally accepted technical proper nouns like "React", "NestJS", "PostgreSQL", or standard proper company names like "FPT Software".'
        : 'CRITICAL: The output summary MUST be written 100% in ENGLISH. Translate all Vietnamese inputs, names of universities, locations, companies, and academic major fields to English naturally (e.g. translate "Trường đại học FPT" to "FPT University", "Công nghệ thông tin" to "Information Technology", "Hà Nội" to "Hanoi"). The final output must be pure, polished English with absolutely no Vietnamese words or accents, except for standard proper company names if required.';

    const basePrompt = `You are an expert professional CV consultant and elite resume writer.
Your task is to generate a custom, high-impact resume summary based ONLY on the provided Resume Context.

RULES:
1. ${langRule}
2. Never invent or hallucinate metrics, percentages, dollar amounts, revenue figures, or exact years of experience not explicitly given in the context.
3. Never use generic placeholders like "[Your Industry]", "[Technology]", "[Skill]", or similar under any circumstances.
4. Only use information directly derived from the provided Resume Context (Job Title, Skills, Experience, Education, Projects).
5. If some sections or details are missing, write a natural, coherent summary without mentioning or apologizing for the missing data.
6. Return ONLY the final polished summary plain text. Do not wrap in quotes, do not include any introductions, conversational filler, markdown formatting (like bullet points or bold markers), or notes.`;

    if (style === 'concise') {
      return `${basePrompt}

MODE: Concise (Short)
Specific Requirements:
- Keep the summary extremely concise, with a maximum length of 30-50 words (or 2-3 sentences).
- Mention the target Job Title and highlight the strongest technical/professional skill area.
- No bullet points, just one cohesive paragraph.`;
    }

    if (style === 'ats') {
      return `${basePrompt}

MODE: ATS Optimized
Specific Requirements:
- Optimize the summary to be highly keyword-rich and ATS-friendly.
- Naturally embed the exact Job Title, core skills, and primary technologies listed.
- Use strong action verbs and ATS-friendly phrasing.
- Avoid generic buzzwords and do not use first-person pronouns (like "I", "me", "my", "tôi").
- Keep the length between 80-120 words.`;
    }

    // Default 'professional' style
    return `${basePrompt}

MODE: Balanced & Professional
Specific Requirements:
- Generate a balanced, formal, and engaging summary that is highly human-readable.
- Keep the length between 60-100 words.
- Highlight core expertise, key achievements, and professional strengths naturally.`;
  }

  private buildResumeContextText(context: any, _locale: 'en' | 'vi'): string {
    if (!context) return '';

    const lines: string[] = [];

    if (context.jobTitle) {
      lines.push(`JOB TITLE: ${context.jobTitle}`);
    }

    if (Array.isArray(context.skills) && context.skills.length > 0) {
      const skillNames = context.skills
        .map((s: any) => (typeof s === 'string' ? s : s.name))
        .filter(Boolean)
        .join(', ');
      lines.push(`SKILLS/TECHNOLOGIES: ${skillNames}`);
    }

    if (Array.isArray(context.experiences) && context.experiences.length > 0) {
      lines.push('EXPERIENCE:');
      context.experiences.forEach((exp: any, index: number) => {
        const title = exp.position || exp.role || '';
        const company = exp.company || '';
        const desc = exp.description || '';
        lines.push(`  - Job ${index + 1}: ${title} at ${company}`);
        if (desc) {
          lines.push(`    Details: ${desc}`);
        }
      });
    }

    if (Array.isArray(context.educations) && context.educations.length > 0) {
      lines.push('EDUCATION:');
      context.educations.forEach((edu: any) => {
        const degree = edu.degree || '';
        const inst = edu.institution || '';
        const field = edu.fieldOfStudy || '';
        lines.push(`  - ${degree} in ${field} from ${inst}`);
      });
    }

    if (Array.isArray(context.projects) && context.projects.length > 0) {
      lines.push('PROJECTS:');
      context.projects.forEach((proj: any) => {
        const name = proj.name || '';
        const role = proj.role || '';
        const desc = proj.description || '';
        lines.push(`  - Project: ${name} (${role})`);
        if (desc) {
          lines.push(`    Details: ${desc}`);
        }
      });
    }

    return lines.join('\n');
  }

  private postValidateAndCleanSummary(text: string): string {
    if (!text) return '';
    let cleaned = text.trim();

    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.substring(1, cleaned.length - 1);
    }

    cleaned = cleaned.replace(/\[Your\s+[^\]]+\]/gi, '');
    cleaned = cleaned.replace(/\[Industry\/Field\]/gi, '');
    cleaned = cleaned.replace(/\[specific\s+skills[^\]]*\]/gi, '');
    cleaned = cleaned.replace(/\[technology\]/gi, '');
    cleaned = cleaned.replace(/\[skills\]/gi, '');
    cleaned = cleaned.replace(/\[Job\s+Title\]/gi, '');

    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/,\s*,/g, ',');

    return cleaned.trim();
  }

  private async getActivePrompt(key: string, defaultContent: string) {
    let prompt = await this.prisma.prompt.findUnique({
      where: { key },
      include: {
        versions: {
          where: { isActive: true },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!prompt) {
      prompt = await this.prisma.prompt.create({
        data: {
          key,
          versions: {
            create: {
              version: 1,
              content: defaultContent,
              isActive: true,
            },
          },
        },
        include: {
          versions: {
            where: { isActive: true },
          },
        },
      });
    }

    const activeVersion = prompt.versions[0];
    if (!activeVersion) {
      return this.prisma.promptVersion.create({
        data: {
          promptId: prompt.id,
          version: 1,
          content: defaultContent,
          isActive: true,
        },
      });
    }

    return activeVersion;
  }

  private async applySafetyRules(input: unknown) {
    if (!input) return;
    const inputStr = JSON.stringify(input);

    const rules = await this.prisma.safetyRule.findMany({
      where: { isActive: true },
    });

    for (const rule of rules) {
      try {
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(inputStr)) {
          throw new ForbiddenException(
            `Input violated safety rule: ${rule.name}`,
          );
        }
      } catch (regexErr) {
        this.logger.warn(
          `Invalid regex pattern in safety rule ${rule.name}: ${rule.pattern}`,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async reconcileStuckAiRequests() {
    this.logger.log(
      'Starting automated consistency check for stuck AI requests...',
    );

    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

    try {
      const stuckRequests = await this.prisma.aiRequest.findMany({
        where: {
          createdAt: { lt: thirtyMinutesAgo },
          estimatedTokens: { not: null },
          status: { in: ['PENDING', 'PROCESSING'] },
        },
        select: {
          id: true,
          userId: true,
          estimatedTokens: true,
        },
      });

      if (stuckRequests.length === 0) {
        this.logger.log('No stuck AI requests found.');
        return;
      }

      this.logger.log(
        `Found ${stuckRequests.length} stuck AI requests. Processing refunds...`,
      );

      for (const req of stuckRequests) {
        if (req.userId && req.estimatedTokens) {
          this.logger.warn(
            `Refunding estimated ${req.estimatedTokens} tokens for stuck request ${req.id} (user: ${req.userId})`,
          );
          await this.refundQuotaUsage(req.userId, req.estimatedTokens, req.id);
        }
      }
    } catch (err: any) {
      this.logger.error(`Failed to run reconciliation cron: ${err.message}`);
    }
  }
}

const toInputJson = (
  value: unknown,
): Prisma.InputJsonValue | Prisma.JsonNullValueInput => {
  if (value === undefined) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
};
