import type { TemplatePreviewVariant } from "../../lib/dashboard-templates";

/** Per-layout professional font — distinct typographic identity */
export const PREVIEW_FONT_CLASS: Partial<Record<TemplatePreviewVariant, string>> = {
  "ironclad-ats": "resume-preview-font-cormorant",
  "strategy-pro": "resume-preview-font-cormorant",
  "synergy-pro": "resume-preview-font-jakarta",
  "pinnacle-executive": "resume-preview-font-cormorant",
  "chronos-modern": "resume-preview-font-jakarta",
  "neo-gradient": "resume-preview-font-jakarta",
  "linear-tech": "resume-preview-font-inter",
  "ai-builder": "resume-preview-font-inter",
  "block-minimalist": "resume-preview-font-inter",
  "card-stack": "resume-preview-font-jakarta",
  "glass-resume": "resume-preview-font-inter",
  "startup-operator": "resume-preview-font-inter",
};

export function getPreviewFontClass(variant: TemplatePreviewVariant): string {
  return PREVIEW_FONT_CLASS[variant] ?? "resume-preview-font-inter";
}

export function usesSerifTypography(variant: TemplatePreviewVariant): boolean {
  return (
    variant === "ironclad-ats" ||
    variant === "strategy-pro" ||
    variant === "pinnacle-executive"
  );
}
