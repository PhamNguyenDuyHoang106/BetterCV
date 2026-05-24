export type TemplatePreviewVariant =
  | "ats"
  | "classic"
  | "sidebar"
  | "minimal"
  | "creative"
  | "modern";

export type TemplateDisplayMeta = {
  tag: "Free" | "Premium" | "Popular";
  atsScore: number;
  filterCategory: string;
  preview: TemplatePreviewVariant;
  description: string;
};

const CATALOG: Record<string, TemplateDisplayMeta> = {
  "standard-ats": {
    tag: "Popular",
    atsScore: 99,
    filterCategory: "ATS Friendly",
    preview: "ats",
    description: "Bố cục chuẩn ATS, tối ưu cho hệ thống tuyển dụng doanh nghiệp.",
  },
  "tech-classic": {
    tag: "Free",
    atsScore: 95,
    filterCategory: "Tech",
    preview: "modern",
    description: "Dành cho kỹ sư & IT — nhấn mạnh dự án và kỹ năng kỹ thuật.",
  },
  "techstack": {
    tag: "Free",
    atsScore: 94,
    filterCategory: "Tech",
    preview: "sidebar",
    description: "Sidebar kỹ năng, phù hợp full-stack và DevOps.",
  },
  "business-classic": {
    tag: "Free",
    atsScore: 92,
    filterCategory: "Business",
    preview: "classic",
    description: "Phong cách truyền thống, phù hợp kinh doanh và quản lý.",
  },
  dublin: {
    tag: "Popular",
    atsScore: 98,
    filterCategory: "Business",
    preview: "modern",
    description: "Hiện đại, rõ ràng — phù hợp marketing và vận hành.",
  },
  "design-classic": {
    tag: "Premium",
    atsScore: 88,
    filterCategory: "Creative",
    preview: "creative",
    description: "Nổi bật portfolio sáng tạo và kinh nghiệm thiết kế.",
  },
  nova: {
    tag: "Premium",
    atsScore: 85,
    filterCategory: "Creative",
    preview: "creative",
    description: "Bố cục táo bạo cho designer và content creator.",
  },
  monarch: {
    tag: "Premium",
    atsScore: 88,
    filterCategory: "Creative",
    preview: "sidebar",
    description: "Thanh lịch, cân bằng hình ảnh và nội dung chuyên nghiệp.",
  },
  minimalist: {
    tag: "Free",
    atsScore: 92,
    filterCategory: "Minimal",
    preview: "minimal",
    description: "Tối giản, dễ đọc — phù hợp mọi ngành nghề.",
  },
};

const CATEGORY_FALLBACK: Record<string, Partial<TemplateDisplayMeta>> = {
  Tech: { filterCategory: "Tech", preview: "modern", atsScore: 93, tag: "Free" },
  Business: { filterCategory: "Business", preview: "classic", atsScore: 91, tag: "Free" },
  Design: { filterCategory: "Creative", preview: "creative", atsScore: 87, tag: "Premium" },
};

export const TEMPLATE_FILTER_CATEGORIES = [
  "Tất cả",
  "ATS Friendly",
  "Tech",
  "Business",
  "Creative",
  "Minimal",
] as const;

/** Dùng khi API chưa trả dữ liệu — khớp với prisma/seed.ts */
export const FALLBACK_TEMPLATES: Array<{
  id: string;
  name: string;
  category: { name: string };
}> = [
  { id: "standard-ats", name: "Standard ATS", category: { name: "Business" } },
  { id: "tech-classic", name: "Tech Classic", category: { name: "Tech" } },
  { id: "techstack", name: "TechStack", category: { name: "Tech" } },
  { id: "business-classic", name: "Business Classic", category: { name: "Business" } },
  { id: "dublin", name: "Dublin", category: { name: "Business" } },
  { id: "design-classic", name: "Design Classic", category: { name: "Design" } },
  { id: "nova", name: "Nova", category: { name: "Design" } },
  { id: "monarch", name: "Monarch", category: { name: "Design" } },
  { id: "minimalist", name: "Minimalist", category: { name: "Design" } },
];

export function getTemplateDisplayMeta(
  templateId: string,
  categoryName?: string,
): TemplateDisplayMeta {
  if (CATALOG[templateId]) {
    return CATALOG[templateId];
  }
  const fallback = categoryName ? CATEGORY_FALLBACK[categoryName] : undefined;
  return {
    tag: fallback?.tag ?? "Free",
    atsScore: fallback?.atsScore ?? 90,
    filterCategory: fallback?.filterCategory ?? categoryName ?? "Modern",
    preview: fallback?.preview ?? "classic",
    description:
      fallback?.description ??
      "Mẫu CV chuẩn hóa, sẵn sàng chỉnh sửa và xuất bản.",
  };
}
