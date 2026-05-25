"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { TemplatePreviewVariant } from "../../lib/dashboard-templates";
import { getPreviewFontClass } from "./resume-preview-fonts";
import { PREVIEW_LAYOUTS } from "./resume-preview-layouts";

type Props = {
  variant: TemplatePreviewVariant;
  size?: "card" | "large";
  /** Fill parent box (gallery card) — scales to max readable size */
  fill?: boolean;
  className?: string;
};

/** A4 proportions (210 × 297 mm) */
export const DOC_W = 360;
export const DOC_H = Math.round(DOC_W * (297 / 210));

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
 * High-fidelity résumé thumbnail — fills gallery cards, crisp A4 mockup.
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
  const outerW = Math.round(DOC_W * scale);
  const outerH = Math.round(DOC_H * scale);
  const Layout = PREVIEW_LAYOUTS[variant] ?? PREVIEW_LAYOUTS["compact-ats"];
  const fontClass = getPreviewFontClass(variant);

  const paper = (
    <div
      className="resume-paper-mockup absolute top-0 left-1/2"
      style={{
        width: DOC_W,
        height: DOC_H,
        transform: `translateX(-50%) scale(${scale})`,
        transformOrigin: "top center",
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
        className={`relative w-full h-full min-h-0 ${className}`}
        aria-hidden
      >
        {paper}
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 pointer-events-none select-none z-[1] ${className}`}
      style={{ width: outerW, height: outerH }}
      aria-hidden
    >
      {paper}
    </div>
  );
}

export const PREVIEW_DOC_ASPECT = DOC_W / DOC_H;
