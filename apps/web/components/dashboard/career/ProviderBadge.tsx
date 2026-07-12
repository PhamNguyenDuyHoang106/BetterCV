import React from "react";

type Props = {
  provider: string;
  providerLabel?: string | null;
};

const PROVIDER_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  OFFICIAL_DOCS:    { label: "Official Docs",    color: "bg-blue-50 text-blue-700 border-blue-200",        icon: "description" },
  YOUTUBE:          { label: "YouTube",          color: "bg-red-50 text-red-600 border-red-200",           icon: "play_circle" },
  FREECODECAMP:     { label: "freeCodeCamp",     color: "bg-purple-50 text-purple-700 border-purple-200",  icon: "code" },
  ROADMAP_SH:       { label: "Roadmap.sh",       color: "bg-teal-50 text-teal-700 border-teal-200",        icon: "map" },
  MICROSOFT_LEARN:  { label: "Microsoft Learn",  color: "bg-sky-50 text-sky-700 border-sky-200",           icon: "school" },
  AWS_SKILL_BUILDER:{ label: "AWS",              color: "bg-orange-50 text-orange-700 border-orange-200",  icon: "cloud" },
  GOOGLE_CLOUD:     { label: "Google Cloud",     color: "bg-yellow-50 text-yellow-700 border-yellow-200",  icon: "cloud_queue" },
  COURSERA:         { label: "Coursera",         color: "bg-indigo-50 text-indigo-700 border-indigo-200",  icon: "school" },
  UDEMY:            { label: "Udemy",            color: "bg-violet-50 text-violet-700 border-violet-200",  icon: "play_lesson" },
  GITHUB:           { label: "GitHub",           color: "bg-slate-100 text-slate-700 border-slate-300",    icon: "code_blocks" },
  LEETCODE:         { label: "LeetCode",         color: "bg-amber-50 text-amber-700 border-amber-200",     icon: "psychology" },
  EXERCISM:         { label: "Exercism",         color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "fitness_center" },
  INTERACTIVE:      { label: "Interactive Lab",  color: "bg-green-50 text-green-700 border-green-200",     icon: "terminal" },
  FRONTEND_MASTERS: { label: "Frontend Masters", color: "bg-pink-50 text-pink-700 border-pink-200",       icon: "web" },
  OTHER:            { label: "Resource",         color: "bg-slate-50 text-slate-600 border-slate-200",     icon: "link" },
};

export function ProviderBadge({ provider, providerLabel }: Props) {
  const config = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.OTHER;
  const label = providerLabel || config.label;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold ${config.color}`}>
      <span className="material-symbols-outlined text-[12px] leading-none shrink-0">{config.icon}</span>
      <span className="truncate max-w-[120px]">{label}</span>
    </span>
  );
}
