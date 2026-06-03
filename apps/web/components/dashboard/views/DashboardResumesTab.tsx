"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { DashEmptyState } from "../dashboard-ui";
import { renderHtml } from "@acv/template-engine";
import { apiFetch } from "../../../lib/api";
import {
  getCvHealth,
  getCvHealthDetails,
  assembleResumeDataFromSections,
} from "../../../lib/cv-health";

type Recommendation = {
  id: string;
  category: 'ATS' | 'CONTENT' | 'FORMAT' | 'KEYWORD';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  title: string;
  description: string;
  actionable: boolean;
};

type AtsScan = {
  id?: string;
  overallScore: number;
  keywordScore?: number | null;
  formatScore?: number | null;
  completenessScore?: number | null;
  missingKeywords?: string[];
  recommendations?: Recommendation[];
  createdAt?: string;
};

type Cv = {
  id: string;
  title: string;
  templateId?: string;
  atsScore?: number | null;
  atsScannedAt?: string | null;
  atsVersion?: string | null;
  completenessScore?: number | null;
  thumbnailUrl?: string | null;
  thumbnailGeneratedAt?: string | null;
  thumbnailStatus?: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  atsScans?: AtsScan[];
  updatedAt?: string;
  createdAt?: string;
  sections?: any[];
};

