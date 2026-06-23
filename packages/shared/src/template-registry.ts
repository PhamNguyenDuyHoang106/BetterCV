export type TemplateCategoryCode = "TECH" | "BUSINESS" | "DESIGN";
export type TemplateCategoryName = "Tech" | "Business" | "Design";
export type TemplateFilterCategory =
  | "ATS Friendly"
  | "Business"
  | "Creative"
  | "Student"
  | "Tech"
  | "Startup";
export type TemplateTag = "Free" | "Premium" | "Popular";
export type TemplateStyleBadge =
  | "MODERN"
  | "EXECUTIVE"
  | "CREATIVE"
  | "PROFESSIONAL";

export type TemplateRegistryEntry = {
  id: string;
  name: string;
  categoryCode: TemplateCategoryCode;
  categoryName: TemplateCategoryName;
  tag: TemplateTag;
  atsScore: number;
  filterCategory: TemplateFilterCategory;
  layoutLabel: string;
  description: string;
  industry: string;
  styleBadge: TemplateStyleBadge;
  stageClass: string;
  accentBg: string;
  accentBgHover: string;
  isDefault?: boolean;
};

export const TEMPLATE_REGISTRY: TemplateRegistryEntry[] = [
  {
    id: "ironclad-ats",
    name: "Tiêu chuẩn (ATS)",
    categoryCode: "BUSINESS",
    categoryName: "Business",
    tag: "Popular",
    atsScore: 98,
    filterCategory: "ATS Friendly",
    layoutLabel: "Tiêu chuẩn (ATS)",
    description:
      "Bố cục một cột chuẩn hóa với ảnh chân dung bên trái, tối ưu hóa tối đa cho các hệ thống lọc ATS và dễ đọc.",
    industry: "Mọi ngành nghề / General",
    styleBadge: "PROFESSIONAL",
    stageClass: "from-zinc-100 via-neutral-50 to-stone-200",
    accentBg: "bg-[#ececec]",
    accentBgHover: "group-hover:bg-[#e2e2e2]",
    isDefault: true,
  },
  {
    id: "synergy-pro",
    name: "Thanh lịch (Professional)",
    categoryCode: "BUSINESS",
    categoryName: "Business",
    tag: "Free",
    atsScore: 92,
    filterCategory: "Business",
    layoutLabel: "Thanh lịch (Professional)",
    description:
      "Thiết kế cột lệch thanh nhã với các điểm nhấn và đường phân tách màu đỏ tinh tế, phù hợp cho quản lý, kế toán.",
    industry: "Kế toán, Nhân sự, Sales / Business",
    styleBadge: "PROFESSIONAL",
    stageClass: "from-red-50/35 via-stone-50 to-stone-100",
    accentBg: "bg-[#fee2e2]",
    accentBgHover: "group-hover:bg-[#fecaca]",
  },
  {
    id: "pinnacle-executive",
    name: "Ấn tượng (Executive)",
    categoryCode: "BUSINESS",
    categoryName: "Business",
    tag: "Premium",
    atsScore: 88,
    filterCategory: "Business",
    layoutLabel: "Ấn tượng (Executive)",
    description:
      "Cột bên trái chiếm 35% diện tích có màu nâu sậm nổi bật, tích hợp ảnh chân dung tròn viền trắng lớn ấn tượng.",
    industry: "Quản lý cấp cao, Marketing / Management",
    styleBadge: "EXECUTIVE",
    stageClass: "from-[#4a3728]/10 via-stone-50 to-amber-50/30",
    accentBg: "bg-[#f5ebe0]",
    accentBgHover: "group-hover:bg-[#e3d5ca]",
  },
  {
    id: "strategy-pro",
    name: "Dòng thời gian (Modern)",
    categoryCode: "DESIGN",
    categoryName: "Design",
    tag: "Popular",
    atsScore: 91,
    filterCategory: "ATS Friendly",
    layoutLabel: "Dòng thời gian (Timeline)",
    description:
      "Bố cục lịch trình sự nghiệp chạy dọc theo đường trục timeline liên kết các dấu mốc thời gian rõ ràng.",
    industry: "Dự án, Phát triển sản phẩm / Consulting",
    styleBadge: "PROFESSIONAL",
    stageClass: "from-blue-50/40 via-slate-50 to-sky-100/40",
    accentBg: "bg-[#dbeafe]",
    accentBgHover: "group-hover:bg-[#bfdbfe]",
  },
  {
    id: "block-minimalist",
    name: "Notion Minimalist (Student)",
    categoryCode: "DESIGN",
    categoryName: "Design",
    tag: "Free",
    atsScore: 95,
    filterCategory: "Student",
    layoutLabel: "Notion Minimalist",
    description:
      "Thiết kế wiki tối giản lấy cảm hứng từ các block Notion, sử dụng các hộp callout nền xám làm nổi bật thông tin.",
    industry: "Sinh viên, Thực tập sinh / Students",
    styleBadge: "MODERN",
    stageClass: "from-stone-50 via-neutral-100 to-stone-200",
    accentBg: "bg-[#ececec]",
    accentBgHover: "group-hover:bg-[#e2e2e2]",
  },
  {
    id: "linear-tech",
    name: "Linear Tech (Tech)",
    categoryCode: "TECH",
    categoryName: "Tech",
    tag: "Popular",
    atsScore: 96,
    filterCategory: "Tech",
    layoutLabel: "Linear Tech",
    description:
      "Giao diện tối giản tông tối lấy cảm hứng từ Linear.app, cấu trúc khung lưới sắc bén dành cho lập trình viên.",
    industry: "Phát triển phần mềm / Software Engineers",
    styleBadge: "MODERN",
    stageClass: "from-slate-900 via-slate-950 to-zinc-900",
    accentBg: "bg-slate-800",
    accentBgHover: "group-hover:bg-slate-700",
  },
  {
    id: "ai-builder",
    name: "AI Builder (Tech)",
    categoryCode: "TECH",
    categoryName: "Tech",
    tag: "Free",
    atsScore: 91,
    filterCategory: "Tech",
    layoutLabel: "AI Builder",
    description:
      "Bố cục cột bên phải chuyên biệt liệt kê hệ thống LLM, prompt workflows và các dự án AI era nổi bật.",
    industry: "AI/ML Engineers, Data / AI Specialist",
    styleBadge: "MODERN",
    stageClass: "from-emerald-50/40 via-teal-50 to-slate-100",
    accentBg: "bg-[#e6f4ea]",
    accentBgHover: "group-hover:bg-[#d2eccd]",
  },
  {
    id: "glass-resume",
    name: "Glass Vision (Creative)",
    categoryCode: "DESIGN",
    categoryName: "Design",
    tag: "Premium",
    atsScore: 85,
    filterCategory: "Creative",
    layoutLabel: "Glass Vision",
    description:
      "Hiệu ứng kính mờ VisionOS với các thẻ thông tin nổi trong suốt, tạo cảm giác hiện đại và khác biệt.",
    industry: "Thiết kế 3D, Spatial, Frontend / UX Designers",
    styleBadge: "CREATIVE",
    stageClass: "from-[#0f172a] via-[#1e1b4b] to-[#0f172a]",
    accentBg: "bg-slate-800/80",
    accentBgHover: "group-hover:bg-slate-700/80",
  },
  {
    id: "startup-operator",
    name: "Startup Operator (Startup)",
    categoryCode: "BUSINESS",
    categoryName: "Business",
    tag: "Free",
    atsScore: 95,
    filterCategory: "Startup",
    layoutLabel: "Startup Operator",
    description:
      "Bố cục mật độ cao lấy cảm hứng startup, nhấn vào KPIs, impact và khả năng vận hành tăng trưởng.",
    industry: "Growth, Product, Operations / YC Applicants",
    styleBadge: "MODERN",
    stageClass: "from-orange-50 via-amber-50 to-orange-100",
    accentBg: "bg-[#ffedd5]",
    accentBgHover: "group-hover:bg-[#fed7aa]",
  },
];

export const DEFAULT_TEMPLATE_REGISTRY_ENTRY =
  TEMPLATE_REGISTRY.find((entry) => entry.isDefault) ?? TEMPLATE_REGISTRY[0];

export const DEFAULT_TEMPLATE_ID = DEFAULT_TEMPLATE_REGISTRY_ENTRY.id;

export const TEMPLATE_REGISTRY_BY_ID = Object.fromEntries(
  TEMPLATE_REGISTRY.map((entry) => [entry.id, entry]),
) as Record<string, TemplateRegistryEntry>;

export const TEMPLATE_IDS = TEMPLATE_REGISTRY.map((entry) => entry.id);

export function getTemplateRegistryEntry(templateId?: string | null) {
  if (!templateId) return undefined;
  return TEMPLATE_REGISTRY_BY_ID[templateId];
}
