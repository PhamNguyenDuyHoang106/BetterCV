import { useLanguageStore } from "./store/language";
import { translations } from "./translations";

export type CvHealthStatus = "Draft" | "Improve" | "Ready";

export type CvForHealth = {
  atsScore?: number | null;
  completenessScore?: number | null;
  sections?: Array<{
    type: string;
    content: any;
  }>;
};

export function getCvHealth(cv: CvForHealth): CvHealthStatus {
  const score = cv.completenessScore ?? cv.atsScore ?? 0;

  // Check if Experience exists and is not empty
  const experienceSection = cv.sections?.find((s) => s.type === "EXPERIENCE");
  const experienceContent = experienceSection?.content;
  const hasExperience =
    experienceContent &&
    (Array.isArray(experienceContent)
      ? experienceContent.length > 0
      : Array.isArray(experienceContent.items)
        ? experienceContent.items.length > 0
        : false);

  // Check if Profile/Personal exists and has a fullName
  const profileSection = cv.sections?.find((s) => s.type === "PROFILE");
  const profileContent = profileSection?.content;
  const hasProfile = profileContent && profileContent.fullName && profileContent.fullName.trim().length > 0;

  if (!hasProfile || !hasExperience || score < 60) {
    return "Draft";
  }

  if (score < 85) {
    return "Improve";
  }

  return "Ready";
}

export function getCvHealthDetails(status: CvHealthStatus) {
  const lang = useLanguageStore.getState().language || "vi";
  const t = translations[lang];

  switch (status) {
    case "Draft":
      return {
        label: t.cvHealth.draft,
        colorClass: "bg-rose-50 text-rose-700 border-rose-200",
        dotClass: "bg-rose-500",
        description: t.cvHealth.draftDesc,
      };
    case "Improve":
      return {
        label: t.cvHealth.improve,
        colorClass: "bg-amber-50 text-amber-700 border-amber-200",
        dotClass: "bg-amber-500",
        description: t.cvHealth.improveDesc,
      };
    case "Ready":
      return {
        label: t.cvHealth.ready,
        colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dotClass: "bg-emerald-500",
        description: t.cvHealth.readyDesc,
      };
  }
}

export function assembleResumeDataFromSections(sections: any[]): any {
  const data: Record<string, any> = { schemaVersion: 1 };
  for (const sec of sections || []) {
    data[sec.type.toLowerCase()] = sec.content;
  }
  // Extract theme from profile if available
  if (data.profile) {
    data.theme = data.profile.theme;
  }
  return data;
}

export function isRenderableCv(cv: CvForHealth): boolean {
  if (!cv.sections || cv.sections.length === 0) return false;

  let nonEmptySectionCount = 0;
  let hasExperience = false;
  let hasEducation = false;

  for (const section of cv.sections) {
    const type = section.type;
    const content = section.content as any;
    if (!content) continue;

    let isEmpty = true;
    if (type === 'PROFILE') {
      if (content.fullName && content.fullName.trim()) {
        isEmpty = false;
      }
    } else if (type === 'SUMMARY') {
      const text = content.text || content.objective || '';
      if (text.trim()) {
        isEmpty = false;
      }
    } else {
      const items =
        content.items || (Array.isArray(content) ? content : null);
      if (items && Array.isArray(items) && items.length > 0) {
        isEmpty = false;
      }
    }

    if (!isEmpty) {
      nonEmptySectionCount++;
      if (type === 'EXPERIENCE') hasExperience = true;
      if (type === 'EDUCATION') hasEducation = true;
    }
  }

  return nonEmptySectionCount >= 3 && (hasExperience || hasEducation);
}
