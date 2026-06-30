import React from "react";
import { SkillCard } from "./SkillCard";

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

type SkillCardTranslations = {
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

type Props = {
  phase: Phase;
  roadmapId: string;
  phaseLabel: string;
  viewCoursesLabel: string;
  t: SkillCardTranslations;
};

export function PhaseCard({ phase, roadmapId, phaseLabel, viewCoursesLabel, t }: Props) {
  // Sum up estimated weeks for this phase
  const totalWeeks = phase.skills.reduce((sum, s) => sum + s.estimatedWeeks, 0);

  return (
    <div className="relative pl-8 md:pl-10 pb-10 last:pb-0 group">
      {/* Timeline connection vertical line */}
      <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-indigo-100 group-last:bottom-auto group-last:h-6" />

      {/* Timeline bullet */}
      <div className="absolute left-1.5 top-1.5 w-4.5 h-4.5 rounded-full border-[3.5px] border-indigo-600 bg-white group-hover:scale-110 transition-transform shadow-sm" />

      <div className="space-y-4">
        {/* Phase Header */}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest leading-none">
            {phaseLabel.replace("{index}", (phase.phaseIndex + 1).toString())}
          </h3>
          <h4 className="text-base font-bold text-slate-800 leading-none">
            {phase.phaseName}
          </h4>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
            {totalWeeks} {totalWeeks === 1 ? "week" : "weeks"}
          </span>
        </div>

        {/* Phase Skills Grid */}
        <div className="grid grid-cols-1 gap-4">
          {phase.skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              roadmapId={roadmapId}
              viewCoursesLabel={viewCoursesLabel}
              t={t}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
