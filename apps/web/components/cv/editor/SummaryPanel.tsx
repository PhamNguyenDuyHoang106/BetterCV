import React from "react";

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
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
              Tự giới thiệu bản thân
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Viết một mô tả ngắn gọn về kinh nghiệm cốt lõi của bạn (hỗ trợ định dạng Markdown).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => openAiRewrite("summary")}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow shadow-indigo-500/10 border-none transition-all"
            >
              ✨ AI Tối ưu hóa
            </button>
            <span className="text-xs font-mono text-slate-500">{summaryText.length} ký tự</span>
          </div>
        </div>

        <textarea
          rows={8}
          value={summaryText}
          onChange={(e) => {
            setSummaryText(e.target.value);
            saveSummary(e.target.value);
          }}
          placeholder="Ví dụ: Tôi là một Kỹ sư phần mềm có hơn 5 năm kinh nghiệm làm việc với các hệ thống phân tán..."
          className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-sans leading-relaxed"
        />
      </div>
    </div>
  );
}
