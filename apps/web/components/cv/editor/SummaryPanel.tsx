import React from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { InlineAiPanel } from "./InlineAiPanel";

type InlineAiState = {
  open: boolean;
  isGenerating: boolean;
  output: string;
};

type SummaryPanelProps = {
  summaryText: string;
  setSummaryText: (val: string) => void;
  saveSummary: (val?: string) => void;
  inlineAiState: InlineAiState;
  onOpenInlineAi: () => void;
  onCloseInlineAi: () => void;
  onGenerateInlineAi: (currentText: string) => Promise<void>;
  onAcceptInlineAi: (text: string) => void;
};

export function SummaryPanel({
  summaryText,
  setSummaryText,
  saveSummary,
  inlineAiState,
  onOpenInlineAi,
  onCloseInlineAi,
  onGenerateInlineAi,
  onAcceptInlineAi,
}: SummaryPanelProps) {
  const { t, language } = useTranslation();

  const handleAiClick = () => {
    if (inlineAiState.open) {
      onCloseInlineAi();
      return;
    }
    // Mở panel và generate luôn
    onOpenInlineAi();
    onGenerateInlineAi(summaryText);
  };

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

          <div className="flex items-center gap-3 shrink-0 ml-4">
            {/* Nút Viết bằng AI */}
            <button
              type="button"
              onClick={handleAiClick}
              disabled={inlineAiState.isGenerating}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all border-none disabled:opacity-60 disabled:cursor-wait ${
                inlineAiState.open && !inlineAiState.isGenerating
                  ? "bg-purple-800/50 text-purple-300 ring-1 ring-purple-500/30"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow shadow-indigo-500/10"
              }`}
              title={
                summaryText.trim()
                  ? language === "vi"
                    ? "AI sẽ rewrite nội dung bạn đã nhập kết hợp với hồ sơ"
                    : "AI will rewrite your input combined with your profile"
                  : language === "vi"
                    ? "AI sẽ tự sinh summary từ thông tin hồ sơ của bạn"
                    : "AI will generate a summary from your profile data"
              }
            >
              {inlineAiState.isGenerating ? (
                <>
                  <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {language === "vi" ? "Đang viết..." : "Writing..."}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  {t.editor.summary.aiWriteBtn}
                </>
              )}
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
          placeholder={
            language === "vi"
              ? "Nhập nội dung tóm tắt (hoặc để trống để AI tự sinh từ toàn bộ hồ sơ của bạn)"
              : "Enter summary text (or leave blank for AI to generate from your full profile)"
          }
          className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-sans leading-relaxed"
        />

        {/* Inline AI Panel */}
        {inlineAiState.open && (
          <InlineAiPanel
            isGenerating={inlineAiState.isGenerating}
            streamingOutput={inlineAiState.output}
            onAccept={onAcceptInlineAi}
            onClose={onCloseInlineAi}
          />
        )}
      </div>
    </div>
  );
}
