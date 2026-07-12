export const POLICY_VERSION = '1.0.0';

export enum Feature {
  CREATE_CV = "CV.CREATE",
  ATS_SCAN = "ATS.SCAN",
  AI_REWRITE = "AI.REWRITE",
  JD_OPTIMIZATION = "AI.JD_OPTIMIZATION",
  PREMIUM_TEMPLATE = "TEMPLATE.PREMIUM",
  IMPORT_CV = "IMPORT.CV",
  EXPORT_PDF_HD = "EXPORT.PDF_HD",
  
  // Career Features
  CAREER_VIEW = "CAREER.VIEW",
  CAREER_ANALYSIS = "CAREER.ANALYSIS",
  CAREER_CHAT = "CAREER.CHAT",
  CAREER_RESOURCES = "CAREER.RESOURCES",
  CAREER_PROJECTS = "CAREER.PROJECTS",
  CAREER_PROGRESS = "CAREER.PROGRESS",
  CAREER_EXPORT = "CAREER.EXPORT",
  
  COVER_LETTER = "COVER.LETTER",
  MOCK_INTERVIEW = "INTERVIEW.MOCK",
  PRIORITY_AI = "PRIORITY.AI",
  PRIORITY_SUPPORT = "PRIORITY.SUPPORT",
}

export enum QuotaKey {
  MAX_CV = "LIMIT.MAX_CV",
  MAX_DAILY_ATS = "LIMIT.MAX_DAILY_ATS",
}

export interface FeatureDefinition {
  key: Feature;
  displayNameKey: string;
  descriptionKey: string;
  requiredPlan: string;
  category: string;
}

export interface QuotaDefinition {
  key: QuotaKey;
  displayNameKey: string;
  unit: string;
  formatterKey: "count" | "tokens" | "storage";
}

export const FEATURE_DEFINITIONS: Record<Feature, FeatureDefinition> = {
  [Feature.CREATE_CV]: {
    key: Feature.CREATE_CV,
    displayNameKey: "feature.createCv.name",
    descriptionKey: "feature.createCv.desc",
    requiredPlan: "FREE",
    category: "CV",
  },
  [Feature.ATS_SCAN]: {
    key: Feature.ATS_SCAN,
    displayNameKey: "feature.atsScan.name",
    descriptionKey: "feature.atsScan.desc",
    requiredPlan: "FREE",
    category: "ATS",
  },
  [Feature.AI_REWRITE]: {
    key: Feature.AI_REWRITE,
    displayNameKey: "feature.aiRewrite.name",
    descriptionKey: "feature.aiRewrite.desc",
    requiredPlan: "PRO",
    category: "AI",
  },
  [Feature.JD_OPTIMIZATION]: {
    key: Feature.JD_OPTIMIZATION,
    displayNameKey: "feature.jdOptimization.name",
    descriptionKey: "feature.jdOptimization.desc",
    requiredPlan: "PRO",
    category: "AI",
  },
  [Feature.PREMIUM_TEMPLATE]: {
    key: Feature.PREMIUM_TEMPLATE,
    displayNameKey: "feature.premiumTemplate.name",
    descriptionKey: "feature.premiumTemplate.desc",
    requiredPlan: "PRO",
    category: "Design",
  },
  [Feature.IMPORT_CV]: {
    key: Feature.IMPORT_CV,
    displayNameKey: "feature.importCv.name",
    descriptionKey: "feature.importCv.desc",
    requiredPlan: "PRO",
    category: "CV",
  },
  [Feature.EXPORT_PDF_HD]: {
    key: Feature.EXPORT_PDF_HD,
    displayNameKey: "feature.exportPdfHd.name",
    descriptionKey: "feature.exportPdfHd.desc",
    requiredPlan: "PRO",
    category: "Export",
  },
  [Feature.CAREER_VIEW]: {
    key: Feature.CAREER_VIEW,
    displayNameKey: "feature.careerView.name",
    descriptionKey: "feature.careerView.desc",
    requiredPlan: "PREMIUM",
    category: "Career",
  },
  [Feature.CAREER_ANALYSIS]: {
    key: Feature.CAREER_ANALYSIS,
    displayNameKey: "feature.careerAnalysis.name",
    descriptionKey: "feature.careerAnalysis.desc",
    requiredPlan: "PREMIUM",
    category: "Career",
  },
  [Feature.CAREER_CHAT]: {
    key: Feature.CAREER_CHAT,
    displayNameKey: "feature.careerChat.name",
    descriptionKey: "feature.careerChat.desc",
    requiredPlan: "PREMIUM",
    category: "Career",
  },
  [Feature.CAREER_RESOURCES]: {
    key: Feature.CAREER_RESOURCES,
    displayNameKey: "feature.careerResources.name",
    descriptionKey: "feature.careerResources.desc",
    requiredPlan: "PREMIUM",
    category: "Career",
  },
  [Feature.CAREER_PROJECTS]: {
    key: Feature.CAREER_PROJECTS,
    displayNameKey: "feature.careerProjects.name",
    descriptionKey: "feature.careerProjects.desc",
    requiredPlan: "PREMIUM",
    category: "Career",
  },
  [Feature.CAREER_PROGRESS]: {
    key: Feature.CAREER_PROGRESS,
    displayNameKey: "feature.careerProgress.name",
    descriptionKey: "feature.careerProgress.desc",
    requiredPlan: "PREMIUM",
    category: "Career",
  },
  [Feature.CAREER_EXPORT]: {
    key: Feature.CAREER_EXPORT,
    displayNameKey: "feature.careerExport.name",
    descriptionKey: "feature.careerExport.desc",
    requiredPlan: "PREMIUM",
    category: "Export",
  },
  [Feature.COVER_LETTER]: {
    key: Feature.COVER_LETTER,
    displayNameKey: "feature.coverLetter.name",
    descriptionKey: "feature.coverLetter.desc",
    requiredPlan: "PREMIUM",
    category: "AI",
  },
  [Feature.MOCK_INTERVIEW]: {
    key: Feature.MOCK_INTERVIEW,
    displayNameKey: "feature.mockInterview.name",
    descriptionKey: "feature.mockInterview.desc",
    requiredPlan: "PREMIUM",
    category: "AI",
  },
  [Feature.PRIORITY_AI]: {
    key: Feature.PRIORITY_AI,
    displayNameKey: "feature.priorityAi.name",
    descriptionKey: "feature.priorityAi.desc",
    requiredPlan: "PREMIUM",
    category: "AI",
  },
  [Feature.PRIORITY_SUPPORT]: {
    key: Feature.PRIORITY_SUPPORT,
    displayNameKey: "feature.prioritySupport.name",
    descriptionKey: "feature.prioritySupport.desc",
    requiredPlan: "PREMIUM",
    category: "Support",
  },
};

