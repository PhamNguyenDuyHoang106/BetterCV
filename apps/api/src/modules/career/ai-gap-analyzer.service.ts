import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { z } from 'zod';

const GapAnalysisSchema = z.object({
  explanation: z.string(),
  skills: z.array(
    z.object({
      skillId: z.string(),
      priorityLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']),
      reason: z.string(),
      estimatedWeeks: z.number().int().min(1).max(52),
    })
  ),
});

export interface GapAnalysisResult {
  explanation: string;
  skills: Array<{
    skillId: string;
    priorityLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
    estimatedWeeks: number;
  }>;
}

@Injectable()
export class AiGapAnalyzerService {
  private readonly logger = new Logger(AiGapAnalyzerService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  /**
   * Analyzes missing keywords and filters matching skills from our database.
   * Runs validation using Zod to prevent data mismatch.
   */
  async analyzeGaps(
    userId: string,
    missingKeywords: string[],
    targetRole: string,
    locale = 'vi',
  ): Promise<GapAnalysisResult> {
    if (!missingKeywords || missingKeywords.length === 0) {
      return {
        skills: [],
        explanation: locale === 'vi'
          ? 'CV của bạn đã bao phủ đầy đủ các kỹ năng cốt lõi được yêu cầu.'
          : 'Your CV already covers all core requested skills.',
      };
    }

    // 1. Fetch the user's supabaseId to call AiService
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { supabaseId: true },
    });
    if (!user || !user.supabaseId) {
      throw new BadRequestException('User Supabase ID not found');
    }

    // 2. Fetch all active skills from our DB to provide a reference catalog
    const skillCatalog = await this.prisma.skill.findMany({
      select: {
        id: true,
        name: true,
        category: true,
      },
    });

    const isVi = locale === 'vi';

    // 3. Build prompts for OpenAI
    const systemPrompt = `You are an expert technical recruiter and career coach.
Your task is to review the list of missing keywords extracted from a Job Description (JD) and select only the highly relevant skills from our database catalog that are necessary to transition to the target role.

RULES:
1. Compare "missingKeywords" with the "targetRole" and filter for skills that actually matter for this role.
2. Select skills ONLY from the provided "skillCatalog". Use the exact "id" from the catalog.
3. If no matching or related skill is found in the catalog for a missing keyword, do NOT invent a skill ID. Just skip it.
4. Provide a personalized "explanation" in the language matching the requested locale.
   Requested Locale: "${isVi ? 'Vietnamese (vi)' : 'English (en)'}".
   Write the explanation in ${isVi ? 'Vietnamese' : 'English'}.
5. Do NOT include arbitrary match percentages (like "72%" or "85%") or fake score numbers in the "explanation". Keep it professional, qualitative, and encouraging. Focus on what competency gaps are present and how the roadmap will help close them.
6. For each selected skill, assign:
   - "priorityLevel": 'HIGH' | 'MEDIUM' | 'LOW' (critical core gaps should be HIGH, nice-to-haves should be LOW)
   - "reason": A brief 1-sentence explanation of why this skill is needed for the target role (in the requested locale language).
   - "estimatedWeeks": Estimated study duration in weeks (1 to 52).
7. Return ONLY a valid JSON object matching the schema below.
8. Do NOT wrap the JSON in markdown code blocks. Just return the raw JSON object.

JSON SCHEMA:
{
  "explanation": "string",
  "skills": [
    {
      "skillId": "catalog_cuid_id",
      "priorityLevel": "HIGH",
      "reason": "Docker is crucial for containerization and consistency across backend environments.",
      "estimatedWeeks": 2
    }
  ]
}`;

    const userPrompt = `MISSING KEYWORDS FROM ATS:
${JSON.stringify(missingKeywords)}

TARGET ROLE:
"${targetRole}"

SKILL CATALOG (Available skills in our database):
${JSON.stringify(skillCatalog)}`;

    try {
      const response = await this.aiService.generateDirect(
        user.supabaseId,
        systemPrompt,
        userPrompt,
        { missingKeywords, targetRole, locale },
        0.2,
      );

      let parsedOutput: any;
      if (typeof response === 'string') {
        parsedOutput = this.cleanAndParseJson(response);
      } else if (typeof response === 'object' && response !== null) {
        if ('raw' in response && typeof (response as any).raw === 'string') {
          parsedOutput = this.cleanAndParseJson((response as any).raw);
        } else if ('text' in response && typeof (response as any).text === 'string') {
          parsedOutput = this.cleanAndParseJson((response as any).text);
        } else {
          parsedOutput = response;
        }
      } else {
        parsedOutput = {};
      }

      // 4. Validate output using Zod
      const validated = GapAnalysisSchema.parse(parsedOutput);

      // Verify that all returned skill IDs actually exist in our database catalog to prevent AI hallucination
      const dbIds = new Set(skillCatalog.map(s => s.id));
      validated.skills = validated.skills.filter(s => dbIds.has(s.skillId));

      return validated as GapAnalysisResult;
    } catch (err: any) {
      this.logger.error(`AI Gap Analysis failed: ${err.message}. Returning fallback.`);
      
      // Safe fallback if AI fails or validation fails
      return {
        skills: [],
        explanation: isVi
          ? 'Không thể phân tích tự động lộ trình. Vui lòng kiểm tra lại sau.'
          : 'Could not automatically analyze roadmap. Please check again later.',
      };
    }
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
