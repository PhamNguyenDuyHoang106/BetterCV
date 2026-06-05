import React, { useState } from "react";
import { apiFetch } from "../../../lib/api";
import { useTranslation } from "../../../hooks/useTranslation";

type Recommendation = {
  id: string;
  category: "semantic" | "keyword" | "experience" | "skills" | "formatting" | "ATS" | "CONTENT" | "FORMAT" | "KEYWORD";
  severity: "low" | "medium" | "high" | "LOW" | "MEDIUM" | "HIGH";
  title: string;
  description: string;
  actionable: boolean;
};

type AtsReport = {
  score: number;
  rulesEvaluated: Array<{
    ruleName: string;
    score: number;
    weight: number;
    findings: string[];
  }>;
  findings: string[];
  recommendations: Recommendation[];
};

type AtsPanelProps = {
  cvId: string;
};

export function AtsPanel({ cvId }: AtsPanelProps) {
  const { t, language } = useTranslation();
  const [jobDescription, setJobDescription] = useState<string>("");
  const [atsReport, setAtsReport] = useState<AtsReport | null>(null);
  const [isAnalyzingAts, setIsAnalyzingAts] = useState<boolean>(false);

  const runAtsAnalysis = async () => {
    if (!jobDescription.trim()) {
      alert(
        language === "vi"
          ? "Vui lòng nhập mô tả công việc (JD) trước."
          : "Please enter the job description (JD) first."
      );
      return;
    }
    setIsAnalyzingAts(true);
    try {
      const res = await apiFetch<any>("/ats/score", {
        method: "POST",
        body: JSON.stringify({
          cvId,
          jobDescription,
        }),
      });
      const report = res?.data?.data || res?.data || res;
      setAtsReport(report);
    } catch (err) {
      console.error("ATS Error:", err);
      alert(t.editor.ats.scanFailed);
    } finally {
      setIsAnalyzingAts(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
            {t.editor.ats.scanTitle}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {t.editor.ats.emptyJD}
          </p>
        </div>

        <textarea
          rows={6}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder={t.editor.ats.jdPlaceholder}
          className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
        />

        <button
          onClick={runAtsAnalysis}
          disabled={isAnalyzingAts}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-bold text-white shadow shadow-indigo-500/10 border-none transition-all disabled:opacity-50"
        >
          {isAnalyzingAts ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              {t.editor.ats.scanning}
            </>
          ) : (
            t.editor.ats.runScanBtn
          )}
        </button>
      </div>

      {atsReport && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-6 animate-in fade-in duration-200">
          {atsReport.score === null && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex gap-2">
              <span className="material-symbols-outlined shrink-0 text-lg">error</span>
              <div>
                <p className="font-bold">
                  {language === "vi" ? "Phân tích AI tạm thời gián đoạn" : "AI Analysis Temporarily Interrupted"}
                </p>
                <p className="text-slate-400 mt-0.5">
                  {language === "vi"
                    ? "Hệ thống AI không phản hồi. Các tiêu chuẩn trình bày (Formatting) vẫn được kiểm tra bình thường."
                    : "AI system did not respond. Formatting standards are still evaluated normally."}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-200">{t.editor.ats.matchingDetails}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {atsReport.score === null
                  ? language === "vi"
                    ? "Dịch vụ AI phân tích CV tạm thời không khả dụng"
                    : "AI resume analysis service is temporarily unavailable"
                  : language === "vi"
                  ? "Dựa trên thuật toán so khớp trọng số thông minh"
                  : "Based on smart weighted match algorithms"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block tracking-wider font-semibold">
                  {language === "vi" ? "Điểm ATS" : "ATS Score"}
                </span>
                <span
                  className={`text-2xl font-black ${
                    atsReport.score === null || atsReport.score === undefined
                      ? "text-slate-400"
                      : atsReport.score >= 80
                        ? "text-emerald-400"
                        : atsReport.score >= 50
                          ? "text-amber-400"
                          : "text-rose-400"
                  }`}
                >
                  {atsReport.score === null || atsReport.score === undefined ? "N/A" : `${atsReport.score}/100`}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {atsReport.rulesEvaluated.map((rule, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-800 bg-slate-900/20 p-3 text-center"
              >
                <span className="text-[10px] text-slate-400 block truncate font-medium">
                  {rule.ruleName}
                </span>
                <span
                  className={`text-lg font-bold block mt-1.5 ${
                    rule.score === null || rule.score === undefined
                      ? "text-slate-500"
                      : rule.score >= 80
                        ? "text-emerald-400"
                        : rule.score >= 50
                          ? "text-amber-400"
                          : "text-rose-400"
                  }`}
                >
                  {rule.score === null || rule.score === undefined ? "N/A" : `${rule.score}%`}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-slate-800 pt-4">
            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {language === "vi" ? "Phát hiện của hệ thống" : "System Findings"}
            </h5>
            <ul className="space-y-1.5">
              {atsReport.findings.map((finding, idx) => (
                <li
                  key={idx}
                  className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed"
                >
                  <span className="text-amber-500 mt-1">•</span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 border-t border-slate-800 pt-4">
            <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              {t.editor.ats.recommendations}
            </h5>
            <div className="space-y-3">
              {atsReport.recommendations.map((rec) => {
                let sevColor = "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";
                let iconColor = "text-emerald-400";
                let icon = "check_circle";

                const severityLower = rec.severity.toLowerCase();

                if (severityLower === "high") {
                  sevColor = "bg-rose-500/10 border-rose-500/20 text-rose-300";
                  iconColor = "text-rose-400";
                  icon = "warning";
                } else if (severityLower === "medium") {
                  sevColor = "bg-amber-500/10 border-amber-500/20 text-amber-300";
                  iconColor = "text-amber-400";
                  icon = "info";
                }

                return (
                  <div
                    key={rec.id}
                    className={`p-3.5 rounded-xl border border-slate-800/80 flex gap-3 ${sevColor}`}
                  >
                    <span className={`material-symbols-outlined shrink-0 text-lg mt-0.5 ${iconColor}`}>
                      {icon}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-white leading-none">{rec.title}</span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white/10 text-slate-300 shrink-0 leading-none">
                          {rec.category}
                        </span>
                        {rec.actionable && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white shrink-0 leading-none">
                            {t.resumes.actionableTag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-300 font-medium">
                        {rec.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
