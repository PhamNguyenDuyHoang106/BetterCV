import React from "react";
import { useTranslation } from "../../../hooks/useTranslation";

type SummaryPanelProps = {
  summaryText: string;
  setSummaryText: (val: string) => void;
  saveSummary: (val?: string) => void;
  openAiRewrite: (type: "summary" | "experience", id?: string) => void;
};

export function SummaryPanel({
  summaryText,
  setSummaryText,
  saveSummary,
  openAiRewrite,
}: SummaryPanelProps) {
  const { t, language } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
              {t.editor.summary.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {language === "vi"
                ? "Viết một mô tả ngắn gọn về kinh nghiệm cốt lõi của bạn (hỗ trợ định dạng Markdown)."
                : "Write a brief description of your core experience (supports Markdown format)."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => openAiRewrite("summary")}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow shadow-indigo-500/10 border-none transition-all"
            >
              {t.editor.summary.aiWriteBtn}
            </button>
            <span className="text-xs font-mono text-slate-500">
              {summaryText.length} {language === "vi" ? "ký tự" : "characters"}
            </span>
          </div>
        </div>

        <textarea
          rows={8}
          value={summaryText}
          onChange={(e) => {
            setSummaryText(e.target.value);
            saveSummary(e.target.value);
          }}
          placeholder={t.editor.summary.placeholder}
          className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-sans leading-relaxed"
        />
      </div>
    </div>
  );
}
