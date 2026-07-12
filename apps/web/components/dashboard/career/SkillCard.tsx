import React, { useState } from "react";
import { LearningResourceCard, LearningResource } from "./LearningResourceCard";
import { apiFetch } from "../../../lib/api";

type SkillProject = {
  suggestion: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  hours: number;
  outcome: string;
};

type Skill = {
  id: string;
  name: string;
  category: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedWeeks: number;
  hiringDemand: "CORE" | "IMPORTANT" | "OPTIONAL";
  prerequisites: Array<{ id: string; name: string }>;
  project: SkillProject | null;
  resources: LearningResource[];
};

type Props = {
  skill: Skill;
  roadmapId: string;
  viewCoursesLabel: string;
  t: {
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
  };
};

type AddState = "idle" | "adding" | "added" | "already" | "error";
type BulletState = "hidden" | "generating" | "visible";

export function SkillCard({ skill, roadmapId, viewCoursesLabel, t }: Props) {
  const [addState, setAddState] = useState<AddState>("idle");
  const [bulletState, setBulletState] = useState<BulletState>("hidden");
  const [bulletText, setBulletText] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleAddToCv = async () => {
    if (addState !== "idle") return;
    setAddState("adding");
    try {
      const res = await apiFetch<any>("/career/add-skill-to-cv", {
        method: "POST",
        body: JSON.stringify({ roadmapId, skillId: skill.id }),
      });
      const data = res?.data || res;
      if (data?.alreadyAdded) {
        setAddState("already");
      } else {
        setAddState("added");
      }
    } catch (err: any) {
      console.error("Add to CV failed:", err);
      const { handleFeatureError } = await import("../../../lib/errors");
      if (handleFeatureError(err)) {
        setAddState("idle");
        return;
      }
      setAddState("error");
      setTimeout(() => setAddState("idle"), 3000);
    }
  };

  const handleGenerateBullet = async () => {
    if (bulletState === "generating") return;
    setBulletState("generating");
    setBulletText("");
    try {
      const res = await apiFetch<any>("/career/generate-skill-bullet", {
        method: "POST",
        body: JSON.stringify({ skillId: skill.id, roadmapId }),
      });
      const data = res?.data || res;
      setBulletText(data?.bullet || "");
      setBulletState("visible");
    } catch (err: any) {
      console.error("Generate bullet failed:", err);
      const { handleFeatureError } = await import("../../../lib/errors");
      if (handleFeatureError(err)) {
        setBulletState("hidden");
        return;
      }
      setBulletState("hidden");
    }
  };

  const handleCopy = async () => {
    if (!bulletText) return;
    try {
      await navigator.clipboard.writeText(bulletText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const addBtnLabel =
    addState === "adding"
      ? t.addingToCv
      : addState === "added"
      ? t.addedToCv
      : addState === "already"
      ? t.alreadyAdded
      : addState === "error"
      ? "Error ✕"
      : t.addToCv;

  const isAddDone = addState === "added" || addState === "already";

  const demandStyles = {
    CORE: "bg-red-50 text-red-700 border-red-200",
    IMPORTANT: "bg-amber-50 text-amber-700 border-amber-200",
    OPTIONAL: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div className="p-6 rounded-3xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-lg transition-all duration-300 space-y-5">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center text-[9px] font-black uppercase px-2 py-0.5 rounded border ${demandStyles[skill.hiringDemand] || demandStyles.IMPORTANT}`}>
              {skill.hiringDemand} DEMAND
            </span>
            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
              {skill.category.replace("_", " ")}
            </span>
          </div>

          <h4 className="font-black text-base text-slate-800 flex items-center gap-2">
            {skill.name}
          </h4>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-right">
            <span className="text-xs font-black text-slate-700 block">
              ~{skill.estimatedWeeks} {skill.estimatedWeeks === 1 ? "week" : "weeks"}
            </span>
            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mt-0.5">
              {skill.difficulty}
            </span>
          </div>

          {/* Add to CV Button */}
          <button
            type="button"
            onClick={handleAddToCv}
            disabled={addState === "adding" || isAddDone}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all border-none shadow-sm ${
              isAddDone
                ? "bg-emerald-50 text-emerald-700 cursor-default"
                : addState === "error"
                ? "bg-rose-50 text-rose-600 cursor-default"
                : addState === "adding"
                ? "bg-slate-100 text-slate-500 cursor-wait"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-200"
            }`}
          >
            {addState === "adding" ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isAddDone ? (
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
            ) : (
              <span className="material-symbols-outlined text-[14px]">add</span>
            )}
            {addBtnLabel}
          </button>
        </div>
      </div>

      {/* Prerequisites & Summary Details */}
      {skill.prerequisites && skill.prerequisites.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-medium text-slate-500 bg-slate-50/50 px-3 py-1.5 rounded-xl">
          <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider shrink-0">Prerequisites:</span>
          {skill.prerequisites.map((prereq) => (
            <span key={prereq.id} className="flex items-center gap-0.5 text-slate-700 bg-white border border-slate-100 px-1.5 py-0.5 rounded-md text-[10px]">
              <span className="material-symbols-outlined text-[10px] text-emerald-500">check</span>
              {prereq.name}
            </span>
          ))}
        </div>
      )}

      {/* Mini Project Card FIRST */}
      {skill.project && (
        <div className="p-4 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/20 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-700 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px]">build</span>
              Mini Project
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500">
                ~{skill.project.hours} hours
              </span>
              <span className="inline-block text-[9px] font-bold uppercase px-1 py-0.2 bg-indigo-50 text-indigo-600 rounded">
                {skill.project.difficulty}
              </span>
            </div>
          </div>
          <h5 className="text-xs font-black text-slate-800 leading-snug">
            {skill.project.suggestion}
          </h5>
          {skill.project.outcome && (
            <p className="text-[10px] font-medium text-indigo-600 flex items-start gap-1">
              <span className="material-symbols-outlined text-[13px] shrink-0 mt-0.5">auto_awesome</span>
              <span>Outcome: {skill.project.outcome}</span>
            </p>
          )}
        </div>
      )}

      {/* Generate Bullet Section */}
      {(isAddDone || bulletState !== "hidden") && (
        <div className="border-t border-slate-100 pt-4 space-y-2">
          {bulletState === "hidden" && (
            <button
              type="button"
              onClick={handleGenerateBullet}
              className="flex items-center gap-1.5 text-xs font-black text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100/80 px-3.5 py-2 rounded-xl transition-all border-none"
            >
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              {t.generateBullet}
            </button>
          )}

          {bulletState === "generating" && (
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
              <div className="w-3.5 h-3.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              {t.generatingBullet}
            </div>
          )}

          {bulletState === "visible" && bulletText && (
            <div className="rounded-2xl bg-violet-50/50 border border-violet-100 p-4 space-y-2.5">
              <p className="text-[10px] font-black text-violet-500 uppercase tracking-wider">
                {t.bulletTitle}
              </p>
              <p className="text-xs text-slate-700 leading-relaxed font-bold italic">
                &ldquo;{bulletText}&rdquo;
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[10px] font-bold text-violet-600 hover:text-violet-700 bg-white hover:bg-violet-50 border border-violet-200 px-2.5 py-1.5 rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined text-[12px]">
                    {copied ? "check" : "content_copy"}
                  </span>
                  {copied ? t.bulletCopied : t.bulletCopy}
                </button>
                <button
                  type="button"
                  onClick={() => { setBulletState("hidden"); setBulletText(""); }}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-transparent border-none transition-colors ml-1"
                >
                  {t.bulletClose}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Learning Resources */}
      {skill.resources && skill.resources.length > 0 ? (
        <div className="space-y-3 pt-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">local_library</span>
            Learning Path Steps
          </p>
          <div className="grid grid-cols-1 gap-3">
            {skill.resources.map((course, idx) => (
              <LearningResourceCard key={course.id} resource={course} stepNumber={idx + 1} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[10px] italic text-slate-400 pt-2">No learning resources available for this skill.</p>
      )}
    </div>
  );
}
