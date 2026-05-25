export type TemplatePreviewVariant =
  | "minimal-sidebar"
  | "classic-academic"
  | "executive"
  | "creative-designer"
  | "compact-ats"
  | "modern-profile"
  | "elegant-mono"
  | "tech-startup"
  | "finance";

export type StyleBadge = "MODERN" | "EXECUTIVE" | "CREATIVE" | "PROFESSIONAL";

export type TemplateDisplayMeta = {
  tag: "Free" | "Premium" | "Popular";
  atsScore: number;
  filterCategory: string;
  preview: TemplatePreviewVariant;
  layoutLabel: string;
  description: string;
  industry: string;
  styleBadge: StyleBadge;
  /** Gradient stage behind paper preview */
  stageClass: string;
  accentBg: string;
  accentBgHover: string;
};

const CATALOG: Record<string, TemplateDisplayMeta> = {
  "standard-ats": {
    tag: "Popular",
    atsScore: 99,
    filterCategory: "ATS Friendly",
    preview: "compact-ats",
    layoutLabel: "Compact ATS",
    description:
      "Single-column B&W layout optimized for ATS parsers and recruiter scans.",
    industry: "All industries",
    styleBadge: "PROFESSIONAL",
    stageClass: "from-zinc-100 via-neutral-50 to-stone-200",
    accentBg: "bg-[#ececec]",
    accentBgHover: "group-hover:bg-[#e2e2e2]",
  },
  "tech-classic": {
    tag: "Free",
    atsScore: 95,
    filterCategory: "Tech",
    preview: "tech-startup",
    layoutLabel: "Tech Startup",
    description:
      "Sans-serif grid with GitHub, portfolio links, and skill tags for engineers.",
    industry: "Tech & Startups",
    styleBadge: "MODERN",
    stageClass: "from-sky-50 via-slate-50 to-blue-100/80",
    accentBg: "bg-[#e8f0f5]",
    accentBgHover: "group-hover:bg-[#dce8f0]",
  },
  techstack: {
    tag: "Free",
    atsScore: 94,
    filterCategory: "Tech",
    preview: "minimal-sidebar",
    layoutLabel: "Minimal Sidebar",
    description:
      "Scandinavian-style light sidebar — contact & skills left, experience right.",
    industry: "Engineering",
    styleBadge: "MODERN",
    stageClass: "from-stone-100 via-[#f6f7f4] to-emerald-50/60",
    accentBg: "bg-[#eef0ec]",
    accentBgHover: "group-hover:bg-[#e4e8e2]",
  },
  "business-classic": {
    tag: "Free",
    atsScore: 92,
    filterCategory: "Business",
    preview: "finance",
    layoutLabel: "Finance & Consulting",
    description:
      "Conservative serif layout with aligned dates — banking & consulting ready.",
    industry: "Finance & Corporate",
    styleBadge: "EXECUTIVE",
    stageClass: "from-amber-50/80 via-stone-100 to-stone-200",
    accentBg: "bg-[#ebe4d6]",
    accentBgHover: "group-hover:bg-[#e2d9c9]",
  },
  dublin: {
    tag: "Popular",
    atsScore: 98,
    filterCategory: "Business",
    preview: "executive",
    layoutLabel: "Executive Corporate",
    description:
      "Bold header band and structured sections for senior business roles.",
    industry: "Marketing & Ops",
    styleBadge: "EXECUTIVE",
    stageClass: "from-slate-100 via-zinc-50 to-slate-200",
    accentBg: "bg-[#e8eaed]",
    accentBgHover: "group-hover:bg-[#dfe2e8]",
  },
  "design-classic": {
    tag: "Premium",
    atsScore: 88,
    filterCategory: "Creative",
    preview: "creative-designer",
    layoutLabel: "Creative Designer",
    description:
      "Asymmetric teal accent column with portfolio focus — design & media roles.",
    industry: "Design & Media",
    styleBadge: "CREATIVE",
    stageClass: "from-teal-50/90 via-cyan-50/50 to-slate-100",
    accentBg: "bg-[#e0ebe8]",
    accentBgHover: "group-hover:bg-[#d4e4df]",
  },
  nova: {
    tag: "Premium",
    atsScore: 85,
    filterCategory: "Creative",
    preview: "modern-profile",
    layoutLabel: "Modern Profile",
    description:
      "Profile photo header with soft panels and two-column experience layout.",
    industry: "Design & Media",
    styleBadge: "CREATIVE",
    stageClass: "from-indigo-50/70 via-slate-50 to-violet-50/50",
    accentBg: "bg-[#eef2f6]",
    accentBgHover: "group-hover:bg-[#e4eaf0]",
  },
  monarch: {
    tag: "Premium",
    atsScore: 88,
    filterCategory: "Creative",
    preview: "elegant-mono",
    layoutLabel: "Elegant Monochrome",
    description:
      "Editorial serif typography, luxury whitespace — fashion & premium brands.",
    industry: "Creative roles",
    styleBadge: "CREATIVE",
    stageClass: "from-neutral-100 via-zinc-50 to-neutral-200",
    accentBg: "bg-[#f0f0f0]",
    accentBgHover: "group-hover:bg-[#e6e6e6]",
  },
  minimalist: {
    tag: "Free",
    atsScore: 92,
    filterCategory: "Minimal",
    preview: "classic-academic",
    layoutLabel: "Classic Academic",
    description:
      "Centered serif header with horizontal rules — law, academia, formal roles.",
    industry: "Law & Academia",
    styleBadge: "PROFESSIONAL",
    stageClass: "from-stone-100 via-[#faf8f5] to-amber-50/40",
    accentBg: "bg-[#f2efe8]",
    accentBgHover: "group-hover:bg-[#ebe6dc]",
  },
};

