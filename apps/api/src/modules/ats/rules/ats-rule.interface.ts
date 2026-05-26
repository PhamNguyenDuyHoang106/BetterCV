export interface AtsRuleResult {
  ruleName: string;
  score: number; // 0 to 100
  weight: number; // weight multiplier (e.g., 0.4 for keywords, 0.3 for completeness)
  findings: string[];
  recommendations: string[];
}

export interface AtsRule {
  evaluate(cvData: any, jobDescription: string): Promise<AtsRuleResult>;
}
