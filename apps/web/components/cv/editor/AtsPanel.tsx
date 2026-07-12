import React, { useState } from "react";
import { apiFetch } from "../../../lib/api";
import { useTranslation } from "../../../hooks/useTranslation";
import { useEntitlement } from "../../../hooks/useEntitlement";
import { QuotaKey } from "@acv/shared";

type Recommendation = {
  id: string;
  category: "semantic" | "keyword" | "experience" | "skills" | "formatting" | "ATS" | "CONTENT" | "FORMAT" | "KEYWORD";
  severity: "low" | "medium" | "high" | "LOW" | "MEDIUM" | "HIGH";
  title: string;
  description: string;
  actionable: boolean;
};

type AtsReport = {
  id?: string;
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
  cvLocale: string;
};

export function AtsPanel({ cvId, cvLocale }: AtsPanelProps) {
  const { t, language } = useTranslation();
  const { getQuota, plan } = useEntitlement();
  const atsQuota = getQuota(QuotaKey.MAX_DAILY_ATS);

  const [jobDescription, setJobDescription] = useState<string>("");
  const [atsReport, setAtsReport] = useState<AtsReport | null>(null);
  const [isAnalyzingAts, setIsAnalyzingAts] = useState<boolean>(false);

  // Career Roadmap states
  const [showRoadmapForm, setShowRoadmapForm] = useState(false);
  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [isCreatingRoadmap, setIsCreatingRoadmap] = useState(false);

  const fetchCvProfile = async () => {
    try {
      const res = await apiFetch<any>(`/cvs/${cvId}`);
      const cv = res?.data || res;
      const profileSec = cv.sections?.find((s: any) => s.type === "PROFILE");
      if (profileSec && profileSec.content?.title) {
        setCurrentRole(profileSec.content.title);
      } else {
        setCurrentRole(language === "vi" ? "Lập trình viên" : "Software Engineer");
      }
    } catch (err) {
      console.warn("Failed to fetch CV profile:", err);
      setCurrentRole(language === "vi" ? "Lập trình viên" : "Software Engineer");
    }
  };

  const runAtsAnalysis = async () => {
    if (atsQuota.exhausted) {
      alert(
        language === "vi"
          ? `Bạn đã hết lượt quét ATS miễn phí hôm nay (${atsQuota.used}/${atsQuota.limit} lượt). Vui lòng nâng cấp để quét không giới hạn.`
          : `You have exhausted your daily ATS scans (${atsQuota.used}/${atsQuota.limit} scans). Please upgrade to unlock unlimited scans.`
      );
      return;
    }
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
          locale: cvLocale || language,
        }),
      });
      const report = res?.data?.data || res?.data || res;
      setAtsReport(report);

      // Auto-extract target role from JD first line
      const firstLine = jobDescription.split("\n")[0].trim();
      const extractedTitle = firstLine.length > 80 ? firstLine.slice(0, 80) + "..." : firstLine;
      setTargetRole(extractedTitle || (language === "vi" ? "Lập trình viên" : "Software Engineer"));
    } catch (err) {
      console.error("ATS Error:", err);
      alert(t.editor.ats.scanFailed);
    } finally {
      setIsAnalyzingAts(false);
    }
  };

  const handleCreateRoadmap = async () => {
    if (!currentRole.trim() || !targetRole.trim()) {
      alert(language === "vi" ? "Vui lòng điền đầy đủ thông tin." : "Please fill in all fields.");
      return;
    }
    setIsCreatingRoadmap(true);
    try {
      const res = await apiFetch<any>("/career/roadmap", {
        method: "POST",
        body: JSON.stringify({
          atsScanId: atsReport?.id,
          currentRole,
          targetRole,
        }),
      });
      const data = res?.data || res;
      if (data.success && data.roadmapId) {
        window.location.href = `/dashboard?tab=career&roadmapId=${data.roadmapId}`;
      } else {
        alert(language === "vi" ? "Không thể tạo lộ trình. Vui lòng thử lại." : "Failed to create roadmap.");
      }
    } catch (err: any) {
      console.error("Roadmap error:", err);
      alert(err.message || "Failed to create career roadmap.");
    } finally {
      setIsCreatingRoadmap(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        {atsQuota.exhausted && (
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 flex flex-col space-y-2 text-left">
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined">warning</span>
              <p className="text-xs font-semibold">
                {language === "vi"
                  ? `Bạn đã hết lượt quét ATS miễn phí hôm nay (${atsQuota.used}/${atsQuota.limit} lượt).`
                  : `You have exhausted your daily ATS scans (${atsQuota.used}/${atsQuota.limit} scans).`}
              </p>
            </div>
            <p className="text-[11px] text-slate-400">
              {language === "vi"
                ? "Nâng cấp gói tài khoản để mở khóa số lượt quét không giới hạn."
                : "Upgrade your plan to unlock unlimited scans."}
            </p>
            <a
              href="/dashboard?tab=upgrade"
              className="inline-block text-center mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all border-none"
            >
              {language === "vi" ? "Nâng cấp ngay" : "Upgrade Now"}
            </a>
          </div>
        )}

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
          disabled={isAnalyzingAts || atsQuota.exhausted}
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

          {/* AI Career Growth Explorer Card */}
          {atsReport.id && (
            <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-slate-900/90 to-indigo-950/40 p-4 space-y-4 shadow-md border-t pt-4">
              <div className="flex items-start gap-3 text-left">
                <span className="material-symbols-outlined text-indigo-400 text-[24px]">rocket_launch</span>
                <div className="space-y-1">
                  <h5 className="font-bold text-xs text-white leading-none">
                    {language === "vi" ? "🚀 Lộ trình Sự nghiệp AI" : "🚀 AI Career Growth Explorer"}
                  </h5>
                  <p className="text-[10px] leading-relaxed text-slate-300">
                    {language === "vi"
                      ? "Tạo lộ trình học tập cá nhân hóa từ các từ khóa còn thiếu để cải thiện tối đa điểm tương thích ATS của bạn."
                      : "Generate a personalized learning path from missing keywords to maximize your ATS match score."}
                  </p>
                </div>
              </div>

              {!showRoadmapForm ? (
                <button
                  onClick={() => {
                    fetchCvProfile();
                    setShowRoadmapForm(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-bold text-white border-none transition-all"
                >
                  <span className="material-symbols-outlined text-sm">explore</span>
                  {language === "vi" ? "Thiết lập lộ trình học tập" : "Configure study roadmap"}
                </button>
              ) : (
                <div className="space-y-3 pt-2 border-t border-slate-800 animate-in fade-in duration-200 text-left">
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        {language === "vi" ? "Chức danh hiện tại" : "Current Title"}
                      </label>
                      <input
                        type="text"
                        value={currentRole}
                        onChange={(e) => setCurrentRole(e.target.value)}
                        placeholder="e.g. Junior Developer"
                        className="w-full rounded-md bg-slate-900 border border-slate-850 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        {language === "vi" ? "Vị trí mong muốn" : "Target Title"}
                      </label>
                      <input
                        type="text"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g. Senior Backend Engineer"
                        className="w-full rounded-md bg-slate-900 border border-slate-850 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRoadmapForm(false)}
                      className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs font-bold text-slate-300 border-none transition-all"
                    >
                      {language === "vi" ? "Hủy" : "Cancel"}
                    </button>
                    <button
                      onClick={handleCreateRoadmap}
                      disabled={isCreatingRoadmap}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-bold text-white border-none transition-all disabled:opacity-50"
                    >
                      {isCreatingRoadmap ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          {language === "vi" ? "Đang tạo..." : "Creating..."}
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm">construction</span>
                          {language === "vi" ? "Bắt đầu tạo" : "Generate Now"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
