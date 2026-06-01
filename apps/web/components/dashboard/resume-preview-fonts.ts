import type { TemplatePreviewVariant } from "../../lib/dashboard-templates";

/** Per-layout professional font — distinct typographic identity */
export const PREVIEW_FONT_CLASS: Partial<Record<TemplatePreviewVariant, string>> = {
  "minimal-sidebar": "resume-preview-font-jakarta",
  "classic-academic": "resume-preview-font-cormorant",
  executive: "resume-preview-font-manrope",
  "creative-designer": "resume-preview-font-jakarta",
  "compact-ats": "resume-preview-font-inter",
  "modern-profile": "resume-preview-font-manrope",
  "elegant-mono": "resume-preview-font-playfair",
  "tech-startup": "resume-preview-font-inter",
  finance: "resume-preview-font-cormorant",
};

export function getPreviewFontClass(variant: TemplatePreviewVariant): string {
  return PREVIEW_FONT_CLASS[variant] ?? "resume-preview-font-inter";
}

export function usesSerifTypography(variant: TemplatePreviewVariant): boolean {
  return (
    variant === "classic-academic" ||
    variant === "elegant-mono" ||
    variant === "finance"
  );
}
