export type AiGenerateRequestDto = {
  locale: "en" | "vi";
  userProfile: Record<string, unknown>;
  jobDescription?: string;
};

export type AiRewriteRequestDto = {
  locale: "en" | "vi";
  sectionType: string;
  content: Record<string, unknown>;
  style: "professional" | "concise" | "ats";
};

export type AiScoreRequestDto = {
  locale: "en" | "vi";
  cvContent: Record<string, unknown>;
  jobDescription: string;
};
