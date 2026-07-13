import React from "react";
import { ProviderBadge } from "./ProviderBadge";

export type LearningResource = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  url: string;
  provider: string;
  providerLabel?: string | null;
  resourceType: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  durationMin?: number | null;
  isPaid: boolean;
  qualityScore: number;
  status: string;
};

type Props = {
  resource: LearningResource;
  stepNumber: number;
};

const RESOURCE_TYPE_ICON: Record<string, string> = {
  DOCS: "description",
  INTERACTIVE: "terminal",
  VIDEO: "play_circle",
  PRACTICE: "fitness_center",
  COURSE: "school",
  BOOK: "menu_book",
  ARTICLE: "article",
};

export function LearningResourceCard({ resource, stepNumber }: Props) {
  if (resource.status === "BROKEN") return null;

  const formatDuration = (mins?: number | null) => {
    if (!mins) return null;
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const durationStr = formatDuration(resource.durationMin);
  const icon = RESOURCE_TYPE_ICON[resource.resourceType] || "link";

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-4 rounded-2xl border border-slate-100 hover:border-indigo-500 bg-white hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-300 relative overflow-hidden"
    >
      <div className="flex gap-3.5 items-start">
        {/* Step Indicator + Icon */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black leading-none">
            {stepNumber}
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
            <span className="material-symbols-outlined text-[20px]">
              {icon}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <ProviderBadge provider={resource.provider} providerLabel={resource.providerLabel} />
            
            <div className="flex items-center gap-1.5">
              {durationStr && (
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                  {durationStr}
                </span>
              )}
              {resource.qualityScore >= 95 && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase leading-none border border-amber-200">
                  <span className="material-symbols-outlined text-[10px]">grade</span>
                  Top Pick
                </span>
              )}
              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded leading-none border ${
                resource.isPaid 
                  ? "bg-slate-50 text-slate-600 border-slate-200" 
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                {resource.isPaid ? "Paid" : "Free"}
              </span>
            </div>
          </div>

          <h5 className="text-xs font-black text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
            {resource.title}
          </h5>

          {resource.description && (
            <p className="text-[10px] text-slate-500 font-medium line-clamp-1 leading-relaxed">
              {resource.description}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}
