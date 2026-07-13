import React from "react";
import { useTranslation } from "../../../hooks/useTranslation";

const LANG_LEVELS = [
  { value: "Beginner", vi: "Sơ cấp (Beginner)", en: "Beginner" },
  { value: "Elementary", vi: "Cơ bản (Elementary)", en: "Elementary" },
  { value: "Intermediate", vi: "Trung cấp (Intermediate)", en: "Intermediate" },
  { value: "Advanced", vi: "Nâng cao (Advanced)", en: "Advanced" },
  { value: "Native", vi: "Bản ngữ (Native)", en: "Native" },
];

type LanguagesPanelProps = {
  languages: any[];
  showLangLevel: boolean;
  handleShowLangLevelChange: (val: boolean) => void;
  addLanguageItem: () => void;
  updateLanguageItem: (id: string, field: string, val: any) => void;
  removeLanguageItem: (id: string) => void;
  saveLanguages: (items?: any[], showLvl?: boolean) => void;
};

export function LanguagesPanel({
  languages,
  showLangLevel,
  handleShowLangLevelChange,
  addLanguageItem,
  updateLanguageItem,
  removeLanguageItem,
  saveLanguages,
}: LanguagesPanelProps) {
  const { t, language } = useTranslation();

  const getLevelIndex = (level: string) => {
    const idx = LANG_LEVELS.findIndex((l) => l.value === level);
    return idx >= 0 ? idx + 1 : 3; // default to Intermediate (3)
  };

  return (
    <div className="space-y-6">
      {/* Toggle show level */}
      <div className="flex items-center gap-3 py-1">
        <button
          type="button"
          onClick={() => handleShowLangLevelChange(!showLangLevel)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            showLangLevel ? "bg-sky-500" : "bg-slate-800"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              showLangLevel ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-sm font-medium text-slate-300">
          {language === "vi"
            ? "Hiển thị mức độ thành thạo (thang đo)"
            : "Show proficiency scale (5 levels)"}
        </span>
      </div>

      <div className="h-[1px] bg-slate-800/80 my-2" />

      {/* Header row */}
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
        <div key={item.id} className="relative rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 group">
          <button
            onClick={() => removeLanguageItem(item.id)}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700/60 opacity-0 group-hover:opacity-100 transition-opacity"
            title={language === "vi" ? "Xóa" : "Delete"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className={showLangLevel ? "space-y-4" : "grid grid-cols-2 gap-4"}>
            {/* Language name */}
            <div>
              <label className="block text-xs font-medium text-slate-400">
                {t.editor.languages.nameLabel}
              </label>
              <input
                type="text"
                value={item.name || ""}
                onChange={(e) => updateLanguageItem(item.id, "name", e.target.value)}
                onBlur={() => saveLanguages()}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Level — text input or 5-scale */}
            {showLangLevel ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
                  <span>{t.editor.languages.levelLabel}:</span>
                  <span className="text-sky-400 font-bold">
                    {LANG_LEVELS.find((l) => l.value === item.level)
                      ? language === "vi"
                        ? LANG_LEVELS.find((l) => l.value === item.level)!.vi
                        : item.level
                      : language === "vi" ? "Trung cấp" : "Intermediate"}
                  </span>
                </div>
                <div className="relative pt-1">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={getLevelIndex(item.level)}
                    onChange={(e) => {
                      const idx = parseInt(e.target.value) - 1;
                      const newLevel = LANG_LEVELS[idx]?.value || "Intermediate";
                      updateLanguageItem(item.id, "level", newLevel);
                      saveLanguages(
                        languages.map((l) =>
                          l.id === item.id ? { ...l, level: newLevel } : l
                        )
                      );
                    }}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-between text-[8px] text-slate-600 px-1 mt-0.5 font-semibold">
                    <span>Beg</span>
                    <span>Ele</span>
                    <span>Int</span>
                    <span>Adv</span>
                    <span>Nat</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-400">
                  {t.editor.languages.levelLabel}
                </label>
                <input
                  type="text"
                  value={item.level || ""}
                  onChange={(e) => updateLanguageItem(item.id, "level", e.target.value)}
                  onBlur={() => saveLanguages()}
                  placeholder={t.editor.languages.levelPlaceholder}
                  className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
        </div>
      ))}

      {languages.length === 0 && (
        <p className="text-xs text-slate-500 text-center py-4">
          {language === "vi"
            ? "Chưa có ngôn ngữ nào. Nhấn \"+ Thêm ngôn ngữ\" để bắt đầu."
            : "No languages yet. Click \"+ Add language\" to get started."}
        </p>
      )}
    </div>
  );
}
