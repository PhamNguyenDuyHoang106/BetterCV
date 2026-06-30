import {
  DEFAULT_TEMPLATE_ID,
  TEMPLATE_REGISTRY,
  getTemplateRegistryEntry,
  type TemplateCategoryName,
  type TemplateRegistryEntry,
  type TemplateStyleBadge,
} from "@acv/shared";
import { getTemplateSectionStyles, getTemplateLayout } from "@acv/template-engine";

export type TemplatePreviewVariant = TemplateRegistryEntry["id"];

export type StyleBadge = TemplateStyleBadge;

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
  ...Object.fromEntries(
    TEMPLATE_REGISTRY.map((entry) => [
      entry.id,
      meta({
        tag: entry.tag,
        atsScore: entry.atsScore,
        filterCategory: entry.filterCategory,
        preview: entry.id,
        layoutLabel: entry.layoutLabel,
        description: entry.description,
        industry: entry.industry,
        styleBadge: entry.styleBadge,
        stageClass: entry.stageClass,
        accentBg: entry.accentBg,
        accentBgHover: entry.accentBgHover,
      }),
    ]),
  ),
};

const CATEGORY_FALLBACK: Record<TemplateCategoryName, Partial<TemplateDisplayMeta>> = {
  Tech: {
    filterCategory: "Tech",
    preview: "linear-tech",
    layoutLabel: "Linear Tech",
    atsScore: 96,
    tag: "Free",
    industry: "Technology",
    styleBadge: "MODERN",
    stageClass: "from-slate-900 via-slate-950 to-zinc-900",
    accentBg: "bg-slate-800",
    accentBgHover: "group-hover:bg-slate-700",
  },
  Business: {
    filterCategory: "Business",
    preview: "synergy-pro",
    layoutLabel: "Synergy Pro",
    atsScore: 92,
    tag: "Free",
    industry: "Business",
    styleBadge: "PROFESSIONAL",
    stageClass: "from-red-50/35 via-stone-50 to-stone-100",
    accentBg: "bg-[#fee2e2]",
    accentBgHover: "group-hover:bg-[#fecaca]",
  },
  Design: {
    filterCategory: "Creative",
    preview: "pinnacle-executive",
    layoutLabel: "Pinnacle Executive",
    atsScore: 88,
    tag: "Premium",
    industry: "Design",
    styleBadge: "CREATIVE",
    stageClass: "from-[#4a3728]/10 via-stone-50 to-amber-50/30",
    accentBg: "bg-[#f5ebe0]",
    accentBgHover: "group-hover:bg-[#e3d5ca]",
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
  "Student",
  "Startup",
] as const;

/** Offline / seed-aligned template list (12 items) */
export const FALLBACK_TEMPLATES: Array<{
  id: string;
  name: string;
  category: { name: string };
}> = TEMPLATE_REGISTRY.map((entry) => ({
  id: entry.id,
  name: entry.name,
  category: { name: entry.categoryName },
}));

export function getTemplateDisplayMeta(
  templateId: string,
  categoryName?: string,
): TemplateDisplayMeta {
  const entry = getTemplateRegistryEntry(templateId);
  if (entry && CATALOG[entry.id]) {
    return CATALOG[entry.id];
  }
  const fallback = categoryName ? CATEGORY_FALLBACK[categoryName as TemplateCategoryName] : undefined;
  return {
    tag: fallback?.tag ?? "Free",
    atsScore: fallback?.atsScore ?? 90,
    filterCategory: fallback?.filterCategory ?? categoryName ?? "Modern",
    preview: fallback?.preview ?? DEFAULT_TEMPLATE_ID,
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

export function getTemplateFallbackSchema(templateId: string, templateName: string = "") {
  const category = getTemplateRegistryEntry(templateId)?.categoryCode ?? "BUSINESS";

  return {
    id: templateId,
    name: templateName || templateId,
    category,
    layout: getTemplateLayout(templateId),
    sectionStyles: getTemplateSectionStyles(templateId),
  };
}
