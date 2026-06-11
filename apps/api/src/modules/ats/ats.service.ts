import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../ai/ai.service';
import * as crypto from 'crypto';
import { z } from 'zod';

const ATS_ENGINE_VERSION = process.env.ATS_ENGINE_VERSION || '2.0.0';

const AtsAnalyzeSchema = z
  .object({
    semanticScore: z.number().min(0).max(100),
    keywordScore: z.number().min(0).max(100),
    experienceScore: z.number().min(0).max(100),
    skillsScore: z.number().min(0).max(100),
    findings: z.array(z.string()),
    missingKeywords: z.array(z.string()),
    recommendations: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        category: z.enum([
          'semantic',
          'keyword',
          'experience',
          'skills',
          'formatting',
        ]),
        severity: z.enum(['low', 'medium', 'high']),
        actionable: z.boolean(),
      }),
    ),
  })
  .strict();

type AtsAnalyzeOutput = z.infer<typeof AtsAnalyzeSchema>;

@Injectable()
export class AtsService {
  private readonly logger = new Logger(AtsService.name);
  private readonly activeScans = new Map<string, Promise<any>>();

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async evaluateCv(
    supabaseId: string,
    cvId: string,
    jobDescription: string,
    preferredLocale?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const cv = await this.prisma.cv.findFirst({
      where: { id: cvId, userId: user.id, isDeleted: false },
      include: { sections: true },
    });
    if (!cv) throw new NotFoundException('CV not found');

    // 1. Token Optimization: Serialize CV text representation
    const cvText = this.serializeCvForAi(cv);
    const cleanedJd = (jobDescription || '').trim();
    // preferredLocale from frontend takes priority over the stored cv.locale
    const locale = preferredLocale || cv.locale || 'vi';

    const aiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    // 2. Caching check: Hash CV content + JD content + version + model + locale
    const contentHash = crypto
      .createHash('sha256')
      .update(
        cvText +
          '\n' +
          cleanedJd +
          '\n' +
          ATS_ENGINE_VERSION +
          '\n' +
          aiModel +
          '\n' +
          locale,
      )
      .digest('hex');

    // Deduplication: Check if there's an active in-flight request for this hash
    const activePromise = this.activeScans.get(contentHash);
    if (activePromise) {
      this.logger.log(
        `ATS scan already in-flight for hash ${contentHash}. Reusing active promise.`,
      );
      return activePromise;
    }

    const scanPromise = this.executeScan(
      supabaseId,
      cvId,
      cv,
      cvText,
      cleanedJd,
      contentHash,
      aiModel,
      jobDescription,
      locale,
    );
    this.activeScans.set(contentHash, scanPromise);
    try {
      return await scanPromise;
    } finally {
      this.activeScans.delete(contentHash);
    }
  }

