import React from "react";
import { useTranslation } from "../../../hooks/useTranslation";

type InlineAiPanelProps = {
  isGenerating: boolean;
  streamingOutput: string;
  onAccept: (text: string) => void;
  onClose: () => void;
};

export function InlineAiPanel({
  isGenerating,
  streamingOutput,
  onAccept,
  onClose,
}: InlineAiPanelProps) {
  const { language } = useTranslation();

  return (
    <div className="mt-2 rounded-xl border border-indigo-500/25 bg-slate-950/80 backdrop-blur-sm shadow-xl shadow-indigo-500/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800/80 bg-gradient-to-r from-purple-900/20 to-indigo-900/20">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-[11px] font-bold text-purple-300">
            {language === "vi" ? "Gợi ý từ AI" : "AI Suggestion"}
          </span>
          {isGenerating && (
            <span className="text-[10px] text-indigo-400 animate-pulse ml-1">
              {language === "vi" ? "Đang viết..." : "Writing..."}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
          title={language === "vi" ? "Đóng" : "Close"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-3">
        {/* Output area */}
        {isGenerating && !streamingOutput ? (
          /* Skeleton loading khi chưa có output */
          <div className="space-y-2 py-1">
            <div className="h-3 rounded bg-slate-800 animate-pulse w-full" />
            <div className="h-3 rounded bg-slate-800 animate-pulse w-5/6" />
            <div className="h-3 rounded bg-slate-800 animate-pulse w-4/5" />
            <div className="h-3 rounded bg-slate-800 animate-pulse w-3/4" />
          </div>
        ) : (
          <div className="relative">
            <textarea
              readOnly={isGenerating}
              value={streamingOutput}
              onChange={() => {}}
              rows={5}
              className="w-full rounded-lg bg-slate-900 border border-slate-700/60 px-3 py-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none leading-relaxed font-sans resize-none"
              placeholder={language === "vi" ? "AI gợi ý sẽ xuất hiện ở đây..." : "AI suggestion will appear here..."}
            />
            {/* glow khi đang stream */}
            {isGenerating && (
              <div className="absolute inset-0 rounded-lg border border-indigo-500/40 animate-pulse pointer-events-none" />
            )}
          </div>
        )}

        {/* Action buttons – chỉ hiển thị khi đã có nội dung và không đang generate */}
        {!isGenerating && streamingOutput && (
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              {language === "vi" ? "Bỏ qua" : "Dismiss"}
            </button>
            <button
              type="button"
              onClick={() => onAccept(streamingOutput)}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-all border-none"
            >
              {language === "vi" ? "✓ Áp dụng" : "✓ Apply"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
