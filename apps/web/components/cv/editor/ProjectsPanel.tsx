import React from "react";
import { useTranslation } from "../../../hooks/useTranslation";

type ProjectsPanelProps = {
  projects: any[];
  addProjectItem: () => void;
  updateProjectItem: (id: string, field: string, val: any) => void;
  removeProjectItem: (id: string) => void;
  saveProjects: (items?: any[]) => void;
};

export function ProjectsPanel({
  projects,
  addProjectItem,
  updateProjectItem,
  removeProjectItem,
  saveProjects,
}: ProjectsPanelProps) {
  const { t, language } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          {t.editor.projects.title}
        </h3>
        <button
          onClick={addProjectItem}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/10 transition-all border-none"
        >
          {t.editor.projects.addBtn}
        </button>
      </div>

      {projects.map((proj) => (
        <div
          key={proj.id}
          className="relative rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 group"
        >
          <button
            onClick={() => removeProjectItem(proj.id)}
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
              <label className="block text-xs font-medium text-slate-400">{t.editor.projects.name}</label>
              <input
                type="text"
                value={proj.name}
                onChange={(e) => updateProjectItem(proj.id, "name", e.target.value)}
                onBlur={() => saveProjects()}
                placeholder={t.editor.projects.namePlaceholder}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">{t.editor.projects.role}</label>
              <input
                type="text"
                value={proj.role || ""}
                onChange={(e) => updateProjectItem(proj.id, "role", e.target.value)}
                onBlur={() => saveProjects()}
                placeholder={t.editor.projects.rolePlaceholder}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400">{t.editor.projects.link}</label>
              <input
                type="text"
                value={proj.url || ""}
                onChange={(e) => updateProjectItem(proj.id, "url", e.target.value)}
                onBlur={() => saveProjects()}
                placeholder={t.editor.projects.linkPlaceholder}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">
                {t.editor.projects.technologies}
              </label>
              <input
                type="text"
                value={Array.isArray(proj.technologies) ? proj.technologies.join(", ") : ""}
                onChange={(e) => {
                  const arr = e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  updateProjectItem(proj.id, "technologies", arr);
                }}
                onBlur={() => saveProjects()}
                placeholder={t.editor.projects.technologiesPlaceholder}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400">{t.editor.projects.description}</label>
            <textarea
              rows={3}
              value={proj.description}
              onChange={(e) => updateProjectItem(proj.id, "description", e.target.value)}
              onBlur={() => saveProjects()}
              placeholder={t.editor.projects.descriptionPlaceholder}
              className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
