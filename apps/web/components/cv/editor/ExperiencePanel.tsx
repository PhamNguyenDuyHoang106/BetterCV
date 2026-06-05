import React from "react";
import { useTranslation } from "../../../hooks/useTranslation";

type ExperiencePanelProps = {
  experiences: any[];
  addExperienceItem: () => void;
  updateExperienceItem: (id: string, field: string, val: any) => void;
  removeExperienceItem: (id: string) => void;
  saveExperiences: (items?: any[]) => void;
  openAiRewrite: (type: "summary" | "experience", id?: string) => void;
};

export function ExperiencePanel({
  experiences,
  addExperienceItem,
  updateExperienceItem,
  removeExperienceItem,
  saveExperiences,
  openAiRewrite,
}: ExperiencePanelProps) {
  const { t, language } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          {t.editor.experience.title}
        </h3>
        <button
          onClick={addExperienceItem}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/10 transition-all border-none"
        >
          {t.editor.experience.addBtn}
        </button>
      </div>

      {experiences.map((exp) => (
        <div
          key={exp.id}
          className="relative rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 group"
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => openAiRewrite("experience", exp.id)}
              className="flex h-8 px-2.5 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700/80 text-indigo-400 hover:text-indigo-300 border border-slate-700/60 transition-all text-xs font-bold"
              title={language === "vi" ? "Tối ưu mô tả bằng AI" : "Optimize description with AI"}
            >
              {t.editor.summary.aiWriteBtn}
            </button>
            <button
              onClick={() => removeExperienceItem(exp.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-900/60 transition-all"
              title={t.editor.delete}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400">
                {language === "vi" ? "Tên công ty *" : "Company Name *"}
              </label>
              <input
                type="text"
                value={exp.company}
                onChange={(e) => updateExperienceItem(exp.id, "company", e.target.value)}
                onBlur={() => saveExperiences()}
                placeholder={t.editor.experience.companyPlaceholder}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">
                {language === "vi" ? "Vị trí chức danh *" : "Role / Position *"}
              </label>
              <input
                type="text"
                value={exp.position}
                onChange={(e) => updateExperienceItem(exp.id, "position", e.target.value)}
                onBlur={() => saveExperiences()}
                placeholder={t.editor.experience.rolePlaceholder}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400">
                {language === "vi" ? "Bắt đầu (YYYY-MM) *" : "Start (YYYY-MM) *"}
              </label>
              <input
                type="text"
                value={exp.startDate}
                onChange={(e) => updateExperienceItem(exp.id, "startDate", e.target.value)}
                onBlur={() => saveExperiences()}
                placeholder={t.editor.experience.startMonthPlaceholder}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">
                {language === "vi" ? "Kết thúc (YYYY-MM)" : "End (YYYY-MM)"}
              </label>
              <input
                type="text"
                value={exp.endDate || ""}
                disabled={exp.current}
                onChange={(e) => updateExperienceItem(exp.id, "endDate", e.target.value)}
                onBlur={() => saveExperiences()}
                placeholder={t.editor.experience.endMonthPlaceholder}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none disabled:opacity-40"
              />
            </div>
            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) => {
                    updateExperienceItem(exp.id, "current", e.target.checked);
                    saveExperiences(
                      experiences.map((ex) =>
                        ex.id === exp.id ? { ...ex, current: e.target.checked } : ex
                      )
                    );
                  }}
                  className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <span>{t.editor.experience.currentJob}</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400">
              {t.editor.experience.workDesc}
            </label>
            <textarea
              rows={4}
              value={exp.description}
              onChange={(e) => updateExperienceItem(exp.id, "description", e.target.value)}
              onBlur={() => saveExperiences()}
              placeholder={t.editor.experience.workDescPlaceholder}
              className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
