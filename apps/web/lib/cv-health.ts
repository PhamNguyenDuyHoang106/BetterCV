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
  switch (status) {
    case "Draft":
      return {
        label: "Bản nháp",
        colorClass: "bg-rose-50 text-rose-700 border-rose-200",
        dotClass: "bg-rose-500",
        description: "Cần bổ sung Thông tin cá nhân & Kinh nghiệm làm việc để sẵn sàng.",
      };
    case "Improve":
      return {
        label: "Cần cải thiện",
        colorClass: "bg-amber-50 text-amber-700 border-amber-200",
        dotClass: "bg-amber-500",
        description: "Điểm hoàn thiện tốt nhưng hãy nâng cấp thêm thông tin để tối ưu ATS.",
      };
    case "Ready":
      return {
        label: "Sẵn sàng ứng tuyển",
        colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dotClass: "bg-emerald-500",
        description: "CV đã đầy đủ các phần cốt lõi và sẵn sàng xuất bản gửi nhà tuyển dụng.",
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

