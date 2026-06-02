import React, { useState } from "react";
import { apiFetch } from "../../../lib/api";

type AtsReport = {
  score: number;
  rulesEvaluated: Array<{
    ruleName: string;
    score: number;
    weight: number;
    findings: string[];
  }>;
  findings: string[];
  recommendations: string[];
};

type AtsPanelProps = {
  cvId: string;
};

export function AtsPanel({ cvId }: AtsPanelProps) {
  const [jobDescription, setJobDescription] = useState<string>("");
  const [atsReport, setAtsReport] = useState<AtsReport | null>(null);
  const [isAnalyzingAts, setIsAnalyzingAts] = useState<boolean>(false);

  const runAtsAnalysis = async () => {
    if (!jobDescription.trim()) {
      alert("Vui lòng nhập mô tả công việc (JD) trước.");
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
      alert("Lỗi khi chấm điểm ATS. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setIsAnalyzingAts(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
            Chấm Điểm & Tối ưu hóa ATS
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Dán mô tả công việc (Job Description) mục tiêu vào đây để hệ thống tự động quét từ khóa và đo lường độ trùng khớp.
          </p>
        </div>

        <textarea
          rows={6}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Ví dụ: Yêu cầu ứng viên có kinh nghiệm lập trình React, Node.js và TypeScript. Hiểu biết sâu về cơ sở dữ liệu PostgreSQL..."
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
              Đang phân tích CV theo chuẩn ATS...
            </>
          ) : (
            "Bắt đầu chấm điểm ATS 🎯"
          )}
        </button>
      </div>

      {atsReport && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Kết quả phân tích tổng quan</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Dựa trên thuật toán so khớp trọng số thông minh
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block tracking-wider font-semibold">
                  Điểm ATS
                </span>
                <span
                  className={`text-2xl font-black ${
                    atsReport.score >= 80
                      ? "text-emerald-400"
                      : atsReport.score >= 50
                        ? "text-amber-400"
                        : "text-rose-400"
                  }`}
                >
                  {atsReport.score}/100
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
                    rule.score >= 80
                      ? "text-emerald-400"
                      : rule.score >= 50
                        ? "text-amber-400"
                        : "text-rose-400"
                  }`}
                >
                  {rule.score}%
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-slate-800 pt-4">
            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Phát hiện của hệ thống
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
              Hành động khắc phục đề xuất
            </h5>
            <ul className="space-y-1.5">
              {atsReport.recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed"
                >
                  <span className="text-indigo-400 mt-1">✓</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
