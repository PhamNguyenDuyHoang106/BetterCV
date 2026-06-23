import React from "react";
import { useTranslation } from "../../../hooks/useTranslation";

type AwardsPanelProps = {
  awards: any[];
  addAwardItem: () => void;
  updateAwardItem: (id: string, field: string, val: any) => void;
  removeAwardItem: (id: string) => void;
  saveAwards: (items?: any[]) => void;
};

export function AwardsPanel({
  awards,
  addAwardItem,
  updateAwardItem,
  removeAwardItem,
  saveAwards,
}: AwardsPanelProps) {
  const { t, language } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          {t.editor.awards.title}
        </h3>
        <button
          onClick={addAwardItem}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md border-none"
        >
          {t.editor.awards.addBtn}
        </button>
      </div>

      {awards.map((item) => (
        <div key={item.id} className="relative rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
          <button
            onClick={() => removeAwardItem(item.id)}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700/60"
            title={language === "vi" ? "Xóa" : "Delete"}
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400">{t.editor.awards.titleLabel}</label>
              <input
                type="text"
                value={item.title || ""}
                onChange={(e) => updateAwardItem(item.id, "title", e.target.value)}
                onBlur={() => saveAwards()}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">{t.editor.awards.issuerLabel}</label>
              <input
                type="text"
                value={item.issuer || ""}
                onChange={(e) => updateAwardItem(item.id, "issuer", e.target.value)}
                onBlur={() => saveAwards()}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400">{t.editor.awards.dateLabel}</label>
            <input
              type="text"
              value={item.date || ""}
              onChange={(e) => updateAwardItem(item.id, "date", e.target.value)}
              onBlur={() => saveAwards()}
              placeholder={t.editor.awards.datePlaceholder}
              className="mt-1.5 w-full max-w-[220px] rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400">{t.editor.awards.descriptionLabel}</label>
            <textarea
              rows={3}
              value={item.description || ""}
              onChange={(e) => updateAwardItem(item.id, "description", e.target.value)}
              onBlur={() => saveAwards()}
              className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white outline-none"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
