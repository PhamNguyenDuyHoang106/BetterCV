export type CvSectionType =
  | "PROFILE"
  | "SUMMARY"
  | "EXPERIENCE"
  | "EDUCATION"
  | "SKILLS"
  | "PROJECTS";

export type CvCreateDto = {
  title: string;
  locale: "en" | "vi";
  templateId?: string;
};

export type CvUpdateDto = Partial<CvCreateDto>;

export type CvSectionUpsertDto = {
  id?: string;
  type: CvSectionType;
  content: Record<string, unknown>;
  order: number;
};
