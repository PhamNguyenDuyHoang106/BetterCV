import React, { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { CareerFailedState } from "./CareerFailedState";

type Props = {
  roadmapId: string;
  generatingTitle: string;
  generatingMsg: string;
  failedTitle: string;
  retryBtn: string;
  onComplete: (status: "READY" | "FAILED" | "CANCELLED") => void;
};

export function CareerGeneratingState({
  roadmapId,
  generatingTitle,
  generatingMsg,
  failedTitle,
  retryBtn,
  onComplete,
}: Props) {
  const [progress, setProgress] = useState(0);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [failedAt, setFailedAt] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const res = await apiFetch<any>(`/career/roadmap/${roadmapId}`);
        const data = res?.data || res;
        
        if (data.status === "READY") {
          setProgress(100);
          clearInterval(intervalId);
          setTimeout(() => onComplete("READY"), 500);
        } else if (data.status === "FAILED") {
          setFailureReason(data.failureReason || null);
          setFailedAt(data.failedAt || null);
          clearInterval(intervalId);
          onComplete("FAILED");
        } else if (data.status === "CANCELLED") {
          clearInterval(intervalId);
          onComplete("CANCELLED");
        } else {
          // Status is GENERATING, update progress
          setProgress(data.progress || 10);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    // Run immediately then poll every 2s
    pollStatus();
    intervalId = setInterval(pollStatus, 2000);

    return () => clearInterval(intervalId);
  }, [roadmapId, onComplete]);

  if (failureReason !== null || failedAt !== null) {
    return (
      <CareerFailedState
        failedTitle={failedTitle}
        failureReason={failureReason}
        failedAt={failedAt}
        retryBtn={retryBtn}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        {/* Spinner ring */}
        <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
        <span className="absolute font-black text-sm text-indigo-600">{progress}%</span>
      </div>

      <div className="space-y-1.5">
        <h3 className="font-bold text-slate-800 text-base">{generatingTitle}</h3>
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{generatingMsg}</p>
      </div>

      {/* Modern horizontal progress bar */}
      <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

