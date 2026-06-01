"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { TemplatePreviewVariant } from "../../lib/dashboard-templates";
import { getPreviewFontClass } from "./resume-preview-fonts";
import { PREVIEW_LAYOUTS } from "./resume-preview-layouts";

type Props = {
  variant: TemplatePreviewVariant;
  size?: "card" | "large";
  /** Fill parent box — scales from top-left to fit */
  fill?: boolean;
  className?: string;
};

/** A4 proportions (210 × 297 mm) */
export const DOC_W = 360;
export const DOC_H = Math.round(DOC_W * (297 / 210));

/** Shared inset for card + modal so scale math matches */
export const PREVIEW_STAGE_INSET_PX = 6;

const FIXED_SCALE = { card: 1, large: 0.92 } as const;

function useFitScale(enabled: boolean, maxScale = 1.15) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(FIXED_SCALE.card);

  useLayoutEffect(() => {
    if (!enabled) return;
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width < 1 || height < 1) return;
      const fit = Math.min(width / DOC_W, height / DOC_H);
      setScale(Math.min(fit, maxScale));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [enabled, maxScale]);

  return { containerRef, scale };
}

/**
 * Résumé thumbnail — same component at every size, scaled from top-left only.
 */
/**
 * @deprecated
 * Renders a static React mockup with hardcoded SAMPLE data — not connected
 * to the real template-engine pipeline.
 *
 * Use `TemplateHtmlPreview` (via `renderHtml()` + `GALLERY_DEMO_DATA`) for
 * consistent rendering across Gallery, Editor, and PDF Export.
 *
 * Kept as offline fallback. Will be removed in Sprint 2 when all usages
 * are migrated.
 */
export function TemplatePreview({

  variant,
  size = "card",
  fill = false,
  className = "",
}: Props) {
  const maxScale = size === "large" ? 1.2 : 1.12;
  const { containerRef, scale: fitScale } = useFitScale(fill, maxScale);
  const scale = fill ? fitScale : FIXED_SCALE[size];
  const Layout = PREVIEW_LAYOUTS[variant] ?? PREVIEW_LAYOUTS["compact-ats"];
  const fontClass = getPreviewFontClass(variant);

  const scaledW = DOC_W * scale;
  const scaledH = DOC_H * scale;

  const documentNode = (
    <div
      className="resume-paper-mockup absolute"
      style={{
        width: DOC_W,
        height: DOC_H,
        transform:
          fill
            ? `translate(-50%,-50%) scale(${scale})`
            : `scale(${scale})`,
        transformOrigin: fill ? "center center" : "top left",
        left: fill ? "50%" : 0,
        top: fill ? "50%" : 0,
      }}
    >
      <article
        className={`resume-preview-doc h-full w-full text-slate-900 overflow-hidden ${fontClass}`}
      >
        <Layout />
      </article>
    </div>
  );

  if (fill) {
    return (
      <div
        ref={containerRef}
        className={`relative w-full h-full min-h-0 overflow-hidden ${className}`}
        aria-hidden
      >
        {documentNode}
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 pointer-events-none select-none z-[1] overflow-hidden ${className}`}
      style={{ width: scaledW, height: scaledH }}
      aria-hidden
    >
      {documentNode}
    </div>
  );
}

export const PREVIEW_DOC_ASPECT = DOC_W / DOC_H;
