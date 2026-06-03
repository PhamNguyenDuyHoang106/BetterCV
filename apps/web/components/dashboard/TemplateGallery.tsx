"use client";

import { useMemo, useState, useRef, useLayoutEffect, useEffect } from "react";
import {
  getTemplateDisplayMeta,
  STYLE_BADGE_CLASSES,
} from "../../lib/dashboard-templates";
import { PREVIEW_STAGE_INSET_PX, TemplatePreview } from "./TemplatePreview";
import { renderHtml, GALLERY_DEMO_DATA } from "@acv/template-engine";

export type ApiTemplate = {
  id: string;
  name: string;
  schema?: any;
  category?: { name: string };
};


type Props = {
  templates: ApiTemplate[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onUseNow: (templateId: string, templateName: string) => void;
  /** @deprecated Card click uses onUseNow only */
  onCustomize?: (templateId: string) => void;
  onChooseLater?: () => void;
};

type EnrichedTemplate = ApiTemplate & {
  meta: ReturnType<typeof getTemplateDisplayMeta>;
};

const TAG_STYLES: Record<string, string> = {
  Popular: "bg-amber-500/90 text-white",
  Premium: "bg-violet-600/90 text-white",
  Free: "bg-white/90 text-slate-700 ring-1 ring-slate-200/80",
};

const GALLERY_TABS = [
  { id: "all", label: "All Templates", icon: "folder" },
  { id: "simple", label: "Simple", icon: "grade" },
  { id: "modern", label: "Modern", icon: "draw" },
  { id: "one-column", label: "One column", icon: "article" },
  { id: "with-photo", label: "With photo", icon: "portrait" },
  { id: "professional", label: "Professional", icon: "work" },
  { id: "ats", label: "ATS", icon: "shield" },
] as const;

type GalleryTabId = (typeof GALLERY_TABS)[number]["id"];

// ─── renderHtml-based Gallery Preview ─────────────────────────────────────
// Renders the actual template HTML at 1:1 size then scales it down into the
// card thumbnail. This guarantees Gallery ≡ Editor ≡ Export (same pipeline).
// Falls back to the React mockup when schema is unavailable (offline mode).

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function TemplateHtmlPreview({
  templateId,
  templateName,
  schema,
  fallbackVariant,
}: {
  templateId: string;
  templateName: string;
  schema?: any;
  fallbackVariant: import("../../lib/dashboard-templates").TemplatePreviewVariant;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.25);

  const html = useMemo(() => {
    if (!schema) return null;
    try {
      return renderHtml({ template: schema, data: GALLERY_DEMO_DATA });
    } catch (err) {
      console.warn("Failed to render gallery preview for", templateId, err);
      return null;
    }
  }, [schema, templateId]);

  useIsomorphicLayoutEffect(() => {
    if (!html) return;
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { width } = el.getBoundingClientRect();
      if (width < 1) return;
      setScale(width / 794);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [html]);

  // Fallback to static WebP when template schema is unavailable
  if (!html) {
    return (
      <picture className="w-full h-full block relative rounded shadow-lg border border-slate-200/40 overflow-hidden bg-white">
        <source
          srcSet={`/thumbnails/${templateId}@2x.webp 2x, /thumbnails/${templateId}.webp 1x`}
          type="image/webp"
        />
        <img
          src={`/thumbnails/${templateId}.webp`}
          alt={templateName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/thumbnails/standard-ats.webp";
          }}
        />
      </picture>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative rounded shadow-lg border border-slate-200/40 overflow-hidden bg-white"
      aria-hidden
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      <iframe
        srcDoc={html}
        title={`Preview ${templateName}`}
        className="border-0 absolute"
        sandbox="allow-same-origin"
        style={{
          width: 794,
          height: 1123,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
          backfaceVisibility: "hidden",
          willChange: "transform",
        }}
      />
    </div>
  );
}


function TemplateCard({
  tpl,
  index,
  onSelect,
}: {
  tpl: EnrichedTemplate;
  index: number;
  onSelect: () => void;
}) {
  const badge = STYLE_BADGE_CLASSES[tpl.meta.styleBadge];
  const tagStyle = TAG_STYLES[tpl.meta.tag] ?? TAG_STYLES.Free;

  return (
    <article
      className="template-gallery-card template-gallery-animate-in group cursor-pointer"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-label={`Chọn mẫu ${tpl.name}`}
    >
      <div className="rounded-[20px] bg-white ring-1 ring-slate-200/60 shadow-[0_1px_3px_rgba(15,23,42,0.03),0_10px_28px_-10px_rgba(15,23,42,0.08)] group-hover:shadow-[0_4px_12px_rgba(15,23,42,0.04),0_24px_48px_-12px_rgba(15,23,42,0.12)] group-hover:ring-primary/40 overflow-hidden transition-all duration-300">
        <div
          className="template-gallery-stage relative w-full aspect-[210/297] overflow-hidden bg-[#eef2f6] group-hover:bg-[#e4eaf0] transition-colors duration-300 "
        >
          <div
            className="absolute z-[1]"
            style={{
              top: PREVIEW_STAGE_INSET_PX ,
              left: PREVIEW_STAGE_INSET_PX,
              right: PREVIEW_STAGE_INSET_PX,
              bottom: PREVIEW_STAGE_INSET_PX,
            }}
          >
            <TemplateHtmlPreview
              templateId={tpl.id}
              templateName={tpl.name}
              schema={tpl.schema}
              fallbackVariant={tpl.meta.preview}
            />

          </div>

          <span
            className={`absolute top-2.5 left-2.5 z-[3] px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide shadow-sm backdrop-blur-sm ${tagStyle}`}
          >
            {tpl.meta.tag}
          </span>
          <span className="absolute top-2.5 right-2.5 z-[3] px-2 py-0.5 rounded-lg bg-white/95 backdrop-blur-sm text-[10px] font-bold text-slate-700 shadow-sm ring-1 ring-slate-200/60 tabular-nums">
            ATS {tpl.meta.atsScore}%
          </span>
        </div>

        <div className="px-3 pt-2.5 pb-3 border-t border-slate-100/90 bg-white">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-[14px] text-slate-900 leading-snug tracking-tight truncate">
                {tpl.name}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-1">
                {tpl.meta.layoutLabel}
              </p>
            </div>
            <span
              className={`shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${badge.bg} ${badge.text}`}
            >
              {tpl.meta.styleBadge}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function TemplateGallery({
  templates,
  loading,
  error,
  onRetry,
  onUseNow,
}: Props) {
  const [activeTab, setActiveTab] = useState<GalleryTabId>("all");

  const enriched = useMemo(
    () =>
      templates.map((t) => ({
        ...t,
        meta: getTemplateDisplayMeta(t.id, t.category?.name),
      })),
    [templates],
  );

  const filtered = enriched.filter((t) => {
    let matchTab = true;
    if (activeTab === "simple") {
      matchTab = t.meta.filterCategory === "Minimal";
    } else if (activeTab === "modern") {
      matchTab = t.meta.filterCategory === "Tech";
    } else if (activeTab === "one-column") {
      matchTab =
        t.meta.preview === "compact-ats" ||
        t.meta.preview === "finance" ||
        t.meta.preview === "elegant-mono" ||
        t.meta.preview === "classic-academic";
    } else if (activeTab === "with-photo") {
      matchTab = t.meta.preview === "modern-profile";
    } else if (activeTab === "professional") {
      matchTab = t.meta.filterCategory === "Business";
    } else if (activeTab === "ats") {
      matchTab = t.meta.filterCategory === "ATS Friendly";
    }

    return matchTab;
  });

  return (
    <div className="template-gallery flex flex-col gap-10">
      <header className="template-gallery-header rounded-[24px] p-8 md:p-12 border border-white/60 bg-gradient-to-br from-white/95 to-slate-50/90 shadow-[0_4px_30px_rgba(0,0,0,0.03)] flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute -top-16 -left-16 w-52 h-52 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-52 h-52 rounded-full bg-primary-dark/10 blur-3xl pointer-events-none" />

        <div className="max-w-2xl flex flex-col items-center relative z-10 mb-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary-darker mb-3 bg-primary/30 px-3 py-1 rounded-full shadow-sm self-center">
            Template library
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
            Resume templates
          </h2>
          <p className="text-sm md:text-base text-slate-500 max-w-xl leading-relaxed">
            {templates.length} mẫu chuẩn ATS — nhấn vào thẻ để chọn và bắt đầu tạo CV.
          </p>
        </div>

        {error && (
          <div className="mt-6 w-full max-w-xl flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-amber-50/90 border border-amber-200/60 px-4 py-3 text-sm text-amber-950 text-left">
            <span className="material-symbols-outlined text-lg shrink-0">info</span>
            <p className="flex-1">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="shrink-0 px-4 py-2 bg-white border border-amber-200/80 rounded-lg text-xs font-semibold hover:bg-amber-50 transition-colors"
              >
                Tải lại
              </button>
            )}
          </div>
        )}

        <div className="w-full border-b border-slate-200/80 mt-10 flex overflow-x-auto no-scrollbar gap-6 md:gap-10 px-2 justify-start md:justify-center">
          {GALLERY_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3.5 px-1 border-b-2 font-bold text-xs md:text-sm tracking-wide transition-all duration-200 shrink-0 select-none relative -mb-[2px] ${
                  isActive
                    ? "border-primary-darker text-primary-darker"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[18px] shrink-0"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "" }}
                >
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {!loading && (
        <p className="text-xs text-slate-400 font-bold -mb-4 px-2">
          Hiển thị {filtered.length} / {enriched.length} mẫu
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[20px] bg-white ring-1 ring-slate-200/60 overflow-hidden animate-pulse shadow-sm"
            >
              <div className="aspect-[210/297] bg-gradient-to-br from-slate-100 to-slate-200" />
              <div className="p-3 space-y-2 border-t border-slate-100">
                <div className="h-3.5 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300/80 bg-white/50 py-20 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mb-4">
            <span className="material-symbols-outlined text-3xl">folder_off</span>
          </div>
          <p className="font-semibold text-slate-900">Không tìm thấy mẫu phù hợp</p>
          <p className="text-sm text-slate-500 mt-1">Thử đổi bộ lọc</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((tpl, i) => (
            <TemplateCard
              key={tpl.id}
              tpl={tpl}
              index={i}
              onSelect={() => onUseNow(tpl.id, tpl.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
