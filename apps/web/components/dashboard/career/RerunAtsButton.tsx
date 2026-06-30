import React, { useState } from "react";
import { apiFetch } from "../../../lib/api";

type Props = {
  roadmapId: string;
  initialScore: number;
  t: {
    rerunAts: string;
    rescoring: string;
    atsScoreUpdated: string;
    atsDelta: string;
  };
};

type RescoreState = "idle" | "rescoring" | "done" | "error";

export function RerunAtsButton({ roadmapId, initialScore, t }: Props) {
  const [state, setState] = useState<RescoreState>("idle");
  const [result, setResult] = useState<{
    previousScore: number;
    newScore: number;
    delta: number;
  } | null>(null);

  const handleRescore = async () => {
    if (state === "rescoring") return;
    setState("rescoring");
    try {
      const res = await apiFetch<any>("/career/rescore-ats", {
        method: "POST",
        body: JSON.stringify({ roadmapId }),
      });
      const data = res?.data || res;
      setResult({
        previousScore: data.previousScore ?? initialScore,
        newScore: data.newScore ?? initialScore,
        delta: data.delta ?? 0,
      });
      setState("done");
    } catch (err) {
      console.error("Rescore ATS failed:", err);
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  if (state === "done" && result) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 animate-in fade-in duration-300">
        <span className="material-symbols-outlined text-emerald-500 text-[18px]">trending_up</span>
        <div>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
            {t.atsScoreUpdated}
          </p>
          <p className="text-sm font-black text-slate-800">
            <span className="text-slate-500">{result.previousScore}</span>
            {" → "}
            <span className="text-emerald-600">{result.newScore}</span>
            {result.delta > 0 && (
              <span className="text-emerald-500 text-xs font-bold ml-1">
                ({t.atsDelta.replace("{delta}", String(result.delta))})
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setState("idle"); setResult(null); }}
          className="ml-auto text-slate-400 hover:text-slate-600 border-none bg-transparent"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleRescore}
      disabled={state === "rescoring"}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-none shadow-sm ${
        state === "rescoring"
          ? "bg-slate-100 text-slate-500 cursor-wait"
          : state === "error"
          ? "bg-rose-100 text-rose-600"
          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-200"
      }`}
    >
      {state === "rescoring" ? (
        <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <span className="material-symbols-outlined text-base">refresh</span>
      )}
      {state === "rescoring" ? t.rescoring : t.rerunAts}
    </button>
  );
}
