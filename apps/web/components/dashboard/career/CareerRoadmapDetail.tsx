import React, { useState } from "react";
import { CareerTimeline } from "./CareerTimeline";
import { RerunAtsButton } from "./RerunAtsButton";
import { CareerCoachPanel } from "./CareerCoachPanel";

type Course = {
  id: string;
  title: string;
  url: string;
  provider: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  durationWeeks: number;
};

type Skill = {
  id: string;
  name: string;
  category: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedWeeks: number;
  courses: Course[];
};

type Phase = {
  id: string;
  phaseIndex: number;
  phaseName: string;
  skills: Skill[];
};

type SkillGap = {
  id: string;
  name: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  estimatedImpact: number;
};

type RoadmapDetail = {
  id: string;
  currentRole: string;
  targetRole: string;
  estimatedMonths: number;
  explanation: string;
  atsImprovementRange: {
    min: number;
    max: number;
  };
  phases: Phase[];
  skillGaps: SkillGap[];
};

type Props = {
  roadmap: RoadmapDetail;
  t: {
    readyTitle: string;
    estimatedTime: string;
    atsGain: string;
    phaseLabel: string;
    viewCourses: string;
    addToCv: string;
    addedToCv: string;
    addingToCv: string;
    alreadyAdded: string;
    generateBullet: string;
    generatingBullet: string;
    bulletTitle: string;
    bulletCopy: string;
    bulletCopied: string;
    bulletClose: string;
    rerunAts: string;
    rescoring: string;
    atsScoreUpdated: string;
    atsDelta: string;
    coachChatBtn: string;
    coachTitle: string;
    coachSubtitle: string;
    coachPlaceholder: string;
    coachSend: string;
    coachDefaultGreeting: string;
    coachChipStart: string;
    coachChipResources: string;
    coachChipInterview: string;
    coachLoadingHistory: string;
    coachEmptySession: string;
    coachTabChat: string;
    coachTabInsights: string;
    coachAnalyticsTotalSessions: string;
    coachAnalyticsTotalMessages: string;
    coachAnalyticsLastActive: string;
    coachAnalyticsMostDiscussed: string;
    coachAnalyticsFocusSuggestion: string;
    coachAnalyticsTimeline: string;
    coachAnalyticsAvgMessages: string;
    coachAnalyticsNever: string;
  };
  onBack: () => void;
};

export function CareerRoadmapDetail({ roadmap, t, onBack }: Props) {
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  const skillCardT = {
    addToCv: t.addToCv,
    addedToCv: t.addedToCv,
    addingToCv: t.addingToCv,
    alreadyAdded: t.alreadyAdded,
    generateBullet: t.generateBullet,
    generatingBullet: t.generatingBullet,
    bulletTitle: t.bulletTitle,
    bulletCopy: t.bulletCopy,
    bulletCopied: t.bulletCopied,
    bulletClose: t.bulletClose,
  };

  const rerunT = {
    rerunAts: t.rerunAts,
    rescoring: t.rescoring,
    atsScoreUpdated: t.atsScoreUpdated,
    atsDelta: t.atsDelta,
  };

  const coachT = {
    coachTitle: t.coachTitle,
    coachSubtitle: t.coachSubtitle,
    coachPlaceholder: t.coachPlaceholder,
    coachSend: t.coachSend,
    coachDefaultGreeting: t.coachDefaultGreeting,
    coachChipStart: t.coachChipStart,
    coachChipResources: t.coachChipResources,
    coachChipInterview: t.coachChipInterview,
    coachLoadingHistory: t.coachLoadingHistory,
    coachEmptySession: t.coachEmptySession,
    coachTabChat: t.coachTabChat,
    coachTabInsights: t.coachTabInsights,
    coachAnalyticsTotalSessions: t.coachAnalyticsTotalSessions,
    coachAnalyticsTotalMessages: t.coachAnalyticsTotalMessages,
    coachAnalyticsLastActive: t.coachAnalyticsLastActive,
    coachAnalyticsMostDiscussed: t.coachAnalyticsMostDiscussed,
    coachAnalyticsFocusSuggestion: t.coachAnalyticsFocusSuggestion,
    coachAnalyticsTimeline: t.coachAnalyticsTimeline,
    coachAnalyticsAvgMessages: t.coachAnalyticsAvgMessages,
    coachAnalyticsNever: t.coachAnalyticsNever,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Back Button & Coach Button */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors border-none bg-transparent p-0"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to list
        </button>

        <button
          onClick={() => setIsCoachOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 text-xs font-black transition-all border-none shadow-sm shadow-indigo-100"
        >
          <span className="material-symbols-outlined text-base">chat</span>
          {t.coachChatBtn}
        </button>
      </div>

      {/* Summary Banner */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-[-5%] top-[-20%] w-[40%] h-[150%] bg-indigo-50/20 blur-[60px] pointer-events-none rounded-full" />
        
        <div className="space-y-4 max-w-xl relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {roadmap.currentRole}
            </span>
            <span className="material-symbols-outlined text-slate-400 text-sm">double_arrow</span>
            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {roadmap.targetRole}
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">
            {t.readyTitle}
          </h2>

          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            {roadmap.explanation}
          </p>

          {/* Re-run ATS Button */}
          <RerunAtsButton
            roadmapId={roadmap.id}
            initialScore={0}
            t={rerunT}
          />
        </div>

        {/* Quick Metrics */}
        <div className="flex flex-col sm:flex-row gap-4 shrink-0 relative z-10">
          {/* Estimated Study Time */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-center min-w-[150px]">
            <span className="material-symbols-outlined text-indigo-600 text-[24px] mb-2">schedule</span>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Study Duration
            </span>
            <span className="text-base font-black text-slate-800 mt-0.5">
              {roadmap.estimatedMonths} {roadmap.estimatedMonths === 1 ? "month" : "months"}
            </span>
          </div>

          {/* Potential ATS Gain */}
          <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 flex flex-col justify-center min-w-[150px]">
            <span className="material-symbols-outlined text-emerald-500 text-[24px] mb-2">trending_up</span>
            <span className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider">
              Potential ATS Improvement
            </span>
            <span className="text-base font-black text-emerald-600 mt-0.5">
              +{roadmap.atsImprovementRange.min} ~ +{roadmap.atsImprovementRange.max} points
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Timeline (2/3 width) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600">route</span>
            Learning Progress Path
          </h3>
          <CareerTimeline
            phases={roadmap.phases}
            roadmapId={roadmap.id}
            phaseLabel={t.phaseLabel}
            viewCoursesLabel={t.viewCourses}
            t={skillCardT}
          />
        </div>

        {/* Right Gap Analysis Panel (1/3 width) */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500">dangerous</span>
            Identified Skill Gaps
          </h3>
          
          <div className="space-y-3">
            {roadmap.skillGaps.map((gap) => (
              <div
                key={gap.id}
                className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/30 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-slate-800 truncate">{gap.name}</h4>
                  <span className={`inline-block text-[8px] font-black uppercase px-1.5 py-0.5 rounded leading-none mt-1 ${
                    gap.priority === "HIGH"
                      ? "bg-rose-50 text-rose-600"
                      : gap.priority === "MEDIUM"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-blue-50 text-blue-600"
                  }`}>
                    {gap.priority} Priority
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block font-medium">ATS Impact</span>
                  <span className="text-xs font-black text-slate-700">+{gap.estimatedImpact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Coach Panel */}
      <CareerCoachPanel
        open={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        roadmapId={roadmap.id}
        roadmap={roadmap}
        t={coachT}
      />
    </div>
  );
}