const CATEGORY_FALLBACK: Record<string, Partial<TemplateDisplayMeta>> = {
  Tech: {
    filterCategory: "Tech",
    preview: "tech-startup",
    layoutLabel: "Tech Startup",
    atsScore: 93,
    tag: "Free",
    industry: "Technology",
    styleBadge: "MODERN",
    stageClass: "from-sky-50 via-slate-50 to-blue-100/80",
    accentBg: "bg-[#e8f0f5]",
    accentBgHover: "group-hover:bg-[#dce8f0]",
  },
  Business: {
    filterCategory: "Business",
    preview: "executive",
    layoutLabel: "Executive Corporate",
    atsScore: 91,
    tag: "Free",
    industry: "Business",
    styleBadge: "EXECUTIVE",
    stageClass: "from-slate-100 via-zinc-50 to-slate-200",
    accentBg: "bg-[#e8eaed]",
    accentBgHover: "group-hover:bg-[#dfe2e8]",
  },
  Design: {
    filterCategory: "Creative",
    preview: "creative-designer",
    layoutLabel: "Creative Designer",
    atsScore: 87,
    tag: "Premium",
    industry: "Design",
    styleBadge: "CREATIVE",
    stageClass: "from-teal-50/90 via-cyan-50/50 to-slate-100",
    accentBg: "bg-[#e0ebe8]",
    accentBgHover: "group-hover:bg-[#d4e4df]",
  },
};

export const STYLE_BADGE_CLASSES: Record<
  StyleBadge,
  { bg: string; text: string }
> = {
  MODERN: { bg: "bg-violet-100", text: "text-violet-700" },
  EXECUTIVE: { bg: "bg-amber-100", text: "text-amber-800" },
  CREATIVE: { bg: "bg-fuchsia-100", text: "text-fuchsia-700" },
  PROFESSIONAL: { bg: "bg-emerald-100", text: "text-emerald-800" },
};

export const TEMPLATE_FILTER_CATEGORIES = [
  "Tất cả",
  "ATS Friendly",
  "Tech",
  "Business",
  "Creative",
  "Minimal",
] as const;

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
    preview: fallback?.preview ?? "compact-ats",
    layoutLabel: fallback?.layoutLabel ?? "Professional",
    description:
      fallback?.description ??
      "Mẫu CV chuẩn hóa, sẵn sàng chỉnh sửa và xuất bản.",
    industry: fallback?.industry ?? categoryName ?? "General",
    styleBadge: fallback?.styleBadge ?? "PROFESSIONAL",
    stageClass: fallback?.stageClass ?? "from-slate-100 via-slate-50 to-slate-200",
    accentBg: fallback?.accentBg ?? "bg-slate-200",
    accentBgHover: fallback?.accentBgHover ?? "group-hover:bg-slate-300",
  };
}