  private async executeScan(
    supabaseId: string,
    cvId: string,
    cv: any,
    cvText: string,
    cleanedJd: string,
    contentHash: string,
    aiModel: string,
    jobDescription: string,
    locale: string,
  ) {
    const isVi = locale === 'vi';

    const ruleNames = {
      semantic: isVi
        ? 'Sự phù hợp ngữ nghĩa (Semantic Match)'
        : 'Semantic Match',
      keyword: isVi ? 'Độ phủ từ khóa (Keyword Match)' : 'Keyword Match',
      experience: isVi
        ? 'Mức độ tương thích kinh nghiệm (Experience Relevance)'
        : 'Experience Relevance',
      skills: isVi ? 'Độ bao phủ kỹ năng (Skills Coverage)' : 'Skills Coverage',
      formatting: isVi
        ? 'Tiêu chuẩn trình bày (Formatting & Presentation)'
        : 'Formatting & Presentation',
    };

    // 1. Indefinite Caching check (no TTL since hash uniquely identifies content, version, and model)
    const existingScan = await this.prisma.atsScan.findFirst({
      where: {
        cvId,
        contentHash,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingScan) {
      this.logger.log(`ATS cache hit for CV ${cvId} and identical JD.`);
      return {
        success: true,
        data: {
          cvId,
          score: existingScan.overallScore,
          rulesEvaluated: [
            {
              ruleName: ruleNames.semantic,
              score: existingScan.semanticScore,
              weight: 0.4,
              findings: [],
            },
            {
              ruleName: ruleNames.keyword,
              score: existingScan.keywordScore,
              weight: 0.2,
              findings: [],
            },
            {
              ruleName: ruleNames.experience,
              score: existingScan.experienceScore,
              weight: 0.2,
              findings: [],
            },
            {
              ruleName: ruleNames.skills,
              score: existingScan.skillsScore,
              weight: 0.1,
              findings: [],
            },
            {
              ruleName: ruleNames.formatting,
              score: existingScan.formatScore,
              weight: 0.1,
              findings: [],
            },
          ],
          findings: [
            isVi
              ? 'Kết quả phân tích được tải từ cache của lượt quét trước đó.'
              : 'Analysis results loaded from the previous scan cache.',
          ],
          recommendations: existingScan.recommendations as any,
          evaluatedAt: existingScan.createdAt.toISOString(),
        },
      };
    }

    // 2. Rule-based formatting evaluation
    const formatRuleResult = this.evaluateFormattingRule(cv, locale);

    // 3. OpenAI prompt and execution
    const systemPrompt = `You are an expert ATS (Applicant Tracking System) Resume Analyzer.
Your task is to analyze the candidate's CV against the provided Job Description (JD).

Evaluate the CV across 4 criteria:
1. Semantic Match: Overall role compatibility, semantic relevance of experience, and transferability of skills.
2. Keyword Match: Coverage of required tools, programming languages, and key technical concepts, including matching synonyms (e.g. "ReactJS" = "React").
3. Experience Relevance: Seniority level compatibility, appropriate depth of responsibilities, and years of experience match.
4. Skills Coverage: Breadth and depth of core skills.

RULES:
1. Return ONLY a valid JSON object matching the schema below.
2. Do NOT wrap the JSON in markdown formatting (like \`\`\`json). Just return the raw JSON object.
3. Be objective. Do not inflate scores. If a CV is completely unrelated to the JD, the score must be near 0.
4. Extract all missing keywords from the JD that are not present in the CV. Keep the keywords in their original language/form as extracted from the JD.
5. Provide detailed recommendations with title, description, category ("semantic", "keyword", "experience", "skills"), severity ("low", "medium", "high"), and actionable (true/false).
6. CRITICAL LANGUAGE REQUIREMENT: You must write all "findings", and all recommendation "title"s and "description"s 100% in the language matching the requested locale.
   Requested Locale: "${locale === 'vi' ? 'Vietnamese (vi)' : 'English (en)'}".
   Therefore, write those fields in ${locale === 'vi' ? 'Vietnamese' : 'English'}.

JSON RESPONSE SCHEMA:
{
  "semanticScore": number (0-100),
  "keywordScore": number (0-100),
  "experienceScore": number (0-100),
  "skillsScore": number (0-100),
  "findings": string[],
  "missingKeywords": string[],
  "recommendations": Array<{
    "title": string,
    "description": string,
    "category": "semantic" | "keyword" | "experience" | "skills",
    "severity": "low" | "medium" | "high",
    "actionable": boolean
  }>
}`;

    const userPrompt = `CV CONTENT:
${cvText}

JOB DESCRIPTION:
${cleanedJd}`;

    let aiResult: AtsAnalyzeOutput | null = null;
    let isDegraded = false;

    try {
      // Call aiProvider.generate directly to always use the fresh locale-aware systemPrompt
      // (bypasses getActivePrompt DB cache which would return the old English prompt)
      const response = await this.aiService.generateDirect(
        supabaseId,
        systemPrompt,
        userPrompt,
        { cvId, jobDescriptionLength: cleanedJd.length, locale },
        0.2,
      );

      let parsedOutput: any;
      if (typeof response === 'string') {
        parsedOutput = this.cleanAndParseJson(response);
      } else if (typeof response === 'object' && response !== null) {
        if ('raw' in response && typeof (response as any).raw === 'string') {
          parsedOutput = this.cleanAndParseJson((response as any).raw);
        } else if (
          'text' in response &&
          typeof (response as any).text === 'string'
        ) {
          parsedOutput = this.cleanAndParseJson((response as any).text);
        } else {
          parsedOutput = response;
        }
      } else {
        parsedOutput = {};
      }

      aiResult = AtsAnalyzeSchema.parse(parsedOutput);
    } catch (err: any) {
      this.logger.error(
        `AI-powered ATS evaluation failed: ${err.message}. Falling back to degraded baseline.`,
      );
      isDegraded = true;
    }

    // 4. Overall score calculation & recommendations consolidation
    let finalScore: number | null = null;
    let allFindings = [...formatRuleResult.findings];
    let finalRecommendations: any[] = [];

    if (!isDegraded && aiResult) {
      finalScore = Math.round(
        aiResult.semanticScore * 0.4 +
          aiResult.keywordScore * 0.2 +
          aiResult.experienceScore * 0.2 +
          aiResult.skillsScore * 0.1 +
          formatRuleResult.score * 0.1,
      );

      allFindings = [...aiResult.findings, ...formatRuleResult.findings];
      const rawRecommendations = [
        ...aiResult.recommendations,
        ...formatRuleResult.recommendations,
      ];
      let recIdCounter = 1;
      finalRecommendations = rawRecommendations.slice(0, 20).map((rec) => ({
        ...rec,
        id: `rec-${rec.category}-${recIdCounter++}`,
      }));
    } else {
      // Degraded State: We save null scores, and only formatting recommendations
      let recIdCounter = 1;
      finalRecommendations = formatRuleResult.recommendations
        .slice(0, 20)
        .map((rec) => ({
          ...rec,
          id: `rec-${rec.category}-${recIdCounter++}`,
        }));
      allFindings.unshift(
        isVi
          ? 'Hệ thống phân tích AI tạm thời không khả dụng. Kết quả đánh giá bị giảm cấp (Degraded).'
          : 'AI analysis service is temporarily unavailable. Evaluation is in degraded mode.',
      );
    }

    // Extract a descriptive Job Title from the first line of the JD
    let jobTitle = isVi ? 'Vị trí công việc' : 'Job Title';
    if (cleanedJd) {
      const firstLine = cleanedJd.split('\n')[0].trim();
      jobTitle =
        firstLine.length > 80 ? firstLine.slice(0, 80) + '...' : firstLine;
    }

    // 5. Persist ATS Scan history to database
    await this.prisma.$transaction(
      async (tx) => {
        // Row-lock the parent Cv record using SELECT FOR UPDATE
        await tx.$executeRaw`SELECT * FROM "Cv" WHERE "id" = ${cvId} FOR UPDATE;`;

        await tx.atsScan.create({
          data: {
            cvId,
            jobTitle,
            jobDescription,
            overallScore: finalScore,
            keywordScore: aiResult?.keywordScore ?? null,
            formatScore: formatRuleResult.score,
            completenessScore: aiResult?.semanticScore ?? null,
            semanticScore: aiResult?.semanticScore ?? null,
            experienceScore: aiResult?.experienceScore ?? null,
            skillsScore: aiResult?.skillsScore ?? null,
            aiModel,
            promptVersion: ATS_ENGINE_VERSION,
            contentHash,
            missingKeywords: (aiResult?.missingKeywords as any) ?? undefined,
            recommendations: finalRecommendations as any,
          },
        });

        await tx.cv.update({
          where: { id: cvId },
          data: {
            atsScore: finalScore,
            atsScannedAt: new Date(),
            atsVersion: ATS_ENGINE_VERSION,
          },
        });

        // Inline retention: keep only the 50 latest scans for this CV
        const oldScans = await tx.atsScan.findMany({
          where: { cvId },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: 50,
          select: { id: true },
        });
        if (oldScans.length > 0) {
          const idsToDelete = oldScans.map((s) => s.id);
          await tx.atsScan.deleteMany({
            where: { id: { in: idsToDelete } },
          });
        }
      },
      {
        timeout: 30000,
      },
    );

    return {
      success: !isDegraded,
      data: {
        cvId,
        score: finalScore,
        rulesEvaluated: [
          {
            ruleName: ruleNames.semantic,
            score: aiResult?.semanticScore ?? null,
            weight: 0.4,
            findings: aiResult?.findings ?? [],
          },
          {
            ruleName: ruleNames.keyword,
            score: aiResult?.keywordScore ?? null,
            weight: 0.2,
            findings: [],
          },
          {
            ruleName: ruleNames.experience,
            score: aiResult?.experienceScore ?? null,
            weight: 0.2,
            findings: [],
          },
          {
            ruleName: ruleNames.skills,
            score: aiResult?.skillsScore ?? null,
            weight: 0.1,
            findings: [],
          },
          {
            ruleName: ruleNames.formatting,
            score: formatRuleResult.score,
            weight: 0.1,
            findings: formatRuleResult.findings,
          },
        ],
        findings: allFindings,
        recommendations: finalRecommendations,
        evaluatedAt: new Date().toISOString(),
      },
    };
  }

  private serializeCvForAi(cv: any): string {
    const sections = cv.sections || [];
    const lines: string[] = [];

    lines.push(`CV Title: ${cv.title || ''}`);

    const profileSec = sections.find((s: any) => s.type === 'PROFILE');
    if (profileSec && profileSec.content) {
      const p = profileSec.content;
      lines.push('PROFILE:');
      if (p.fullName) lines.push(`- Full Name: ${p.fullName}`);
      if (p.title) lines.push(`- Professional Title: ${p.title}`);
    }

    const summarySec = sections.find((s: any) => s.type === 'SUMMARY');
    if (summarySec && summarySec.content && summarySec.content.text) {
      lines.push(`SUMMARY: ${summarySec.content.text}`);
    }

    const expSec = sections.find((s: any) => s.type === 'EXPERIENCE');
    if (expSec && expSec.content) {
      lines.push('EXPERIENCE:');
      const items = Array.isArray(expSec.content.items)
        ? expSec.content.items
        : Array.isArray(expSec.content)
          ? expSec.content
          : [];
      items.forEach((item: any) => {
        lines.push(`- Role: ${item.role || ''} at ${item.company || ''}`);
        if (item.description) lines.push(`  Description: ${item.description}`);
      });
    }

    const eduSec = sections.find((s: any) => s.type === 'EDUCATION');
    if (eduSec && eduSec.content) {
      lines.push('EDUCATION:');
      const items = Array.isArray(eduSec.content.items)
        ? eduSec.content.items
        : Array.isArray(eduSec.content)
          ? eduSec.content
          : [];
      items.forEach((item: any) => {
        lines.push(
          `- Degree: ${item.degree || ''} in ${item.field || ''} from ${item.institution || ''}`,
        );
      });
    }

    const skillSec = sections.find((s: any) => s.type === 'SKILLS');
    if (skillSec && skillSec.content) {
      const items = Array.isArray(skillSec.content.items)
        ? skillSec.content.items
        : Array.isArray(skillSec.content)
          ? skillSec.content
          : [];
      const skillNames = items
        .map((item: any) => item.name || '')
        .filter(Boolean);
      if (skillNames.length > 0) {
        lines.push(`SKILLS: ${skillNames.join(', ')}`);
      }
    }

    const projSec = sections.find((s: any) => s.type === 'PROJECTS');
    if (projSec && projSec.content) {
      lines.push('PROJECTS:');
      const items = Array.isArray(projSec.content.items)
        ? projSec.content.items
        : Array.isArray(projSec.content)
          ? projSec.content
          : [];
      items.forEach((item: any) => {
        lines.push(`- Project: ${item.name || ''} (${item.role || ''})`);
        if (item.description) lines.push(`  Description: ${item.description}`);
      });
    }

    return lines.join('\n');
  }

  private evaluateFormattingRule(
    cv: any,
    locale: string,
  ): {
    score: number;
    findings: string[];
    recommendations: any[];
  } {
    const isVi = locale === 'vi';
    const findings: string[] = [];
    const recommendations: any[] = [];
    let score = 100;

    const sections = cv.sections || [];

    // 1. Placeholder check
    const PLACEHOLDER_PATTERNS = [
      /lorem\s+ipsum/i,
      /\[tên\s+công\s+ty\]/i,
      /\[company\s+name\]/i,
      /abcxyz/i,
      /insert\s+here/i,
      /điền\s+vào\s+đây/i,
      /\[nhập\s+thông\s+tin\]/i,
    ];

    let placeholderFound = false;
    for (const sec of sections) {
      const text = JSON.stringify(sec.content || '').toLowerCase();
      for (const pattern of PLACEHOLDER_PATTERNS) {
        if (pattern.test(text)) {
          placeholderFound = true;
          break;
        }
      }
    }

    if (placeholderFound) {
      score -= 30;
      findings.push(
        isVi
          ? 'Phát hiện văn bản tạm thời / placeholder chưa hoàn thiện (ví dụ: Lorem Ipsum, [tên công ty]).'
          : 'Placeholder text detected (e.g., Lorem Ipsum, [company name]).',
      );
      recommendations.push({
        title: isVi ? 'Thay thế placeholder' : 'Replace placeholder',
        description: isVi
          ? 'Thay thế tất cả các placeholder và văn bản tạm thời bằng thông tin thực tế của bạn trước khi nộp.'
          : 'Replace all placeholders and temporary text with your actual information before submitting.',
        category: 'formatting',
        severity: 'high',
        actionable: true,
      });
    }

    // 2. Length check
    let totalWordCount = 0;
    for (const sec of sections) {
      const text = JSON.stringify(sec.content || '');
      totalWordCount += text.split(/\s+/).filter(Boolean).length;
    }

    if (totalWordCount < 100) {
      score -= 20;
      findings.push(
        isVi
          ? `CV quá ngắn (${totalWordCount} từ), thiếu thông tin trầm trọng.`
          : `CV is too short (${totalWordCount} words), severely lacking information.`,
      );
      recommendations.push({
        title: isVi ? 'Bổ sung dung lượng CV' : 'Add more content to CV',
        description: isVi
          ? 'Bổ sung thêm mô tả dự án và chi tiết kinh nghiệm làm việc để đạt ít nhất 300 từ.'
          : 'Add more project descriptions and work experience details to reach at least 300 words.',
        category: 'formatting',
        severity: 'high',
        actionable: true,
      });
    } else if (totalWordCount > 1200) {
      score -= 10;
      findings.push(
        isVi
          ? `CV có dung lượng lớn (${totalWordCount} từ), hãy cân nhắc thu gọn.`
          : `CV is too long (${totalWordCount} words), consider condensing it.`,
      );
      recommendations.push({
        title: isVi ? 'Tối ưu hóa độ dài' : 'Optimize length',
        description: isVi
          ? 'Tối ưu hóa từ ngữ, làm nổi bật thành tựu chính và hạn chế mô tả rườm rà.'
          : 'Optimize phrasing, highlight key achievements, and avoid wordy descriptions.',
        category: 'formatting',
        severity: 'low',
        actionable: true,
      });
    } else {
      findings.push(
        isVi
          ? `Độ dài CV phù hợp (${totalWordCount} từ).`
          : `CV length is appropriate (${totalWordCount} words).`,
      );
    }

    // 3. Fake metrics
    const metricsPattern = /\b\d+%\b/g;
    const allMetrics: string[] = [];
    for (const sec of sections) {
      const contentStr = JSON.stringify(sec.content || '');
      const matches = contentStr.match(metricsPattern);
      if (matches) {
        allMetrics.push(...matches);
      }
    }

    const uniqueMetrics = new Set(allMetrics);
    if (allMetrics.length > 5 && uniqueMetrics.size === 1) {
      score -= 15;
      findings.push(
        isVi
          ? 'Phát hiện tỷ lệ phần trăm số liệu giống hệt nhau lặp đi lặp lại. Có nguy cơ AI tự bịa số liệu.'
          : 'Identical percentages found repeatedly. Risk of AI hallucinating metrics.',
      );
      recommendations.push({
        title: isVi ? 'Đa dạng hóa số liệu' : 'Diversify metrics',
        description: isVi
          ? 'Thay thế hoặc đa dạng hóa các số liệu thống kê để phản ánh chính xác kết quả thực tế của bạn.'
          : 'Replace or diversify statistics to accurately reflect your actual results.',
        category: 'formatting',
        severity: 'medium',
        actionable: true,
      });
    }

    score = Math.max(0, score);
    if (score === 100) {
      findings.push(
        isVi
          ? 'Định dạng và phân phối văn bản đạt chuẩn ATS.'
          : 'CV formatting and text distribution meets ATS standards.',
      );
    }

    return {
      score,
      findings,
      recommendations,
    };
  }

  private cleanAndParseJson(rawOutput: string): any {
    let cleanStr = rawOutput.trim();
    if (cleanStr.startsWith('```')) {
      cleanStr = cleanStr
        .replace(/^```(json)?/i, '')
        .replace(/```$/i, '')
        .trim();
    }
    return JSON.parse(cleanStr);
  }
}
