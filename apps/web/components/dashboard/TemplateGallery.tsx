"use client";

import { useMemo, useState } from "react";
import {
  getTemplateDisplayMeta,
  STYLE_BADGE_CLASSES,
  TEMPLATE_FILTER_CATEGORIES,
} from "../../lib/dashboard-templates";
import { TemplatePreview } from "./TemplatePreview";

export type ApiTemplate = {
  id: string;
  name: string;
  category?: { name: string };
};

type Props = {
  templates: ApiTemplate[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onUseNow: (templateId: string, templateName: string) => void;
  onCustomize: (templateId: string) => void;
};

type EnrichedTemplate = ApiTemplate & {
  meta: ReturnType<typeof getTemplateDisplayMeta>;
};

const TAG_STYLES: Record<string, string> = {
  Popular: "bg-amber-500/90 text-white",
  Premium: "bg-violet-600/90 text-white",
  Free: "bg-white/90 text-slate-700 ring-1 ring-slate-200/80",
};

function TemplateCard({
  tpl,
  index,
  onPreview,
  onUseNow,
  onCustomize,
}: {
  tpl: EnrichedTemplate;
  index: number;
  onPreview: () => void;
  onUseNow: () => void;
  onCustomize: () => void;
}) {
  const badge = STYLE_BADGE_CLASSES[tpl.meta.styleBadge];
  const tagStyle = TAG_STYLES[tpl.meta.tag] ?? TAG_STYLES.Free;

  return (
    <article
      className="template-gallery-card template-gallery-animate-in group"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="rounded-[20px] bg-white ring-1 ring-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-8px_rgba(15,23,42,0.1)] group-hover:shadow-[0_2px_4px_rgba(15,23,42,0.05),0_24px_48px_-12px_rgba(15,23,42,0.16)] overflow-hidden transition-shadow duration-500">
        <button
          type="button"
          onClick={onPreview}
          className={`template-gallery-stage relative w-full aspect-[260/297] overflow-hidden bg-gradient-to-br ${tpl.meta.stageClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
          aria-label={`Xem trước mẫu ${tpl.name}`}
        >
          <div className="absolute inset-[10px] z-[1]">
            <TemplatePreview variant={tpl.meta.preview} size="card" fill />
          </div>

          <div className="absolute inset-0 z-[2] flex flex-col justify-end p-4 bg-gradient-to-t from-slate-900/50 via-slate-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex gap-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <span className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-semibold shadow-lg">
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                Xem trước
              </span>
            </div>
          </div>

          <span
            className={`absolute top-3 left-3 z-[3] px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide shadow-sm backdrop-blur-sm ${tagStyle}`}
          >
            {tpl.meta.tag}
          </span>
          <span className="absolute top-3 right-3 z-[3] px-2 py-1 rounded-lg bg-white/95 backdrop-blur-sm text-[10px] font-bold text-slate-700 shadow-sm ring-1 ring-slate-200/60 tabular-nums">
            ATS {tpl.meta.atsScore}%
          </span>
        </button>

        <div className="px-4 pt-4 pb-4 border-t border-slate-100/90 bg-gradient-to-b from-white to-slate-50/30">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-[15px] text-slate-900 leading-snug tracking-tight truncate">
                {tpl.name}
              </h3>
              <p className="text-[12px] text-slate-500 mt-1 leading-snug line-clamp-2">
                {tpl.meta.layoutLabel}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{tpl.meta.industry}</p>
            </div>
            <span
              className={`shrink-0 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${badge.bg} ${badge.text}`}
            >
              {tpl.meta.styleBadge}
            </span>
          </div>

          <div className="mt-3.5 flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUseNow();
              }}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all shadow-sm"
            >
              Dùng mẫu này
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCustomize();
              }}
              className="px-3 py-2.5 rounded-xl bg-white text-slate-600 ring-1 ring-slate-200/90 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] transition-all"
              title="Tùy chỉnh trước khi tạo"
              aria-label="Tùy chỉnh"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
            </button>
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
  onCustomize,
}: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("Tất cả");
  const [previewTpl, setPreviewTpl] = useState<EnrichedTemplate | null>(null);

  const enriched = useMemo(
    () =>
      templates.map((t) => ({
        ...t,
        meta: getTemplateDisplayMeta(t.id, t.category?.name),
      })),
    [templates],
  );

  const filtered = enriched.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.meta.description.toLowerCase().includes(search.toLowerCase()) ||
      t.meta.layoutLabel.toLowerCase().includes(search.toLowerCase()) ||
      t.meta.industry.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      category === "Tất cả" || t.meta.filterCategory === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="template-gallery flex flex-col gap-10">
      <header className="template-gallery-header rounded-[20px] p-6 md:p-8 border border-white/60">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80 mb-2">
              Template library
            </p>
            <h2 className="text-2xl md:text-[1.75rem] font-bold text-slate-900 tracking-tight leading-tight">
              Chọn mẫu CV chuyên nghiệp
            </h2>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
              Xem trước như bản PDF thật — mỗi mẫu có bố cục, typography và phong cách riêng.
              Nhấn thẻ để phóng to hoặc bắt đầu ngay.
            </p>
          </div>
          <div className="relative w-full lg:w-80 shrink-0">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/80 border border-slate-200/80 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-shadow"
              placeholder="Tìm theo tên, ngành, layout..."
              type="search"
            />
          </div>
        </div>

        {error && (
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-amber-50/90 border border-amber-200/60 px-4 py-3 text-sm text-amber-950">
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

        <div className="flex flex-wrap gap-2 mt-6">
          {TEMPLATE_FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                category === cat
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/15"
                  : "bg-white/70 text-slate-600 ring-1 ring-slate-200/80 hover:ring-slate-300 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {!loading && (
          <p className="mt-4 text-xs text-slate-400 font-medium">
            {filtered.length} mẫu{filtered.length !== 1 ? "" : ""} · A4 · ATS-ready
          </p>
        )}
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-[var(--gallery-gap)]">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-[20px] bg-white ring-1 ring-slate-200/60 overflow-hidden animate-pulse"
            >
              <div className="aspect-[210/297] bg-gradient-to-br from-slate-100 to-slate-200" />
              <div className="p-4 space-y-3 border-t border-slate-100">
                <div className="h-4 bg-slate-200 rounded-lg w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-9 bg-slate-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-slate-300/80 bg-white/50 py-20 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mb-4">
            <span className="material-symbols-outlined text-3xl">folder_off</span>
          </div>
          <p className="font-semibold text-slate-900">Không tìm thấy mẫu phù hợp</p>
          <p className="text-sm text-slate-500 mt-1">Thử đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
          {filtered.map((tpl, i) => (
            <TemplateCard
              key={tpl.id}
              tpl={tpl}
              index={i}
              onPreview={() => setPreviewTpl(tpl)}
              onUseNow={() => onUseNow(tpl.id, tpl.name)}
              onCustomize={() => onCustomize(tpl.id)}
            />
          ))}
        </div>
      )}

      {previewTpl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
          role="dialog"
          aria-modal
          aria-label="Xem trước mẫu CV"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setPreviewTpl(null)}
            aria-label="Đóng"
          />
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-[24px] bg-white shadow-2xl shadow-slate-900/20 ring-1 ring-white/20 animate-[gallery-fade-in_0.25s_ease-out]">
            <button
              type="button"
              onClick={() => setPreviewTpl(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/90 ring-1 ring-slate-200/80 text-slate-500 hover:text-slate-900 hover:bg-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="grid md:grid-cols-[1fr,minmax(280px,340px)]">
              <div
                className={`relative min-h-[420px] bg-gradient-to-br ${previewTpl.meta.stageClass} md:rounded-l-[24px]`}
              >
                <div className="absolute inset-4 md:inset-6">
                  <TemplatePreview variant={previewTpl.meta.preview} size="large" fill />
                </div>
              </div>

              <div className="p-6 md:p-8 md:border-l border-slate-100 flex flex-col">
                <span
                  className={`inline-flex self-start px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-3 ${STYLE_BADGE_CLASSES[previewTpl.meta.styleBadge].bg} ${STYLE_BADGE_CLASSES[previewTpl.meta.styleBadge].text}`}
                >
                  {previewTpl.meta.styleBadge}
                </span>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                  {previewTpl.name}
                </h3>
                <p className="text-sm font-medium text-primary mt-1">
                  {previewTpl.meta.layoutLabel}
                </p>
                <p className="text-sm text-slate-500 mt-1">{previewTpl.meta.industry}</p>
                <p className="text-sm text-slate-600 mt-4 leading-relaxed flex-1">
                  {previewTpl.meta.description}
                </p>

                <div className="flex items-center gap-3 mt-4 py-3 px-3 rounded-xl bg-slate-50 ring-1 ring-slate-100">
                  <span className="material-symbols-outlined text-primary text-xl">verified</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">ATS Score</p>
                    <p className="text-lg font-bold text-slate-900 tabular-nums">
                      {previewTpl.meta.atsScore}%
                    </p>
                  </div>
                  <span className="ml-auto text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    {previewTpl.meta.tag}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      onUseNow(previewTpl.id, previewTpl.name);
                      setPreviewTpl(null);
                    }}
                    className="flex-1 py-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 active:scale-[0.99] transition-all shadow-lg shadow-slate-900/15"
                  >
                    Dùng mẫu này
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onCustomize(previewTpl.id);
                      setPreviewTpl(null);
                    }}
                    className="flex-1 py-3.5 rounded-xl bg-white text-slate-700 font-semibold ring-1 ring-slate-200 hover:bg-slate-50 active:scale-[0.99] transition-all"
                  >
                    Tùy chỉnh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
