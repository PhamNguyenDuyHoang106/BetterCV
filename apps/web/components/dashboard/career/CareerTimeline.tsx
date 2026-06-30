import React from "react";
import { PhaseCard } from "./PhaseCard";

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
  phases: Phase[];
  roadmapId: string;
  phaseLabel: string;
  viewCoursesLabel: string;
  t: SkillCardTranslations;
};

export function CareerTimeline({ phases, roadmapId, phaseLabel, viewCoursesLabel, t }: Props) {
  if (!phases || phases.length === 0) {
    return <p className="text-slate-500 italic text-sm">No phases found for this roadmap.</p>;
  }

  return (
    <div className="py-2">
      {phases.map((phase) => (
        <PhaseCard
          key={phase.id}
          phase={phase}
          roadmapId={roadmapId}
          phaseLabel={phaseLabel}
          viewCoursesLabel={viewCoursesLabel}
          t={t}
        />
      ))}
    </div>
  );
}
