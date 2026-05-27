import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AtsRule, AtsRuleResult } from './rules/ats-rule.interface';
import { KeywordRule } from './rules/keyword-rule';
import { CompletenessRule } from './rules/completeness-rule';
import { FormattingRule } from './rules/formatting-rule';

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

    // Generate general analysis
    const allFindings = ruleResults.flatMap((r) => r.findings);
    const allRecommendations = ruleResults.flatMap((r) => r.recommendations);

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
        recommendations: allRecommendations,
        evaluatedAt: new Date().toISOString(),
      },
    };
  }
}
