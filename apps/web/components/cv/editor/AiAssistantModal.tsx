import React from "react";
import { useTranslation } from "../../../hooks/useTranslation";

type TargetType = {
  type: "summary" | "experience";
  id?: string;
};

type AiAssistantModalProps = {
  showAiModal: boolean;
  setShowAiModal: (val: boolean) => void;
  aiTarget: TargetType;
  aiStyle: "professional" | "concise" | "ats";
  setAiStyle: (val: "professional" | "concise" | "ats") => void;
  aiStreamingOutput: string;
  isAiGenerating: boolean;
  triggerAiRewrite: () => Promise<void>;
  acceptAiSuggestion: () => void;
  summaryText: string;
  experiences: any[];
};

export function AiAssistantModal({
  showAiModal,
  setShowAiModal,
  aiTarget,
  aiStyle,
  setAiStyle,
  aiStreamingOutput,
  isAiGenerating,
  triggerAiRewrite,
  acceptAiSuggestion,
  summaryText,
  experiences,
}: AiAssistantModalProps) {
  const { t, language } = useTranslation();

  if (!showAiModal) return null;

  const emptyText = language === "vi" ? "(Văn bản trống)" : "(Empty text)";

  const getOriginalText = () => {
    if (aiTarget.type === "summary") {
      return summaryText || emptyText;
    }
    const exp = experiences.find((e) => e.id === aiTarget.id);
    return exp && exp.description ? exp.description : emptyText;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
            <span className="text-sm font-bold text-white">
              {t.editor.aiAssistant.title}
            </span>
          </div>
          <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Workspace - Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Original and Options */}
          <div className="w-[45%] border-r border-slate-800 p-5 flex flex-col gap-4 overflow-y-auto bg-slate-950/20">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {language === "vi" ? "Định dạng & Phong cách Rewrite" : "Format & Rewrite Style"}
              </h4>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  {
                    id: "professional",
                    label: language === "vi" ? "Chuyên nghiệp" : "Professional",
                  },
                  {
                    id: "concise",
                    label: language === "vi" ? "Ngắn gọn" : "Concise",
                  },
                  {
                    id: "ats",
                    label: language === "vi" ? "Chuẩn ATS" : "ATS-Optimized",
                  },
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setAiStyle(style.id as any)}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
                      aiStyle === style.id
                        ? "bg-indigo-600 text-white border-none"
                        : "bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700/60"
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {t.editor.aiAssistant.originalText}
              </h4>
              <div className="flex-1 bg-slate-950 rounded-xl p-4 border border-slate-850 text-xs text-slate-300 overflow-y-auto leading-relaxed">
                {getOriginalText()}
              </div>
            </div>

            <button
              onClick={triggerAiRewrite}
              disabled={isAiGenerating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-sm font-bold text-white shadow shadow-indigo-500/10 border-none transition-all disabled:opacity-50"
            >
              {isAiGenerating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  {t.editor.aiAssistant.generating}
                </div>
              ) : (
                t.editor.aiAssistant.generateBtn
              )}
            </button>
          </div>

          {/* Right Column: AI Suggestion output */}
          <div className="flex-1 p-5 flex flex-col gap-4 bg-slate-950/40">
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  {t.editor.aiAssistant.aiSuggestion}
                </h4>
                {isAiGenerating && (
                  <span className="text-[10px] text-indigo-400 animate-pulse">
                    {language === "vi" ? "Streaming từ OpenAI..." : "Streaming from OpenAI..."}
                  </span>
                )}
              </div>
              <textarea
                readOnly={isAiGenerating}
                value={aiStreamingOutput}
                placeholder={
                  language === "vi"
                    ? "Đề xuất của AI sẽ xuất hiện tại đây..."
                    : "AI suggestion will appear here..."
                }
                className="flex-1 bg-slate-950 rounded-xl p-4 border border-slate-850 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 overflow-y-auto leading-relaxed font-sans"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                {t.editor.cancel}
              </button>
              <button
                type="button"
                onClick={acceptAiSuggestion}
                disabled={!aiStreamingOutput || isAiGenerating}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow transition-all border-none disabled:opacity-40"
              >
                {t.editor.aiAssistant.acceptBtn}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