export const QUOTA_DEFINITIONS: Record<QuotaKey, QuotaDefinition> = {
  [QuotaKey.MAX_CV]: {
    key: QuotaKey.MAX_CV,
    displayNameKey: "quota.maxCv.name",
    unit: "count",
    formatterKey: "count",
  },
  [QuotaKey.MAX_DAILY_ATS]: {
    key: QuotaKey.MAX_DAILY_ATS,
    displayNameKey: "quota.maxDailyAts.name",
    unit: "count",
    formatterKey: "count",
  },
};

export const PLAN_ENTITLEMENTS: Record<string, ReadonlySet<Feature>> = {
  FREE: new Set([Feature.CREATE_CV, Feature.ATS_SCAN, Feature.AI_REWRITE]),
  PRO: new Set([
    Feature.CREATE_CV,
    Feature.ATS_SCAN,
    Feature.AI_REWRITE,
    Feature.JD_OPTIMIZATION,
    Feature.PREMIUM_TEMPLATE,
    Feature.IMPORT_CV,
    Feature.EXPORT_PDF_HD,
  ]),
  PREMIUM: new Set([
    Feature.CREATE_CV,
    Feature.ATS_SCAN,
    Feature.AI_REWRITE,
    Feature.JD_OPTIMIZATION,
    Feature.PREMIUM_TEMPLATE,
    Feature.IMPORT_CV,
    Feature.EXPORT_PDF_HD,
    Feature.CAREER_VIEW,
    Feature.CAREER_ANALYSIS,
    Feature.CAREER_CHAT,
    Feature.CAREER_RESOURCES,
    Feature.CAREER_PROJECTS,
    Feature.CAREER_PROGRESS,
    Feature.CAREER_EXPORT,
    Feature.COVER_LETTER,
    Feature.MOCK_INTERVIEW,
    Feature.PRIORITY_AI,
    Feature.PRIORITY_SUPPORT,
  ]),
  ADMIN: new Set(Object.values(Feature)),
};

// Freeze the sets to guarantee runtime immutability
Object.freeze(PLAN_ENTITLEMENTS.FREE);
Object.freeze(PLAN_ENTITLEMENTS.PRO);
Object.freeze(PLAN_ENTITLEMENTS.PREMIUM);
Object.freeze(PLAN_ENTITLEMENTS.ADMIN);
Object.freeze(PLAN_ENTITLEMENTS);
Object.freeze(FEATURE_DEFINITIONS);
Object.freeze(QUOTA_DEFINITIONS);
