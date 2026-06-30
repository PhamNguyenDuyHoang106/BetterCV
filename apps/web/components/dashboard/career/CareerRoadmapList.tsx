import React from "react";

type RoadmapItem = {
  id: string;
  currentRole: string;
  targetRole: string;
  status: "GENERATING" | "READY" | "FAILED" | "CANCELLED";
  progress: number;
  createdAt: string;
};

type Props = {
  roadmaps: RoadmapItem[];
  t: {
    tabTitle: string;
    tabSubtitle: string;
  };
  onSelect: (roadmapId: string) => void;
  formatDate: (dateStr: string) => string;
};

export function CareerRoadmapList({ roadmaps, t, onSelect, formatDate }: Props) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title block */}
      <div className="space-y-1">
        <h2 className="text-lg font-black text-slate-800 leading-tight">
          {t.tabTitle}
        </h2>
        <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
          {t.tabSubtitle}
        </p>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roadmaps.map((roadmap) => {
          const isGenerating = roadmap.status === "GENERATING";
          const isFailed = roadmap.status === "FAILED";
          
          return (
            <div
              key={roadmap.id}
              onClick={() => onSelect(roadmap.id)}
              className="group cursor-pointer rounded-3xl border border-slate-100 bg-white p-5 hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all duration-300 flex flex-col justify-between h-[180px] relative overflow-hidden"
            >
              {/* Decorative top gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold text-slate-400">
                    {formatDate(roadmap.createdAt)}
                  </span>
                  
                  {/* Status Badge */}
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded leading-none ${
                    roadmap.status === "READY"
                      ? "bg-emerald-50 text-emerald-600"
                      : isGenerating
                      ? "bg-indigo-50 text-indigo-600 animate-pulse"
                      : "bg-rose-50 text-rose-600"
                  }`}>
                    {roadmap.status}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Target Role Path
                  </p>
                  <h3 className="font-black text-sm text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {roadmap.targetRole}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    From {roadmap.currentRole}
                  </p>
                </div>
              </div>

              {/* Progress or Actions footer */}
              <div className="pt-4 border-t border-slate-50">
                {isGenerating ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span>Building Roadmap...</span>
                      <span>{roadmap.progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${roadmap.progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                    <span>{isFailed ? "View Error Details" : "View Learning Path"}</span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
