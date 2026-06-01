export type TemplatePreviewVariant =
  | "minimal-sidebar"
  | "classic-academic"
  | "executive"
  | "creative-designer"
  | "compact-ats"
  | "modern-profile"
  | "elegant-mono"
  | "tech-startup"
  | "finance"
  | "london"
  | "zurich"
  | "oslo"
  | "berlin"
  | "stockholm"
  | "paris"
  | "milan"
  | "tokyo"
  | "singapore"
  | "sydney"
  | "toronto"
  | "seattle"
  | "austin"
  | "boston"
  | "chicago"
  | "amsterdam"
  | "copenhagen"
  | "vienna"
  | "geneva"
  | "prague"
  | "helsinki"
  | "barcelona-creative"
  | "hong-kong-finance"
  | "right-sidebar"
  | "split-banner"
  | "boxed-grid"
  | "orbit"
  | "comet"
  | "astralis"
  | "nebula"
  | "eclipse"
  | "right-sidebar"
  | "split-banner"
  | "boxed-grid";

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
  stageClass: string;
  accentBg: string;
  accentBgHover: string;
};

const meta = (
  partial: TemplateDisplayMeta,
): TemplateDisplayMeta => partial;

const CATALOG: Record<string, TemplateDisplayMeta> = {
  "standard-ats": meta({
    tag: "Popular",
    atsScore: 99,
    filterCategory: "ATS Friendly",
    preview: "compact-ats",
    layoutLabel: "Compact ATS",
    description: "Single-column B&W layout optimized for ATS parsers and recruiter scans.",
    industry: "All industries",
    styleBadge: "PROFESSIONAL",
    stageClass: "from-zinc-100 via-neutral-50 to-stone-200",
    accentBg: "bg-[#ececec]",
    accentBgHover: "group-hover:bg-[#e2e2e2]",
  }),
  "tech-classic": meta({
    tag: "Free",
    atsScore: 95,
    filterCategory: "Tech",
    preview: "tech-startup",
    layoutLabel: "Tech Startup",
    description: "Sans-serif grid with GitHub, portfolio links, and skill tags for engineers.",
    industry: "Tech & Startups",
    styleBadge: "MODERN",
    stageClass: "from-sky-50 via-slate-50 to-blue-100/80",
    accentBg: "bg-[#e8f0f5]",
    accentBgHover: "group-hover:bg-[#dce8f0]",
  }),
  techstack: meta({
    tag: "Free",
    atsScore: 94,
    filterCategory: "Tech",
    preview: "minimal-sidebar",
    layoutLabel: "Minimal Sidebar",
    description: "Light sidebar — contact & skills left, experience right.",
    industry: "Engineering",
    styleBadge: "MODERN",
    stageClass: "from-stone-100 via-[#f6f7f4] to-emerald-50/60",
    accentBg: "bg-[#eef0ec]",
    accentBgHover: "group-hover:bg-[#e4e8e2]",
  }),
  "business-classic": meta({
    tag: "Free",
    atsScore: 92,
    filterCategory: "Business",
    preview: "finance",
    layoutLabel: "Finance & Consulting",
    description: "Conservative serif layout with aligned dates — banking & consulting ready.",
    industry: "Finance & Corporate",
    styleBadge: "EXECUTIVE",
    stageClass: "from-amber-50/80 via-stone-100 to-stone-200",
    accentBg: "bg-[#ebe4d6]",
    accentBgHover: "group-hover:bg-[#e2d9c9]",
  }),
  dublin: meta({
    tag: "Popular",
    atsScore: 98,
    filterCategory: "Business",
    preview: "executive",
    layoutLabel: "Executive Corporate",
    description: "Bold header band and structured sections for senior business roles.",
    industry: "Marketing & Ops",
    styleBadge: "EXECUTIVE",
    stageClass: "from-slate-100 via-zinc-50 to-slate-200",
    accentBg: "bg-[#e8eaed]",
    accentBgHover: "group-hover:bg-[#dfe2e8]",
  }),
  "design-classic": meta({
    tag: "Premium",
    atsScore: 88,
    filterCategory: "Creative",
    preview: "eclipse",
    layoutLabel: "Creative Designer",
    description: "Teal accent column with portfolio focus — design & media roles.",
    industry: "Design & Media",
    styleBadge: "CREATIVE",
    stageClass: "from-teal-50/90 via-cyan-50/50 to-slate-100",
    accentBg: "bg-[#e0ebe8]",
    accentBgHover: "group-hover:bg-[#d4e4df]",
  }),
  nova: meta({
    tag: "Premium",
    atsScore: 85,
    filterCategory: "Creative",
    preview: "orbit",
    layoutLabel: "Modern Profile",
    description: "Profile photo header with soft panels and two-column experience layout.",
    industry: "Design & Media",
    styleBadge: "CREATIVE",
    stageClass: "from-indigo-50/70 via-slate-50 to-violet-50/50",
    accentBg: "bg-[#eef2f6]",
    accentBgHover: "group-hover:bg-[#e4eaf0]",
  }),
  monarch: meta({
    tag: "Premium",
    atsScore: 88,
    filterCategory: "Creative",
    preview: "comet",
    layoutLabel: "Elegant Monochrome",
    description: "Editorial serif typography, luxury whitespace — fashion & premium brands.",
    industry: "Creative roles",
    styleBadge: "CREATIVE",
    stageClass: "from-neutral-100 via-zinc-50 to-neutral-200",
    accentBg: "bg-[#f0f0f0]",
    accentBgHover: "group-hover:bg-[#e6e6e6]",
  }),
  minimalist: meta({
    tag: "Free",
    atsScore: 92,
    filterCategory: "Minimal",
    preview: "astralis",
    layoutLabel: "Classic Academic",
    description: "Centered serif header with horizontal rules — law, academia, formal roles.",
    industry: "Law & Academia",
    styleBadge: "PROFESSIONAL",
    stageClass: "from-stone-100 via-[#faf8f5] to-amber-50/40",
    accentBg: "bg-[#f2efe8]",
    accentBgHover: "group-hover:bg-[#ebe6dc]",
  }),
  london: meta({
    tag: "Popular",
    atsScore: 97,
    filterCategory: "Business",
    preview: "london",
    layoutLabel: "Executive UK",
    description: "Corporate header with leadership and achievements blocks.",
    industry: "Finance & Consulting",
    styleBadge: "EXECUTIVE",
    stageClass: "from-slate-100 via-zinc-50 to-slate-200",
    accentBg: "bg-[#e8eaed]",
    accentBgHover: "group-hover:bg-[#dfe2e8]",
  }),
  zurich: meta({
    tag: "Free",
    atsScore: 96,
    filterCategory: "Business",
    preview: "zurich",
    layoutLabel: "Swiss Finance",
    description: "Precision serif columns for banking and asset management.",
    industry: "Finance",
    styleBadge: "EXECUTIVE",
    stageClass: "from-amber-50/80 via-stone-100 to-stone-200",
    accentBg: "bg-[#ebe4d6]",
    accentBgHover: "group-hover:bg-[#e2d9c9]",
  }),
  oslo: meta({
    tag: "Free",
    atsScore: 93,
    filterCategory: "Tech",
    preview: "right-sidebar",
    layoutLabel: "Nordic Minimal",
    description: "Clean Scandinavian sidebar layout for product and engineering roles.",
    industry: "Technology",
    styleBadge: "MODERN",
    stageClass: "from-stone-100 via-[#f6f7f4] to-emerald-50/60",
    accentBg: "bg-[#eef0ec]",
    accentBgHover: "group-hover:bg-[#e4e8e2]",
  }),
  berlin: meta({
    tag: "Free",
    atsScore: 94,
    filterCategory: "Tech",
    preview: "split-banner",
    layoutLabel: "Startup Grid",
    description: "Modern tech CV with projects, GitHub, and stack highlights.",
    industry: "Startups",
    styleBadge: "MODERN",
    stageClass: "from-sky-50 via-slate-50 to-blue-100/80",
    accentBg: "bg-[#e8f0f5]",
    accentBgHover: "group-hover:bg-[#dce8f0]",
  }),
  stockholm: meta({
    tag: "Popular",
    atsScore: 98,
    filterCategory: "ATS Friendly",
    preview: "boxed-grid",
    layoutLabel: "ATS Dense",
    description: "Maximum information density while staying parser-friendly.",
    industry: "All industries",
    styleBadge: "PROFESSIONAL",
    stageClass: "from-zinc-100 via-neutral-50 to-stone-200",
    accentBg: "bg-[#ececec]",
    accentBgHover: "group-hover:bg-[#e2e2e2]",
  }),
  paris: meta({
    tag: "Premium",
    atsScore: 86,
    filterCategory: "Creative",
    preview: "split-banner",
    layoutLabel: "Paris Editorial",
    description: "High-fashion editorial typography with refined spacing.",
    industry: "Luxury & Creative",
    styleBadge: "CREATIVE",
    stageClass: "from-neutral-100 via-zinc-50 to-neutral-200",
    accentBg: "bg-[#f0f0f0]",
    accentBgHover: "group-hover:bg-[#e6e6e6]",
  }),
  milan: meta({
    tag: "Premium",
    atsScore: 87,
    filterCategory: "Creative",
    preview: "milan",
    layoutLabel: "Milan Portfolio",
    description: "Bold creative column with portfolio and awards emphasis.",
    industry: "Design",
    styleBadge: "CREATIVE",
    stageClass: "from-teal-50/90 via-cyan-50/50 to-slate-100",
    accentBg: "bg-[#e0ebe8]",
    accentBgHover: "group-hover:bg-[#d4e4df]",
  }),
  tokyo: meta({
    tag: "Premium",
    atsScore: 84,
    filterCategory: "Creative",
    preview: "tokyo",
    layoutLabel: "Tokyo Profile",
    description: "Photo-forward header with balanced two-column body.",
    industry: "Media & Design",
    styleBadge: "CREATIVE",
    stageClass: "from-indigo-50/70 via-slate-50 to-violet-50/50",
    accentBg: "bg-[#eef2f6]",
    accentBgHover: "group-hover:bg-[#e4eaf0]",
  }),
  singapore: meta({
    tag: "Free",
    atsScore: 95,
    filterCategory: "Business",
    preview: "singapore",
    layoutLabel: "Asia Executive",
    description: "Structured executive format for regional business leadership.",
    industry: "Corporate",
    styleBadge: "EXECUTIVE",
    stageClass: "from-slate-100 via-zinc-50 to-slate-200",
    accentBg: "bg-[#e8eaed]",
    accentBgHover: "group-hover:bg-[#dfe2e8]",
  }),
  sydney: meta({
    tag: "Free",
    atsScore: 93,
    filterCategory: "Tech",
    preview: "sydney",
    layoutLabel: "Pacific Tech",
    description: "Friendly tech layout with skills chips and project links.",
    industry: "Technology",
    styleBadge: "MODERN",
    stageClass: "from-sky-50 via-slate-50 to-blue-100/80",
    accentBg: "bg-[#e8f0f5]",
    accentBgHover: "group-hover:bg-[#dce8f0]",
  }),
  toronto: meta({
    tag: "Free",
    atsScore: 94,
    filterCategory: "Business",
    preview: "toronto",
    layoutLabel: "North America Corp",
    description: "Professional finance layout with clear date alignment.",
    industry: "Corporate",
    styleBadge: "EXECUTIVE",
    stageClass: "from-amber-50/80 via-stone-100 to-stone-200",
    accentBg: "bg-[#ebe4d6]",
    accentBgHover: "group-hover:bg-[#e2d9c9]",
  }),
  seattle: meta({
    tag: "Popular",
    atsScore: 96,
    filterCategory: "Tech",
    preview: "seattle",
    layoutLabel: "Pacific Northwest",
    description: "Sidebar skills + main experience — popular with PM and eng leads.",
    industry: "Tech",
    styleBadge: "MODERN",
    stageClass: "from-stone-100 via-[#f6f7f4] to-emerald-50/60",
    accentBg: "bg-[#eef0ec]",
    accentBgHover: "group-hover:bg-[#e4e8e2]",
  }),
  austin: meta({
    tag: "Free",
    atsScore: 97,
    filterCategory: "ATS Friendly",
    preview: "austin",
    layoutLabel: "ATS One-Page",
    description: "Recruiter-optimized single page with keyword-friendly sections.",
    industry: "All industries",
    styleBadge: "PROFESSIONAL",
    stageClass: "from-zinc-100 via-neutral-50 to-stone-200",
    accentBg: "bg-[#ececec]",
    accentBgHover: "group-hover:bg-[#e2e2e2]",
  }),
  boston: meta({
    tag: "Free",
    atsScore: 91,
    filterCategory: "Minimal",
    preview: "boston",
    layoutLabel: "Ivy Academic",
    description: "Formal academic structure for research and graduate roles.",
    industry: "Academia",
    styleBadge: "PROFESSIONAL",
    stageClass: "from-stone-100 via-[#faf8f5] to-amber-50/40",
    accentBg: "bg-[#f2efe8]",
    accentBgHover: "group-hover:bg-[#ebe6dc]",
  }),
  chicago: meta({
    tag: "Popular",
    atsScore: 96,
    filterCategory: "Business",
    preview: "chicago",
    layoutLabel: "Midwest Executive",
    description: "Strong header band with leadership and KPI highlights.",
    industry: "Business",
    styleBadge: "EXECUTIVE",
    stageClass: "from-slate-100 via-zinc-50 to-slate-200",
    accentBg: "bg-[#e8eaed]",
    accentBgHover: "group-hover:bg-[#dfe2e8]",
  }),
  amsterdam: meta({
    tag: "Premium",
    atsScore: 86,
    filterCategory: "Creative",
    preview: "amsterdam",
    layoutLabel: "Dutch Creative",
    description: "Color-accent sidebar for UX, brand, and visual design roles.",
    industry: "Design",
    styleBadge: "CREATIVE",
    stageClass: "from-teal-50/90 via-cyan-50/50 to-slate-100",
    accentBg: "bg-[#e0ebe8]",
    accentBgHover: "group-hover:bg-[#d4e4df]",
  }),
  copenhagen: meta({
    tag: "Premium",
    atsScore: 85,
    filterCategory: "Creative",
    preview: "copenhagen",
    layoutLabel: "Scandi Profile",
    description: "Minimal photo header with airy two-column content.",
    industry: "Design & Product",
    styleBadge: "CREATIVE",
    stageClass: "from-indigo-50/70 via-slate-50 to-violet-50/50",
    accentBg: "bg-[#eef2f6]",
    accentBgHover: "group-hover:bg-[#e4eaf0]",
  }),
  vienna: meta({
    tag: "Premium",
    atsScore: 87,
    filterCategory: "Creative",
    preview: "vienna",
    layoutLabel: "Vienna Classic",
    description: "Refined monochrome serif for arts and culture sectors.",
    industry: "Creative",
    styleBadge: "CREATIVE",
    stageClass: "from-neutral-100 via-zinc-50 to-neutral-200",
    accentBg: "bg-[#f0f0f0]",
    accentBgHover: "group-hover:bg-[#e6e6e6]",
  }),
  geneva: meta({
    tag: "Free",
    atsScore: 95,
    filterCategory: "Business",
    preview: "geneva",
    layoutLabel: "Geneva Private",
    description: "Discreet finance layout for private banking and consulting.",
    industry: "Finance",
    styleBadge: "EXECUTIVE",
    stageClass: "from-amber-50/80 via-stone-100 to-stone-200",
    accentBg: "bg-[#ebe4d6]",
    accentBgHover: "group-hover:bg-[#e2d9c9]",
  }),
  prague: meta({
    tag: "Free",
    atsScore: 92,
    filterCategory: "Tech",
    preview: "prague",
    layoutLabel: "Central Europe Tech",
    description: "Balanced sidebar CV for developers and analysts.",
    industry: "Technology",
    styleBadge: "MODERN",
    stageClass: "from-stone-100 via-[#f6f7f4] to-emerald-50/60",
    accentBg: "bg-[#eef0ec]",
    accentBgHover: "group-hover:bg-[#e4e8e2]",
  }),
  helsinki: meta({
    tag: "Popular",
    atsScore: 99,
    filterCategory: "ATS Friendly",
    preview: "helsinki",
    layoutLabel: "Helsinki ATS Pro",
    description: "Top ATS score layout — dense, readable, parser-safe.",
    industry: "All industries",
    styleBadge: "PROFESSIONAL",
    stageClass: "from-zinc-100 via-neutral-50 to-stone-200",
    accentBg: "bg-[#ececec]",
    accentBgHover: "group-hover:bg-[#e2e2e2]",
  }),
  "barcelona-creative": meta({
    tag: "Premium",
    atsScore: 86,
    filterCategory: "Creative",
    preview: "right-sidebar",
    layoutLabel: "Barcelona Studio",
    description: "Vibrant portfolio sidebar for creatives and freelancers.",
    industry: "Design",
    styleBadge: "CREATIVE",
    stageClass: "from-teal-50/90 via-cyan-50/50 to-slate-100",
    accentBg: "bg-[#e0ebe8]",
    accentBgHover: "group-hover:bg-[#d4e4df]",
  }),
  "hong-kong-finance": meta({
    tag: "Popular",
    atsScore: 97,
    filterCategory: "Business",
    preview: "boxed-grid",
    layoutLabel: "HK Finance",
    description: "Compact finance format for regional banking roles.",
    industry: "Finance",
    styleBadge: "EXECUTIVE",
    stageClass: "from-amber-50/80 via-stone-100 to-stone-200",
    accentBg: "bg-[#ebe4d6]",
    accentBgHover: "group-hover:bg-[#e2d9c9]",
  }),
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

export const STYLE_BADGE_CLASSES: Record<StyleBadge, { bg: string; text: string }> = {
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

/** Offline / seed-aligned template list (30 items) */
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
  { id: "london", name: "London", category: { name: "Business" } },
  { id: "zurich", name: "Zurich", category: { name: "Business" } },
  { id: "oslo", name: "Oslo", category: { name: "Tech" } },
  { id: "berlin", name: "Berlin", category: { name: "Tech" } },
  { id: "stockholm", name: "Stockholm", category: { name: "Business" } },
  { id: "paris", name: "Paris", category: { name: "Design" } },
  { id: "milan", name: "Milan", category: { name: "Design" } },
  { id: "tokyo", name: "Tokyo", category: { name: "Design" } },
  { id: "singapore", name: "Singapore", category: { name: "Business" } },
  { id: "sydney", name: "Sydney", category: { name: "Tech" } },
  { id: "toronto", name: "Toronto", category: { name: "Business" } },
  { id: "seattle", name: "Seattle", category: { name: "Tech" } },
  { id: "austin", name: "Austin", category: { name: "Business" } },
  { id: "boston", name: "Boston", category: { name: "Design" } },
  { id: "chicago", name: "Chicago", category: { name: "Business" } },
  { id: "amsterdam", name: "Amsterdam", category: { name: "Design" } },
  { id: "copenhagen", name: "Copenhagen", category: { name: "Design" } },
  { id: "vienna", name: "Vienna", category: { name: "Design" } },
  { id: "geneva", name: "Geneva", category: { name: "Business" } },
  { id: "prague", name: "Prague", category: { name: "Tech" } },
  { id: "helsinki", name: "Helsinki", category: { name: "Business" } },
  { id: "barcelona-creative", name: "Barcelona", category: { name: "Design" } },
  { id: "hong-kong-finance", name: "Hong Kong", category: { name: "Business" } },
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
      fallback?.description ?? "Mẫu CV chuẩn hóa, sẵn sàng chỉnh sửa và xuất bản.",
    industry: fallback?.industry ?? categoryName ?? "General",
    styleBadge: fallback?.styleBadge ?? "PROFESSIONAL",
    stageClass: fallback?.stageClass ?? "from-slate-100 via-slate-50 to-slate-200",
    accentBg: fallback?.accentBg ?? "bg-slate-200",
    accentBgHover: fallback?.accentBgHover ?? "group-hover:bg-slate-300",
  };
}
