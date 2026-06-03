import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AtsRule, AtsRuleResult } from './rules/ats-rule.interface';
import { KeywordRule } from './rules/keyword-rule';
import { CompletenessRule } from './rules/completeness-rule';
import { FormattingRule } from './rules/formatting-rule';

const ATS_ENGINE_VERSION = process.env.ATS_ENGINE_VERSION || '1.0.0';

@Injectable()
export class AtsService {
  private readonly rules: AtsRule[] = [];

  constructor(private prisma: PrismaService) {
    // Register ATS Evaluation Rules
    this.rules.push(new KeywordRule());
    this.rules.push(new CompletenessRule());
    this.rules.push(new FormattingRule());
  }

  async evaluateCv(supabaseId: string, cvId: string, jobDescription: string) {
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

    const ruleResults: AtsRuleResult[] = [];

    // Evaluate all registered rules
    for (const rule of this.rules) {
      const result = await rule.evaluate(cv, jobDescription);
      ruleResults.push(result);
    }

    // Calculate total weighted score
    let totalScore = 0;
    let totalWeight = 0;

    for (const res of ruleResults) {
      totalScore += res.score * res.weight;
      totalWeight += res.weight;
    }

    const finalScore =
      totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

    // Extract sub-scores for detailed historical analysis
    const keywordRes = ruleResults.find(
      (r) => r.ruleName.includes('Từ khóa') || r.ruleName.includes('Keywords'),
    );
    const completenessRes = ruleResults.find(
      (r) =>
        r.ruleName.includes('hoàn thiện') ||
        r.ruleName.includes('Completeness'),
    );
    const formatRes = ruleResults.find(
      (r) =>
        r.ruleName.includes('Định dạng') || r.ruleName.includes('Formatting'),
    );

    const keywordScore = keywordRes ? keywordRes.score : null;
    const completenessScore = completenessRes ? completenessRes.score : null;
    const formatScore = formatRes ? formatRes.score : null;

    // Parse missing keywords from findings list for future recommendations, limiting to 20 items to prevent DB bloating
    let missingKeywords: string[] = [];
    if (keywordRes && keywordRes.findings) {
      const missingFinding = keywordRes.findings.find((f: string) =>
        f.startsWith('Từ khóa còn thiếu:'),
      );
      if (missingFinding) {
        missingKeywords = missingFinding
          .replace('Từ khóa còn thiếu:', '')
          .split(',')
          .map((k: string) => k.trim().replace('...', ''))
          .filter(Boolean)
          .slice(0, 20);
      }
    }

    // Convert findings and recommendations to structured Recommendation models
    const structuredRecommendations: any[] = [];
    let recIdCounter = 1;

    for (const res of ruleResults) {
      let category: 'ATS' | 'CONTENT' | 'FORMAT' | 'KEYWORD' = 'ATS';
      if (
        res.ruleName.includes('hoàn thiện') ||
        res.ruleName.includes('Completeness')
      ) {
        category = 'CONTENT';
      } else if (
        res.ruleName.includes('Từ khóa') ||
        res.ruleName.includes('Keywords')
      ) {
        category = 'KEYWORD';
      } else if (
        res.ruleName.includes('Định dạng') ||
        res.ruleName.includes('Formatting')
      ) {
        category = 'FORMAT';
      }

      for (const recText of res.recommendations) {
        if (!recText || recText.trim() === '') continue;

        let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
        let title = 'Cải thiện CV';
        let actionable = true;

        if (
          recText.includes('Thiếu phần') ||
          recText.includes('Quan trọng') ||
          recText.includes('Vui lòng thêm') ||
          recText.includes('tối thiểu')
        ) {
          severity = 'HIGH';
          title = 'Yêu cầu bổ sung phần chính';
        } else if (
          recText.includes('Tuyệt vời') ||
          recText.includes('rất đầy đủ') ||
          recText.includes('Chuẩn') ||
          recText.includes('Hoàn hảo')
        ) {
          severity = 'LOW';
          title = 'Đánh giá tốt';
          actionable = false;
        } else if (recText.includes('Từ khóa')) {
          severity = 'HIGH';
          title = 'Thiếu từ khóa quan trọng';
        } else if (
          recText.includes('đo độ dài') ||
          recText.includes('mô tả') ||
          recText.includes('Bổ sung mô tả')
        ) {
          severity = 'MEDIUM';
          title = 'Tối ưu hóa mô tả kinh nghiệm';
        }

        if (recText.length < 40) {
          title = recText;
        }

        // Cap recommendation description size to avoid runaway AI payloads
        const cleanDescription =
          recText.length > 1000 ? recText.substring(0, 1000) + '...' : recText;

        structuredRecommendations.push({
          id: `rec-${category.toLowerCase()}-${recIdCounter++}`,
          category,
          severity,
          title,
          description: cleanDescription,
          actionable,
        });
      }
    }

    // Cap to max 20 recommendations to avoid database bloating from abnormal AI outputs
    const finalRecommendations = structuredRecommendations.slice(0, 20);

    // Extract a descriptive Job Title from the first line of the JD
    let jobTitle = 'Vị trí công việc';
    if (jobDescription) {
      const firstLine = jobDescription.split('\n')[0].trim();
      jobTitle =
        firstLine.length > 80 ? firstLine.slice(0, 80) + '...' : firstLine;
    }

    // Persist detailed ATS Scan history to DB inside a transaction to ensure atomic consistency
    await this.prisma.$transaction(
      async (tx) => {
        // Row-lock the parent Cv record using SELECT FOR UPDATE to serialize concurrent scans for this CV and prevent race conditions.
        await tx.$executeRaw`SELECT * FROM "Cv" WHERE "id" = ${cvId} FOR UPDATE;`;

        await tx.atsScan.create({
          data: {
            cvId,
            jobTitle,
            jobDescription,
            overallScore: finalScore,
            keywordScore,
            completenessScore,
            formatScore,
            missingKeywords: missingKeywords as any,
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
        timeout: 30000, // 30-second timeout to handle sequential queueing under high concurrency locks
      },
    );

    // Generate general findings list
    const allFindings = ruleResults.flatMap((r) => r.findings);

    return {
      success: true,
      data: {
        cvId,
        score: finalScore,
        rulesEvaluated: ruleResults.map((r) => ({
          ruleName: r.ruleName,
          score: r.score,
          weight: r.weight,
          findings: r.findings,
        })),
        findings: allFindings,
        recommendations: finalRecommendations,
        evaluatedAt: new Date().toISOString(),
      },
    };
  }
}
