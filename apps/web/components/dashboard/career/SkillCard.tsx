import React, { useState } from "react";
import { CourseCard } from "./CourseCard";
import { apiFetch } from "../../../lib/api";

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
    } catch (err) {
      console.error("Add to CV failed:", err);
      setAddState("error");
      // Reset after 3s
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
    } catch (err) {
      console.error("Generate bullet failed:", err);
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

  return (
    <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all duration-300 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            {skill.name}
          </h4>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {skill.category.replace("_", " ")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 block">
              ~{skill.estimatedWeeks} {skill.estimatedWeeks === 1 ? "week" : "weeks"}
            </span>
            <span
              className={`inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded leading-none mt-1 ${
                skill.difficulty === "ADVANCED"
                  ? "bg-rose-50 text-rose-600"
                  : skill.difficulty === "INTERMEDIATE"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {skill.difficulty}
            </span>
          </div>

          {/* Add to CV Button */}
          <button
            type="button"
            onClick={handleAddToCv}
            disabled={addState === "adding" || isAddDone}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border-none shadow-sm ${
              isAddDone
                ? "bg-emerald-100 text-emerald-700 cursor-default"
                : addState === "error"
                ? "bg-rose-100 text-rose-600 cursor-default"
                : addState === "adding"
                ? "bg-slate-100 text-slate-500 cursor-wait"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-200"
            }`}
          >
            {addState === "adding" ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isAddDone ? (
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
            ) : (
              <span className="material-symbols-outlined text-[13px]">add</span>
            )}
            {addBtnLabel}
          </button>
        </div>
      </div>

      {/* Generate Bullet Section — show after skill is added */}
      {(isAddDone || bulletState !== "hidden") && (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          {bulletState === "hidden" && (
            <button
              type="button"
              onClick={handleGenerateBullet}
              className="flex items-center gap-1.5 text-[11px] font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-all border-none"
            >
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              {t.generateBullet}
            </button>
          )}

          {bulletState === "generating" && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              {t.generatingBullet}
            </div>
          )}

          {bulletState === "visible" && bulletText && (
            <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 space-y-2">
              <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">
                {t.bulletTitle}
              </p>
              <p className="text-xs text-slate-700 leading-relaxed font-medium italic">
                &ldquo;{bulletText}&rdquo;
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[10px] font-bold text-violet-600 hover:text-violet-700 bg-white hover:bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined text-[12px]">
                    {copied ? "check" : "content_copy"}
                  </span>
                  {copied ? t.bulletCopied : t.bulletCopy}
                </button>
                <button
                  type="button"
                  onClick={() => { setBulletState("hidden"); setBulletText(""); }}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-transparent border-none transition-colors"
                >
                  {t.bulletClose}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Courses */}
      {skill.courses && skill.courses.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">local_library</span>
            {viewCoursesLabel}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {skill.courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[10px] italic text-slate-400">No courses available for this skill.</p>
      )}
    </div>
  );
}
