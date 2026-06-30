import React from "react";
import { useTranslation } from "../../../hooks/useTranslation";

type EducationPanelProps = {
  educations: any[];
  addEducationItem: () => void;
  updateEducationItem: (id: string, field: string, val: any) => void;
  removeEducationItem: (id: string) => void;
  saveEducations: (items?: any[]) => void;
};

export function EducationPanel({
  educations,
  addEducationItem,
  updateEducationItem,
  removeEducationItem,
  saveEducations,
}: EducationPanelProps) {
  const { t, language } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          {t.editor.education.title}
        </h3>
        <button
          onClick={addEducationItem}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/10 transition-all border-none"
        >
          {t.editor.education.addBtn}
        </button>
      </div>

      {educations.map((edu) => (
        <div
          key={edu.id}
          className="relative rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 group"
        >
          <button
            onClick={() => removeEducationItem(edu.id)}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-900/60 transition-all"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400">
                {language === "vi" ? "Trường/Cơ sở đào tạo" : "School / University"}
              </label>
              <input
                type="text"
                value={edu.institution}
                onChange={(e) => updateEducationItem(edu.id, "institution", e.target.value)}
                onBlur={() => saveEducations()}
                placeholder={t.editor.education.schoolPlaceholder}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">
                {language === "vi" ? "Bằng cấp" : "Degree"}
              </label>
              <input
                type="text"
                value={edu.degree}
                onChange={(e) => updateEducationItem(edu.id, "degree", e.target.value)}
                onBlur={() => saveEducations()}
                placeholder={t.editor.education.degreePlaceholder}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-400">
                {t.editor.education.fieldOfStudyLabel}
              </label>
              <input
                type="text"
                value={edu.fieldOfStudy || ""}
                onChange={(e) => updateEducationItem(edu.id, "fieldOfStudy", e.target.value)}
                onBlur={() => saveEducations()}
                placeholder={t.editor.education.fieldOfStudyPlaceholder}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">
                {language === "vi" ? "Bắt đầu (YYYY-MM)" : "Start (YYYY-MM)"}
              </label>
              <input
                type="text"
                value={edu.startDate}
                onChange={(e) => updateEducationItem(edu.id, "startDate", e.target.value)}
                onBlur={() => saveEducations()}
                placeholder={t.editor.education.startDatePlaceholder}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">
                {language === "vi" ? "Tốt nghiệp (YYYY-MM)" : "Graduation (YYYY-MM)"}
              </label>
              <input
                type="text"
                value={edu.endDate || ""}
                disabled={edu.current}
                onChange={(e) => updateEducationItem(edu.id, "endDate", e.target.value)}
                onBlur={() => saveEducations()}
                placeholder={t.editor.education.endDatePlaceholder}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none disabled:opacity-40"
              />
            </div>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={!!edu.current}
                onChange={(e) => {
                  updateEducationItem(edu.id, "current", e.target.checked);
                  saveEducations(
                    educations.map((ed) =>
                      ed.id === edu.id ? { ...ed, current: e.target.checked } : ed
                    )
                  );
                }}
                className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <span>{language === "vi" ? "Hiện đang học tại đây" : "I currently study here"}</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400">{t.editor.education.gpaLabel}</label>
            <input
              type="text"
              value={edu.gpa || ""}
              onChange={(e) => updateEducationItem(edu.id, "gpa", e.target.value)}
              onBlur={() => saveEducations()}
              placeholder={t.editor.education.gpaPlaceholder}
              className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none max-w-[200px]"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
