"use client";

import { useMemo, useState } from "react";
import {
  getTemplateDisplayMeta,
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
      t.meta.description.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      category === "Tất cả" || t.meta.filterCategory === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-panel rounded-2xl p-4 md:p-6 shadow-sm border border-white/40">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">collections_bookmark</span>
              Thư viện mẫu CV
            </h2>
            <p className="text-sm text-text-secondary mt-2 max-w-xl leading-relaxed">
              {templates.length} mẫu sẵn có — chọn <strong className="text-primary">Dùng ngay</strong>{" "}
              để tạo CV và chỉnh sửa luôn.
            </p>
          </div>
          <div className="relative w-full lg:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-lg">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-glass-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-text-secondary/60"
              placeholder="Tìm mẫu CV..."
              type="search"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-amber-50 border border-amber-200/80 px-4 py-3 text-xs text-amber-900">
            <span className="material-symbols-outlined text-base shrink-0">info</span>
            <p className="flex-1">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="shrink-0 px-3 py-1.5 bg-white border border-amber-200 rounded-lg font-semibold hover:bg-amber-100/50"
              >
                Tải lại
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          {TEMPLATE_FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                category === cat
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-white/50 text-text-secondary border border-glass-border hover:border-primary/40 hover:text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-[380px] rounded-2xl glass-panel border border-white/50 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-dashed border-primary/20 py-16 text-center">
          <span className="material-symbols-outlined text-5xl text-primary/40">folder_off</span>
          <p className="mt-4 font-semibold text-text-primary">Không tìm thấy mẫu phù hợp</p>
          <p className="text-sm text-text-secondary mt-2">
            Thử đổi bộ lọc hoặc xóa từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((tpl) => (
            <article
              key={tpl.id}
              className="group glass-panel rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border border-white/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
            >
              <div className="relative bg-gradient-to-b from-surface-container-low to-white/80 p-6 h-[210px]">
                <div className="absolute top-3 left-3 right-3 flex justify-between z-10">
                  <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold text-primary border border-primary/10 shadow-sm">
                    ATS {tpl.meta.atsScore}%
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm ${
                      tpl.meta.tag === "Premium"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : tpl.meta.tag === "Popular"
                          ? "bg-violet-100 text-violet-800 border border-violet-200"
                          : "bg-primary/10 text-primary border border-primary/20"
                    }`}
                  >
                    {tpl.meta.tag}
                  </span>
                </div>
                <div className="h-full max-w-[210px] mx-auto pt-8">
                  <TemplatePreview variant={tpl.meta.preview} />
                </div>
              </div>

              <div className="flex flex-col flex-1 p-5 gap-3 border-t border-white/40 bg-white/30">
                <div>
                  <h3 className="font-bold text-text-primary text-base">{tpl.name}</h3>
                  <p className="text-xs text-primary font-medium mt-1">
                    {tpl.meta.filterCategory}
                    {tpl.category?.name ? ` · ${tpl.category.name}` : ""}
                  </p>
                  <p className="text-xs text-text-secondary mt-2 leading-relaxed line-clamp-2">
                    {tpl.meta.description}
                  </p>
                </div>

                <div className="mt-auto flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onUseNow(tpl.id, tpl.name)}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-base">bolt</span>
                    Dùng ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => onCustomize(tpl.id)}
                    className="flex-1 py-2.5 bg-white/60 hover:bg-white border border-glass-border text-text-primary text-xs font-semibold rounded-xl transition-all"
                  >
                    Tùy chỉnh
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
