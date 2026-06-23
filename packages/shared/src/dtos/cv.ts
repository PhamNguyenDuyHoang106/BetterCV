export type CvSectionType =
  | "PROFILE"
  | "SUMMARY"
  | "EXPERIENCE"
  | "EDUCATION"
  | "SKILLS"
  | "PROJECTS"
  | "LANGUAGES"
  | "CERTIFICATIONS"
  | "AWARDS";

export type CvCreateDto = {
  title: string;
  locale: "en" | "vi";
  templateId?: string;
};

export type CvUpdateDto = {
  title?: string;
  locale?: "en" | "vi";
  templateId?: string;
  version?: number;
};

export type CvSectionUpsertDto = {
  id?: string;
  type: CvSectionType;
  content: Record<string, unknown>;
  order: number;
  version?: number;
};