type Props = {
  filteredCvs: Cv[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onGoTemplates: () => void;
  formatDate: (d?: string) => string;
  onDuplicate: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  templates: any[];
};

function scoreBadgeClass(score: number) {
  if (score >= 85) return "dash-score-high";
  if (score >= 60) return "dash-score-mid";
  return "dash-score-low";
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length === 0) {
    return <div className="text-slate-400 italic text-xs text-center">Chưa có dữ liệu xu hướng</div>;
  }
  const width = 240;
  const height = 50;
  const max = 100;
  const min = 0;
  const points = data
    .map((val, idx) => {
      const x = (idx / Math.max(1, data.length - 1)) * width;
      const y = height - ((val - min) / (max - min)) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold mb-1">
        <span>LỊCH SỬ ATS SCORE (XU HƯỚNG)</span>
        <span className="text-violet-600 font-bold">{data[data.length - 1]}% (Mới nhất)</span>
      </div>
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/60 flex items-center justify-center w-full">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <polyline
            fill="none"
            stroke="url(#sparkline-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          <defs>
            <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          {data.map((val, idx) => {
            const x = (idx / Math.max(1, data.length - 1)) * width;
            const y = height - ((val - min) / (max - min)) * height;
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="3.5"
                className="fill-white stroke-indigo-600 stroke-[2] cursor-pointer"
              >
                <title>{`Lần ${idx + 1}: ${val}%`}</title>
              </circle>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function QuickHtmlPreview({ cv, templates }: { cv: Cv; templates: any[] }) {
  if (cv.thumbnailStatus === "READY" && cv.thumbnailUrl) {
    return (
      <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4 bg-slate-50">
        <img
          src={cv.thumbnailUrl}
          alt={cv.title}
          className="max-w-full max-h-full object-contain rounded shadow-lg border border-slate-200"
        />
      </div>
    );
  }

  const template = templates.find((t) => t.id === (cv.templateId || "standard-ats"));
  const schema = template?.schema;

  const html = useMemo(() => {
    if (!schema) return null;
    try {
      const cvData = assembleResumeDataFromSections(cv.sections || []);
      return renderHtml({ template: schema, data: cvData });
    } catch (err) {
      console.error("Failed to render quick preview:", err);
      return null;
    }
  }, [schema, cv.sections]);

  if (!html) {
    return (
      <picture className="absolute inset-0 w-full h-full block">
        <source
          srcSet={`/thumbnails/${cv.templateId || "standard-ats"}@2x.webp 2x, /thumbnails/${cv.templateId || "standard-ats"}.webp 1x`}
          type="image/webp"
        />
        <img
          src={`/thumbnails/${cv.templateId || "standard-ats"}.webp`}
          alt={cv.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/thumbnails/standard-ats.webp";
          }}
        />
      </picture>
    );
  }

  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            margin: 0;
            padding: 0;
            background: white;
            font-family: system-ui, sans-serif;
            overflow-x: hidden;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;

  return (
    <iframe
      srcDoc={srcDoc}
      title="CV Quick Preview"
      className="w-full h-full border-0 absolute inset-0 bg-white"
      sandbox="allow-same-origin allow-scripts"
    />
  );
}

export function DashboardResumesTab({
  filteredCvs,
  searchQuery,
  onSearchChange,
  onGoTemplates,
  formatDate,
  onDuplicate,
  onDelete,
  templates,
}: Props) {
  const [previewCv, setPreviewCv] = useState<Cv | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "analytics">("preview");
  const [historyScans, setHistoryScans] = useState<AtsScan[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    if (!previewCv || activeTab !== "analytics") {
      setHistoryScans([]);
      return;
    }

    setLoadingHistory(true);
    apiFetch<AtsScan[]>(`/cvs/${previewCv.id}/ats-history`)
      .then((data) => {
        setHistoryScans(data);
      })
      .catch((err) => {
        console.error("Failed to load ATS history:", err);
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, [previewCv, activeTab]);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <span className="material-symbols-outlined">folder_open</span>
          </span>
          <h2 className="text-xl font-bold text-slate-900">Danh sách CV</h2>
        </div>
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="dash-search-input"
            placeholder="Search resumes..."
            type="text"
          />
        </div>
      </div>

      {filteredCvs.length === 0 ? (
        <DashEmptyState
          icon="description"
          title="Chưa có CV nào"
          description={
            <>
              Tạo CV đầu tiên hoặc chọn mẫu có sẵn tại tab <strong>Mẫu CV</strong>.
            </>
          }
          action={
            <button type="button" onClick={onGoTemplates} className="dash-btn-primary">
              Chọn mẫu CV
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-2">
          {filteredCvs.map((cv) => {
            const score = cv.completenessScore ?? cv.atsScore ?? 0;
            const health = getCvHealth(cv);
            const details = getCvHealthDetails(health);
            const isStale = cv.updatedAt && cv.thumbnailGeneratedAt
              ? new Date(cv.updatedAt) > new Date(cv.thumbnailGeneratedAt)
              : !cv.thumbnailUrl;

            return (
              <article key={cv.id} className="dash-resume-card group flex flex-col justify-between">
                <div>
                  <Link
                    href={`/cv/${cv.id}`}
                    className="block h-48 rounded-xl mb-4 relative overflow-hidden border border-slate-100 bg-slate-50 shadow-inner"
                  >
                    {/* Render Real High-Res Thumbnail with fallback */}
                    <div className="absolute inset-0 p-2 flex items-center justify-center">
                      {cv.thumbnailStatus === "PROCESSING" || cv.thumbnailStatus === "PENDING" ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-[2px] z-10 p-4 text-center">
                          <span className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mb-2" />
                          <span className="text-xs font-semibold text-indigo-700">Generating Preview</span>
                          <p className="text-[10px] text-slate-500 mt-1">Vui lòng đợi trong giây lát...</p>
                        </div>
                      ) : cv.thumbnailStatus === "FAILED" ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-50/60 z-10 p-4 text-center">
                          <span className="material-symbols-outlined text-rose-500 text-3xl mb-1">broken_image</span>
                          <span className="text-xs font-bold text-rose-700">Preview Failed</span>
                          <p className="text-[9px] text-rose-500 mt-0.5">Không thể tự động chụp màn hình CV này.</p>
                        </div>
                      ) : null}
                      <picture className="w-[85%] h-[90%] block relative rounded shadow-lg border border-slate-200/40 overflow-hidden bg-white">
                        {cv.thumbnailUrl && cv.thumbnailStatus === "READY" ? (
                          <img
                            src={cv.thumbnailUrl}
                            alt={cv.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src === cv.thumbnailUrl) {
                                target.src = `/thumbnails/${cv.templateId || "standard-ats"}.webp`;
                              } else if (target.src.includes(`/thumbnails/${cv.templateId || "standard-ats"}.webp`)) {
                                target.src = "/thumbnails/standard-ats.webp";
                              }
                            }}
                          />
                        ) : (
                          <>
                            <source
                              srcSet={`/thumbnails/${cv.templateId || "standard-ats"}@2x.webp 2x, /thumbnails/${cv.templateId || "standard-ats"}.webp 1x`}
                              type="image/webp"
                            />
                            <img
                              src={`/thumbnails/${cv.templateId || "standard-ats"}.webp`}
                              alt={cv.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/thumbnails/standard-ats.webp";
                              }}
                            />
                          </>
                        )}
                      </picture>
                    </div>

                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center gap-3 pb-4 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPreviewCv(cv);
                        }}
                        className="dash-btn-primary !bg-white hover:!bg-slate-100 !text-slate-900 !py-2 !px-4 !text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-base">visibility</span>
                        Xem nhanh
                      </button>
                      <span className="dash-btn-primary !py-2 !px-4 !text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-base">edit</span>
                        Sửa CV
                      </span>
                    </div>
                  </Link>

                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 truncate text-base" title={cv.title}>
                        {cv.title}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        Updated: {formatDate(cv.updatedAt || cv.createdAt)}
                      </p>
                    </div>
                    <span className={`dash-ats-pill shrink-0 ${scoreBadgeClass(cv.completenessScore ?? 0)}`}>
                      Cpl: {cv.completenessScore ?? 0}%
                    </span>
                  </div>

                  {/* ATS scan history display */}
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[11px]">
                    <span className="text-slate-500 font-medium">ATS Match:</span>
                    {cv.atsScore !== null && cv.atsScore !== undefined && cv.atsScannedAt ? (
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold px-2 py-0.5 rounded ${scoreBadgeClass(cv.atsScore)}`}>
                          {cv.atsScore}%
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">v{cv.atsVersion || "1.0"}</span>
                      </div>
                    ) : cv.atsScore !== null && cv.atsScore !== undefined && !cv.atsScannedAt ? (
                      <div className="flex items-center gap-1.5" title="CV đã được cập nhật sau lần quét cuối">
                        <span className={`font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500`}>
                          {cv.atsScore}%
                        </span>
                        <span className="text-[8px] px-1 py-0.2 rounded bg-amber-100 text-amber-700 font-medium scale-95">Stale</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">N/A</span>
                    )}
                  </div>

                  {/* dynamic CV Health Badge */}
                  <div className="mt-3 flex flex-col gap-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border self-start flex items-center gap-1 shadow-sm ${details.colorClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${details.dotClass}`} />
                      {details.label}
                    </span>
                    <p className="text-[10px] text-slate-400 italic mt-0.5 truncate" title={details.description}>
                      {details.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-around">
                  <Link href={`/cv/${cv.id}`} className="dash-icon-action" title="Edit CV">
                    <span className="material-symbols-outlined">edit</span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPreviewCv(cv);
                    }}
                    className="dash-icon-action"
                    title="Quick Preview"
                  >
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                  <button type="button" onClick={(e) => onDuplicate(cv.id, e)} className="dash-icon-action" title="Duplicate">
                    <span className="material-symbols-outlined">content_copy</span>
                  </button>
                  <button type="button" onClick={(e) => onDelete(cv.id, e)} className="dash-icon-action dash-icon-action-danger" title="Delete">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Quick Preview Modal utilizing real @acv/template-engine compiled HTML */}
      {previewCv && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{previewCv.title}</h3>
                <p className="text-xs text-slate-500">Xem trước bản thiết kế thực tế & phân tích chuyên sâu</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewCv(null);
                  setActiveTab("preview");
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden p-6 bg-slate-50/50 flex flex-col md:flex-row gap-6">
              {/* Left Column: encapsulated CV iframe or Analytics tab */}
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden relative min-h-[300px] flex flex-col">
                {/* Tab Headers */}
                <div className="flex border-b border-slate-100 bg-slate-50/50 px-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                      activeTab === "preview"
                        ? "border-violet-600 text-violet-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">pageview</span>
                    Bản CV thiết kế
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("analytics")}
                    className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                      activeTab === "analytics"
                        ? "border-violet-600 text-violet-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">insights</span>
                    Phân tích ATS & AI gợi ý
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 overflow-y-auto relative p-6">
                  {activeTab === "preview" ? (
                    <QuickHtmlPreview cv={previewCv} templates={templates} />
                  ) : (
                    <div className="space-y-6">
                      {/* ATS Score Overview & Sparkline */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* Sparkline chart */}
                        {loadingHistory ? (
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/60 text-center text-slate-400 text-xs py-8 animate-pulse">
                            <span className="material-symbols-outlined text-3xl mb-1 block animate-spin">sync</span>
                            Đang tải lịch sử xu hướng ATS...
                          </div>
                        ) : historyScans && historyScans.length > 0 ? (
                          <Sparkline data={historyScans.map((s) => s.overallScore)} />
                        ) : (
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center text-slate-400 text-xs py-8">
                            <span className="material-symbols-outlined text-3xl mb-1 block">query_stats</span>
                            Chưa có dữ liệu xu hướng ATS. Hãy quét thử CV lần đầu!
                          </div>
                        )}

                        {/* Keyword list */}
                        <div className="flex flex-col gap-2">
                          <h5 className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Từ khóa còn thiếu (Keywords)</h5>
                          {(() => {
                            const latestScan =
                              historyScans && historyScans.length > 0
                                ? historyScans[historyScans.length - 1]
                                : (previewCv.atsScans && previewCv.atsScans[0]);
                            if (latestScan?.missingKeywords && latestScan.missingKeywords.length > 0) {
                              return (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {latestScan.missingKeywords.map((kw, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-semibold text-[10px] border border-violet-100">
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              );
                            }
                            return <p className="text-xs text-slate-400 italic">Không có từ khóa bị thiếu nào được ghi nhận.</p>;
                          })()}
                        </div>
                      </div>

                      {/* Structured recommendations list */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1">
                          <span className="material-symbols-outlined text-base text-violet-600">checklist</span>
                          Đề xuất cải thiện chi tiết từ AI
                        </h4>
                        
                        {(() => {
                          const latestScan =
                            historyScans && historyScans.length > 0
                              ? historyScans[historyScans.length - 1]
                              : (previewCv.atsScans && previewCv.atsScans[0]);
                          if (latestScan?.recommendations && latestScan.recommendations.length > 0) {
                            return (
                              <div className="grid grid-cols-1 gap-3">
                                {latestScan.recommendations.map((rec) => {
                                  let sevColor = "bg-emerald-50 border-emerald-100 text-emerald-800";
                                  let icon = "info";

                                  if (rec.severity === "HIGH") {
                                    sevColor = "bg-rose-50 border-rose-100 text-rose-800";
                                  } else if (rec.severity === "MEDIUM") {
                                    sevColor = "bg-amber-50 border-amber-100 text-amber-800";
                                  }

                                  if (rec.category === "KEYWORD") icon = "key";
                                  else if (rec.category === "CONTENT") icon = "edit_note";
                                  else if (rec.category === "FORMAT") icon = "format_paint";
                                  else if (rec.category === "ATS") icon = "smart_toy";

                                  return (
                                    <div key={rec.id} className={`p-3.5 rounded-xl border flex gap-3 ${sevColor}`}>
                                      <span className="material-symbols-outlined shrink-0 text-xl mt-0.5">{icon}</span>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-bold text-xs truncate max-w-xs">{rec.title}</span>
                                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-black/5 text-black/50 shrink-0">
                                            {rec.category}
                                          </span>
                                          {rec.actionable && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-violet-600 text-white shrink-0">
                                              Có thể sửa ngay
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[11px] mt-1 leading-relaxed text-slate-600 font-medium">
                                          {rec.description}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }
                          return (
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center text-slate-400 text-xs py-8">
                              <span className="material-symbols-outlined text-3xl mb-1 block">checklist</span>
                              Chưa có đề xuất nào được phân tích. Vui lòng chạy tính năng đánh giá ATS trong Editor để nhận chỉ dẫn AI.
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: CV health statistics & quick Actions */}
              <div className="w-full md:w-72 shrink-0 flex flex-col justify-between h-full">
                <div className="flex flex-col gap-4">
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2">Độ hoàn thiện CV</h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">
                        {previewCv.completenessScore ?? previewCv.atsScore ?? 0}
                      </span>
                      <span className="text-slate-400 text-sm">/ 100</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-violet-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${previewCv.completenessScore ?? previewCv.atsScore ?? 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-1">Đánh giá sức khỏe CV</h4>
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm mt-1.5">
                      <span className={`w-2 h-2 rounded-full ${getCvHealthDetails(getCvHealth(previewCv)).dotClass}`} />
                      {getCvHealthDetails(getCvHealth(previewCv)).label}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {getCvHealthDetails(getCvHealth(previewCv)).description}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2">Mẫu đang chọn</h4>
                    <p className="font-bold text-slate-800 text-sm">
                      {templates.find((t) => t.id === previewCv.templateId)?.name || "Standard ATS"}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">ID: {previewCv.templateId || "standard-ats"}</p>
                  </div>
                </div>

                <div className="pb-4">
                  <Link
                    href={`/cv/${previewCv.id}`}
                    className="dash-btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                    Mở Trình Biên Soạn
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
