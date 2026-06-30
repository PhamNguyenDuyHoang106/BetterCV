import React from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { InlineAiPanel } from "./InlineAiPanel";

type InlineAiState = {
  open: boolean;
  isGenerating: boolean;
  output: string;
};

type ExperiencePanelProps = {
  experiences: any[];
  addExperienceItem: () => void;
  updateExperienceItem: (id: string, field: string, val: any) => void;
  removeExperienceItem: (id: string) => void;
  saveExperiences: (items?: any[]) => void;
  getInlineAiState: (key: string) => InlineAiState;
  onOpenInlineAi: (key: string) => void;
  onCloseInlineAi: (key: string) => void;
  onGenerateInlineAi: (
    key: string,
    currentDescription: string,
    expCtx: { company: string; position: string; startDate?: string; endDate?: string; current?: boolean }
  ) => Promise<void>;
  onAcceptInlineAi: (key: string, text: string) => void;
};

export function ExperiencePanel({
  experiences,
  addExperienceItem,
  updateExperienceItem,
  removeExperienceItem,
  saveExperiences,
  getInlineAiState,
  onOpenInlineAi,
  onCloseInlineAi,
  onGenerateInlineAi,
  onAcceptInlineAi,
}: ExperiencePanelProps) {
  const { t, language } = useTranslation();

  const handleAiClick = (exp: any) => {
    const aiState = getInlineAiState(exp.id);

    if (aiState.open) {
      // Đang mở → đóng
      onCloseInlineAi(exp.id);
      return;
    }

    // Mở panel và trigger generate luôn
    onOpenInlineAi(exp.id);
    onGenerateInlineAi(exp.id, exp.description || "", {
      company: exp.company || "",
      position: exp.position || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      current: exp.current,
    });
  };

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

      {experiences.map((exp) => {
        const aiState = getInlineAiState(exp.id);

        return (
          <div
            key={exp.id}
            className="relative rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 group"
          >
            {/* Delete button */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
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

            {/* Company + Position */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400">
                  {language === "vi" ? "Tên công ty" : "Company Name"}
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
                  {language === "vi" ? "Vị trí chức danh" : "Role / Position"}
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

            {/* Date range */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400">
                  {language === "vi" ? "Bắt đầu (YYYY-MM)" : "Start (YYYY-MM)"}
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

            {/* Description + AI inline */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-400">
                  {t.editor.experience.workDesc}
                </label>

                {/* Nút Viết bằng AI */}
                <button
                  type="button"
                  onClick={() => handleAiClick(exp)}
                  disabled={aiState.isGenerating}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all border-none disabled:opacity-60 disabled:cursor-wait ${
                    aiState.open && !aiState.isGenerating
                      ? "bg-purple-800/50 text-purple-300 ring-1 ring-purple-500/30"
                      : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow shadow-indigo-500/10"
                  }`}
                  title={
                    exp.description?.trim()
                      ? language === "vi"
                        ? "AI sẽ rewrite dựa trên nội dung bạn đã nhập"
                        : "AI will rewrite based on your input"
                      : language === "vi"
                        ? "AI sẽ tự sinh mô tả từ tên công ty và vị trí"
                        : "AI will generate description from company & position"
                  }
                >
                  {aiState.isGenerating ? (
                    <>
                      <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {language === "vi" ? "Đang viết..." : "Writing..."}
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                      {language === "vi" ? "Viết bằng AI ✨" : "Write with AI ✨"}
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={4}
                value={exp.description}
                onChange={(e) => updateExperienceItem(exp.id, "description", e.target.value)}
                onBlur={() => saveExperiences()}
                placeholder={
                  language === "vi"
                    ? "Nhập chi tiết công việc (hoặc để trống để AI tự sinh từ tên công ty & vị trí)"
                    : "Enter job details (or leave blank for AI to generate from company & position)"
                }
                className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
              />

              {/* Inline AI Panel */}
              {aiState.open && (
                <InlineAiPanel
                  isGenerating={aiState.isGenerating}
                  streamingOutput={aiState.output}
                  onAccept={(text) => onAcceptInlineAi(exp.id, text)}
                  onClose={() => onCloseInlineAi(exp.id)}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
