import React, { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../../../lib/api";
import { useSearchParams } from "next/navigation";
import { CareerRoadmapList } from "./CareerRoadmapList";
import { CareerRoadmapDetail } from "./CareerRoadmapDetail";
import { CareerGeneratingState } from "./CareerGeneratingState";

type RoadmapItem = {
  id: string;
  currentRole: string;
  targetRole: string;
  status: "GENERATING" | "READY" | "FAILED" | "CANCELLED";
  progress: number;
  createdAt: string;
};

type Props = {
  t: {
    tabTitle: string;
    tabSubtitle: string;
    generatingTitle: string;
    generatingMsg: string;
    readyTitle: string;
    failedTitle: string;
    retryBtn: string;
    viewCourses: string;
    phaseLabel: string;
    estimatedTime: string;
    atsGain: string;
    emptyState: string;
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
  formatDate: (dateStr: string) => string;
};

export function DashboardCareerTab({ t, formatDate }: Props) {
  const searchParams = useSearchParams();
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);
  const [selectedRoadmapDetails, setSelectedRoadmapDetails] = useState<any | null>(null);
  const [viewState, setViewState] = useState<"LIST" | "GENERATING" | "DETAIL">("LIST");

  // Fetch list of roadmaps
  const fetchRoadmaps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<RoadmapItem[]>("/career/roadmaps");
      const list = Array.isArray(res) ? res : (res as any)?.data || [];
      setRoadmaps(list);
      return list;
    } catch (err) {
      console.error("Failed to fetch career roadmaps:", err);
      setRoadmaps([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch detailed roadmap
  const fetchRoadmapDetails = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await apiFetch<any>(`/career/roadmap/${id}`);
      const data = res?.data || res;
      setSelectedRoadmapDetails(data);
      
      if (data.status === "GENERATING") {
        setViewState("GENERATING");
      } else {
        setViewState("DETAIL");
      }
    } catch (err) {
      console.error("Failed to fetch roadmap details:", err);
      alert("Failed to load career roadmap details.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectRoadmap = useCallback((id: string) => {
    setSelectedRoadmapId(id);
    fetchRoadmapDetails(id);
  }, [fetchRoadmapDetails]);

  useEffect(() => {
    fetchRoadmaps().then((list) => {
      const roadmapId = searchParams?.get("roadmapId");
      if (roadmapId && list.some((r: any) => r.id === roadmapId)) {
        handleSelectRoadmap(roadmapId);
      }
    });
  }, [fetchRoadmaps, searchParams, handleSelectRoadmap]);

  const handleBackToList = () => {
    setSelectedRoadmapId(null);
    setSelectedRoadmapDetails(null);
    setViewState("LIST");
    fetchRoadmaps();
  };

  const handleGenerationComplete = (status: "READY" | "FAILED" | "CANCELLED") => {
    if (status === "READY" && selectedRoadmapId) {
      fetchRoadmapDetails(selectedRoadmapId);
    } else {
      // Reload list if failed or cancelled
      handleBackToList();
    }
  };

  if (loading && viewState === "LIST") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // ─── VIEW 1: GENERATING POLLING VIEW ───
  if (viewState === "GENERATING" && selectedRoadmapId) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-6 md:p-8 shadow-sm">
        <CareerGeneratingState
          roadmapId={selectedRoadmapId}
          generatingTitle={t.generatingTitle}
          generatingMsg={t.generatingMsg}
          failedTitle={t.failedTitle}
          retryBtn={t.retryBtn}
          onComplete={handleGenerationComplete}
        />
      </div>
    );
  }

  // ─── VIEW 2: DETAILED TIMELINE VIEW ───
  if (viewState === "DETAIL" && selectedRoadmapDetails) {
    return (
      <CareerRoadmapDetail
        roadmap={selectedRoadmapDetails}
        t={{
          readyTitle: t.readyTitle,
          estimatedTime: t.estimatedTime,
          atsGain: t.atsGain,
          phaseLabel: t.phaseLabel,
          viewCourses: t.viewCourses,
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
          rerunAts: t.rerunAts,
          rescoring: t.rescoring,
          atsScoreUpdated: t.atsScoreUpdated,
          atsDelta: t.atsDelta,
          coachChatBtn: t.coachChatBtn,
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
        }}
        onBack={handleBackToList}
      />
    );
  }

  // ─── VIEW 3: EMPTY STATE VIEW ───
  if (roadmaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50/20 p-8 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
          <span className="material-symbols-outlined text-[32px]">explore</span>
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="font-bold text-slate-800 text-base">{t.tabTitle}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{t.emptyState}</p>
        </div>
      </div>
    );
  }

  // ─── VIEW 4: ROADMAPS HISTORY LIST VIEW ───
  return (
    <CareerRoadmapList
      roadmaps={roadmaps}
      t={{
        tabTitle: t.tabTitle,
        tabSubtitle: t.tabSubtitle,
      }}
      onSelect={handleSelectRoadmap}
      formatDate={formatDate}
    />
  );
}
