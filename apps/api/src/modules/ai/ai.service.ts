import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { AiGenerateDto, AiRewriteDto, AiScoreDto } from './dto/ai.dto';
import { Response } from 'express';
import { Prisma, AiFeature } from '@prisma/client';
import { AiProvider, PromptPayload } from './providers/ai-provider.interface';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AiUsageService } from './ai-usage.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    @Inject('AiProvider') private aiProvider: AiProvider,
    private aiUsageService: AiUsageService,
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
      AiFeature.CV_REWRITE,
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
        AiFeature.CV_REWRITE,
      );

      let cleanedOutput =
        typeof output === 'string'
          ? output
          : (output as any).text || (output as any).raw || '';
      cleanedOutput = this.postValidateAndCleanSummary(cleanedOutput);
      return { text: cleanedOutput };
    }

    if (dto.sectionType === 'EXPERIENCE') {
      const detectedLocale = this.detectLanguage(
        (dto.resumeContext?.jobTitle as string) ||
          (dto.resumeContext?.position as string) ||
          '',
        dto.locale,
      );
      const systemPrompt = this.getExperienceSystemPrompt(detectedLocale);
      const userPrompt = this.buildExperienceUserPrompt(dto, detectedLocale);

      const output = await this.runPrompt(
        supabaseId,
        `cv_experience_${detectedLocale}`,
        { system: systemPrompt, user: userPrompt, input: dto },
        0.4,
        AiFeature.CV_REWRITE,
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
          'If the sectionType is "EXPERIENCE" and the "description" field in content is empty or generic, generate a professional, high-impact description of achievements and responsibilities from scratch in the requested style and locale, using the "position" and "company" fields (if available). ' +
          'Otherwise, extract the text content (either from "text" or "description" field), rewrite/optimize it to fit the requested "style" and "locale". ' +
          'Output ONLY the resulting plain text. Do NOT output any JSON structure.',
        input: dto,
      },
      0.4,
      AiFeature.CV_REWRITE,
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
      AiFeature.ATS_REVIEW,
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
      AiFeature.ATS_REVIEW,
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
      AiFeature.ATS_REVIEW,
    );
  }

  /**
   * generateSkillBullet: Generates a single ATS-optimized resume bullet point
   * demonstrating proficiency in a given skill for a target role.
   * Non-streaming. Returns plain text (no JSON, no markdown).
   */
  async generateSkillBullet(params: {
    supabaseId: string;
    skillName: string;
    skillCategory: string;
    targetRole: string;
    locale: string;
  }): Promise<string> {
    const { supabaseId, skillName, skillCategory, targetRole, locale } = params;
    const isVi = locale === 'vi';

    const systemPrompt = isVi
      ? `Bạn là chuyên gia viết CV. Hãy tạo MỘT câu bullet point ngắn gọn, chuyên nghiệp, được tối ưu ATS cho CV.\nYêu cầu: Bắt đầu bằng động từ hành động mạnh (ví dụ: Triển khai, Xây dựng, Tối ưu hóa). Tối đa 2 dòng. Không dùng markdown. Chỉ trả về nội dung bullet, không thêm dấu gạch đầu dòng.`
      : `You are a professional CV writer. Generate ONE concise, ATS-optimized resume bullet point.\nRequirements: Start with a strong action verb (e.g., Implemented, Developed, Optimized). Maximum 2 lines. No markdown. Return only the bullet text, no leading dash or bullet character.`;

    const userPrompt = isVi
      ? `Tạo một bullet point CV thể hiện thành thạo kỹ năng "${skillName}" (thuộc lĩnh vực ${skillCategory}) cho vai trò ${targetRole}.`
      : `Generate a resume bullet point demonstrating proficiency in "${skillName}" (category: ${skillCategory}) for a ${targetRole} role.`;

    const raw = await this.generateDirect(
      supabaseId,
      systemPrompt,
      userPrompt,
      { skillName, skillCategory, targetRole },
      0.5,
    );

    // Normalize output to plain string
    const text =
      typeof raw === 'string'
        ? raw
        : (raw as any)?.text || (raw as any)?.raw || '';
    return text.trim();
  }

  /**
   * streamCoachChat: Streams conversational career coaching suggestions and guidance.
   * Leverages streamPrompt to manage quota and handle network disconnection.
   */
  async streamCoachChat(params: {
    supabaseId: string;
    cvContext: string;
    roadmapContext: string;
    messages: Array<{ role: string; content: string }>;
    locale: string;
    res: Response;
  }): Promise<string> {
    const { supabaseId, cvContext, roadmapContext, messages, locale, res } =
      params;
    const isVi = locale === 'vi';
    console.log(`[AiService.streamCoachChat] locale=${locale}, isVi=${isVi}`);

    const systemPrompt = isVi
      ? `Bạn là một AI Career Coach chuyên nghiệp và thân thiện của BetterCV. Nhiệm vụ của bạn là đồng hành và hỗ trợ người dùng hoàn thành Lộ trình Học tập (Roadmap) của họ.
Dưới đây là thông tin chi tiết về CV hiện tại và Lộ trình của người dùng:
${cvContext}
${roadmapContext}

Yêu cầu huấn luyện (QUY TẮC BẮT BUỘC):
1. Chỉ cung cấp lời khuyên liên quan đến sự nghiệp, lộ trình học tập, tài liệu ôn thi/phỏng vấn, tối ưu CV và phát triển chuyên môn.
2. Nếu thiếu thông tin cần thiết, hãy lịch sự hỏi người dùng thay vì tự bịa ra thông tin.
3. Không tự ý khẳng định người dùng đã sở hữu bất cứ kỹ năng nào ngoài những kỹ năng đã được chỉ rõ trong CV Context.
4. Luôn ưu tiên đưa ra đề xuất học tập theo thứ tự các phase trong Lộ trình.
5. Không khuyến khích người dùng bỏ qua các kỹ năng cơ bản (prerequisites).
6. Sử dụng định dạng Markdown (danh sách, bảng, in đậm) để cấu trúc câu trả lời đẹp mắt.
7. Tự động phát hiện ngôn ngữ của tin nhắn mới nhất từ người dùng (Tiếng Việt hoặc Tiếng Anh) và phản hồi bằng chính ngôn ngữ đó (Hỏi bằng Tiếng Việt thì trả lời bằng Tiếng Việt, hỏi bằng Tiếng Anh thì trả lời bằng Tiếng Anh).`
      : `You are an expert AI Career Coach from BetterCV. Your goal is to guide and encourage the user in mastering their Learning Roadmap.
Here is the user's CV and Roadmap context:
${cvContext}
${roadmapContext}

Strict Guardrails:
1. Only provide advice concerning career growth, learning materials, interview preparation, CV polishing, and professional development.
2. If necessary information is missing, ask the user instead of hallucinating.
3. Do not claim the user possesses skills that are not explicitly listed in the CV context.
4. Prioritize recommendations based on the current roadmap phases.
5. Never recommend skipping prerequisite skills.
6. Use clean Markdown styling (tables, bold lists) for readability.
7. Automatically detect the language of the user's latest message (English or Vietnamese) and respond using that same language (if asked in Vietnamese, reply in Vietnamese; if asked in English, reply in English).`;

    const lastUserMessage = messages[messages.length - 1]?.content || 'Hello';
    const history = messages.slice(0, -1);

    return this.streamPrompt(
      supabaseId,
      `career_coach_chat_${locale}`,
      {
        system: systemPrompt,
        user: lastUserMessage,
        input: { history },
      },
      res,
      0.7,
      AiFeature.CAREER_COACH,
    );
  }

  /**
   * generateDirect: Sends a prompt directly to the AI provider using the provided systemPrompt,
   * bypassing the DB-cached prompt versions (getActivePrompt).
   * This ensures locale-sensitive prompts (e.g., Vietnamese/English) are always used as-is.
   * Still applies quota tracking and safety rules.
   */
  async generateDirect(
    supabaseId: string,
    systemPrompt: string,
    userPrompt: string,
    inputData: Record<string, any>,
    temperature = 0.2,
  ) {
    const userId = await this.resolveUserId(supabaseId);
    await this.applySafetyRules(inputData);

    const estimated = this.estimateTokens({
      system: systemPrompt,
      user: userPrompt,
      input: inputData,
    });
    await this.assertAndReserveQuota(userId, estimated);

    const request = await this.prisma.aiRequest.create({
      data: {
        userId,
        promptKey: 'cv_ats_analyze_direct',
        input: toInputJson(inputData),
        estimatedTokens: estimated,
        status: 'PENDING',
      },
    });

    const modelName = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');

    try {
      await this.prisma.aiRequest.update({
        where: { id: request.id },
        data: { status: 'PROCESSING' },
      });

      const response = await this.aiProvider.generate(
        {
          system: systemPrompt,
          user: userPrompt,
          input: inputData,
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

      await this.reconcileQuotaUsage(
        userId,
        response.tokens,
        estimated,
        request.id,
      );

      this.aiUsageService.recordUsage({
        userId,
        feature: AiFeature.ATS_REVIEW,
        model: modelName,
        usage: response.usage,
        success: true,
      });

      return response.output;
    } catch (err: any) {
      await this.refundQuotaUsage(userId, estimated, request.id);
      this.logger.error(`generateDirect failed: ${err.message}`);

      this.aiUsageService.recordUsage({
        userId,
        feature: AiFeature.ATS_REVIEW,
        model: modelName,
        success: false,
      });

      throw err;
    }
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
      AiFeature.CV_REWRITE,
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
        AiFeature.CV_REWRITE,
      );
    }

    if (dto.sectionType === 'EXPERIENCE') {
      const detectedLocale = this.detectLanguage(
        (dto.resumeContext?.jobTitle as string) ||
          (dto.resumeContext?.position as string) ||
          '',
        dto.locale,
      );
      const systemPrompt = this.getExperienceSystemPrompt(detectedLocale);
      const userPrompt = this.buildExperienceUserPrompt(dto, detectedLocale);

      return this.streamPrompt(
        supabaseId,
        `cv_experience_${detectedLocale}`,
        { system: systemPrompt, user: userPrompt, input: dto },
        res,
        0.4,
        AiFeature.CV_REWRITE,
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
          'If the sectionType is "EXPERIENCE" and the "description" field in content is empty or generic, generate a professional, high-impact description of achievements and responsibilities from scratch in the requested style and locale, using the "position" and "company" fields (if available). ' +
          'Otherwise, extract the text content (either from "text" or "description" field), rewrite/optimize it to fit the requested "style" and "locale". ' +
          'Output ONLY the resulting plain text. Do NOT output any JSON structure.',
        input: dto,
      },
      res,
      0.4,
      AiFeature.CV_REWRITE,
    );
  }

  // ── Core AI Pipeline ──────────────────────────────────────────

  private async runPrompt(
    supabaseId: string,
    promptKey: string,
    payload: PromptPayload,
    temperature = 0.4,
    feature: AiFeature = AiFeature.CV_REWRITE,
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

    const modelName = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');

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

      // 3. Fire-and-forget usage accounting
      this.aiUsageService.recordUsage({
        userId,
        feature,
        model: modelName,
        usage: response.usage,
        success: true,
      });

      return response.output;
    } catch (err: any) {
      // Hoàn trả lượng quota tạm tính nếu thất bại
      await this.refundQuotaUsage(userId, estimated, request.id);
      this.logger.error(`AI prompt generation failed: ${err.message}`);

      // Record failed usage for observability
      this.aiUsageService.recordUsage({
        userId,
        feature,
        model: modelName,
        success: false,
      });

      throw err;
    }
  }

  private async streamPrompt(
    supabaseId: string,
    promptKey: string,
    payload: PromptPayload,
    res: Response,
    temperature = 0.4,
    feature: AiFeature = AiFeature.CV_REWRITE,
  ): Promise<string> {
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

    const modelName = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

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

      // 3. Fire-and-forget usage accounting
      this.aiUsageService.recordUsage({
        userId,
        feature,
        model: modelName,
        usage: result.usage,
        success: true,
      });

      res.write(`event: done\ndata: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return result.text;
    } catch (err: any) {
      // Hoàn trả lượng quota tạm tính nếu thất bại
      await this.refundQuotaUsage(userId, estimated, request.id);
      this.logger.error(`AI prompt streaming failed: ${err.message}`);

      // Record failed usage for observability
      this.aiUsageService.recordUsage({
        userId,
        feature,
        model: modelName,
        success: false,
      });

      res.write(
        `event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`,
      );
      res.end();
      throw err;
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

    const isFreeUser = user.role === 'FREE' && user.subscriptions.length === 0;

    const planQuota =
      user.subscriptions[0]?.plan?.monthlyAiQuota ??
      (user.role === 'ADMIN'
        ? 10000000
        : user.role === 'PREMIUM'
          ? 2000000
          : user.role === 'PRO'
            ? 1000000
            : user.role === 'FREE'
              ? 5000
              : 0);

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
    let affectedRows = 0;
    if (isFreeUser) {
      affectedRows = await this.prisma.$executeRaw`
        UPDATE "UsageQuota"
        SET "usedTokens" = "usedTokens" + ${estimatedTokens},
            "usedRequests" = "usedRequests" + 1,
            "updatedAt" = NOW()
        WHERE "userId" = ${userId}
          AND "usedTokens" + ${estimatedTokens} <= 5000
          AND "usedRequests" + 1 <= 10
      `;
    } else {
      affectedRows = await this.prisma.$executeRaw`
        UPDATE "UsageQuota"
        SET "usedTokens" = "usedTokens" + ${estimatedTokens},
            "usedRequests" = "usedRequests" + 1,
            "updatedAt" = NOW()
        WHERE "userId" = ${userId}
          AND "usedTokens" + ${estimatedTokens} <= ${planQuota}
      `;
    }

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

    const modelName = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');

    const output = await this.aiProvider.generate(
      {
        system: systemPrompt,
        user: userPrompt,
        input: { jobTitle: dto.jobTitle },
      },
      0.2,
    );

    this.aiUsageService.recordUsage({
      feature: AiFeature.SKILL_SUGGESTION,
      model: modelName,
      usage: output.usage,
      success: true,
    });

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

  private getExperienceSystemPrompt(_locale: 'en' | 'vi'): string {
    return `You are an expert CV writer, ATS optimization specialist, and professional career coach.

Your task is to generate or improve the Work Experience section of a resume.

Output Rules:
- Be ATS-friendly.
- Use action verbs.
- Be concise but impactful.
- Focus on responsibilities, achievements, collaboration, problem-solving, and business impact.
- Avoid generic filler text.
- Avoid first-person pronouns (I, me, my).
- Do not fabricate metrics, percentages, or achievements.
- Return ONLY the final bullet points. No JSON, no markdown code blocks, no introductory text, no notes.`;
  }

  private buildExperienceUserPrompt(
    dto: AiRewriteDto,
    locale: 'en' | 'vi',
  ): string {
    const content = dto.content as any;
    const ctx = dto.resumeContext as any;

    const companyName = content?.company || ctx?.company || '';
    const jobTitle = content?.position || ctx?.position || '';
    const startDate = content?.startDate || ctx?.startDate || '';
    const endDate = content?.endDate || ctx?.endDate || '';
    const isCurrent = content?.current ?? ctx?.current ?? false;
    const description = (content?.description || '').trim();
    const resumeLanguage =
      locale === 'vi' ? 'Vietnamese (Tiếng Việt)' : 'English';

    const hasDescription = description.length > 0;

    return `Your task is to generate or improve the Work Experience section of a resume.

Input Data:

Company Name: ${companyName}

Job Title: ${jobTitle}

Start Date: ${startDate}

End Date: ${isCurrent ? 'Present (currently working here)' : endDate || 'N/A'}

Currently Working: ${isCurrent ? 'Yes' : 'No'}

User Description:
${hasDescription ? description : '(empty — no description provided by user)'}

Rules:

1. If User Description is empty:
   - Generate a professional work experience description based on the job title and company information.
   - Infer common responsibilities and achievements relevant to the role.
   - Do not invent unrealistic accomplishments.
   - Generate 4-6 bullet points.

2. If User Description is provided:
   - Rewrite and enhance the user's content.
   - Preserve all original meaning.
   - Expand details professionally.
   - Improve ATS keyword coverage.
   - Generate 5-8 bullet points.
   - Do not remove important information provided by the user.

3. Output must:
   - Be ATS-friendly.
   - Use action verbs.
   - Be concise but impactful.
   - Focus on responsibilities, achievements, collaboration, problem-solving, and business impact.
   - Avoid generic filler text.
   - Avoid first-person pronouns (I, me, my).
   - Do not fabricate metrics, percentages, or achievements.

4. Return only the final bullet points.

Language: ${resumeLanguage}`;
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

  async analyzeGithubRepo(
    supabaseId: string,
    url: string,
    locale: 'en' | 'vi',
  ) {
    const repoInfo = await this.fetchGithubRepo(url);
    if (!repoInfo) {
      throw new Error(
        'Could not fetch repository information. Please check if the URL is correct and public.',
      );
    }

    const systemPrompt =
      'You are an expert resume developer. Your task is to analyze a GitHub repository profile and README, then extract and generate CV project details. ' +
      'Return ONLY a valid JSON object matching the requested schema. Never return markdown code blocks, conversational filler, or note texts.';

    const userPrompt =
      `Analyze the following GitHub repository details and write a professional CV project entry.\n\n` +
      `REPOSITORY DETAILS:\n` +
      `- Name: ${repoInfo.name}\n` +
      `- Metadata Description: ${repoInfo.description}\n` +
      `- Main Language: ${repoInfo.language}\n` +
      `- Topics: ${repoInfo.topics.join(', ')}\n\n` +
      `README CONTENT:\n` +
      `${repoInfo.readme}\n\n` +
      `REQUIREMENTS:\n` +
      `1. Generate the project name (improve/clean the repo name if necessary to sound professional).\n` +
      `2. Extract the core technologies used (array of strings, e.g. ["React", "NestJS", "TailwindCSS", "PostgreSQL"]).\n` +
      `3. Write a professional, high-impact description of the project (2-3 bullet points or a short paragraph) detailing what the project does, key features, and technical achievements. Write 100% in ${locale === 'vi' ? 'VIETNAMESE (Tiếng Việt)' : 'ENGLISH'}.\n` +
      `4. Output format must be strictly a JSON object with this exact structure:\n` +
      `{\n` +
      `  "name": "...",\n` +
      `  "technologies": ["...", "..."],\n` +
      `  "description": "..."\n` +
      `}`;

    const output = await this.runPrompt(
      supabaseId,
      'cv_github_analyze',
      {
        system: systemPrompt,
        user: userPrompt,
        input: { url, locale },
      },
      0.2,
      AiFeature.GITHUB_ANALYSIS,
    );

    let parsed: { name: string; technologies: string[]; description: string } =
      {
        name: repoInfo.name,
        technologies: [repoInfo.language].filter(Boolean),
        description: repoInfo.description || '',
      };

    try {
      const cleanStr =
        typeof output === 'string'
          ? output
          : (output as any).raw || JSON.stringify(output);
      let jsonStr = cleanStr.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr
          .replace(/^```(json)?/i, '')
          .replace(/```$/i, '')
          .trim();
      }
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      this.logger.error('Failed to parse GitHub analysis output JSON:', e);
    }

    return parsed;
  }

  async fetchGithubRepo(url: string) {
    try {
      const parsed = this.parseGithubUrl(url);
      if (!parsed) return null;
      const { owner, repo } = parsed;

      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'BetterCV-App',
      };

      const token = this.config.get<string>('GITHUB_TOKEN');
      if (token) {
        headers['Authorization'] = `token ${token}`;
      }

      const repoRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers },
      );
      if (!repoRes.ok) {
        throw new Error(`GitHub API returned status ${repoRes.status}`);
      }
      const repoData = (await repoRes.json()) as any;

      const readmeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/readme`,
        { headers },
      );
      let readmeText = '';
      if (readmeRes.ok) {
        const readmeData = (await readmeRes.json()) as any;
        if (readmeData.download_url) {
          const rawReadmeRes = await fetch(readmeData.download_url);
          if (rawReadmeRes.ok) {
            readmeText = await rawReadmeRes.text();
          }
        }
      }

      return {
        name: repoData.name,
        description: repoData.description || '',
        topics: repoData.topics || [],
        language: repoData.language || '',
        readme: readmeText.substring(0, 6000),
      };
    } catch (err: any) {
      this.logger.error(`Failed to fetch GitHub repo: ${err.message}`);
      return null;
    }
  }

  private parseGithubUrl(url: string): { owner: string; repo: string } | null {
    try {
      const cleanUrl = url
        .trim()
        .replace(/\/$/, '')
        .replace(/\.git$/, '');
      const parsed = new URL(cleanUrl);
      if (!parsed.hostname.includes('github.com')) return null;
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return { owner: parts[0], repo: parts[1] };
      }
      return null;
    } catch {
      return null;
    }
  }
}

const toInputJson = (
  value: unknown,
): Prisma.InputJsonValue | Prisma.JsonNullValueInput => {
  if (value === undefined) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
};
