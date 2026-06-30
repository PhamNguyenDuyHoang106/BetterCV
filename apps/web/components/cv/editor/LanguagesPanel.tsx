import React from "react";
import { useTranslation } from "../../../hooks/useTranslation";

type LanguagesPanelProps = {
  languages: any[];
  addLanguageItem: () => void;
  updateLanguageItem: (id: string, field: string, val: any) => void;
  removeLanguageItem: (id: string) => void;
  saveLanguages: (items?: any[]) => void;
};

export function LanguagesPanel({
  languages,
  addLanguageItem,
  updateLanguageItem,
  removeLanguageItem,
  saveLanguages,
}: LanguagesPanelProps) {
  const { t, language } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          {t.editor.languages.title}
        </h3>
        <button
          onClick={addLanguageItem}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md border-none"
        >
          {t.editor.languages.addBtn}
        </button>
      </div>

      {languages.map((item) => (
        <div key={item.id} className="relative rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
          <button
            onClick={() => removeLanguageItem(item.id)}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700/60"
            title={language === "vi" ? "Xóa" : "Delete"}
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400">{t.editor.languages.nameLabel}</label>
              <input
                type="text"
                value={item.name || ""}
                onChange={(e) => updateLanguageItem(item.id, "name", e.target.value)}
                onBlur={() => saveLanguages()}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">{t.editor.languages.levelLabel}</label>
              <input
                type="text"
                value={item.level || ""}
                onChange={(e) => updateLanguageItem(item.id, "level", e.target.value)}
                onBlur={() => saveLanguages()}
                placeholder={t.editor.languages.levelPlaceholder}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
