import React from "react";
import { PhaseCard } from "./PhaseCard";

type LearningResource = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  url: string;
  provider: string;
  providerLabel?: string | null;
  resourceType: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  durationMin?: number | null;
  isPaid: boolean;
  qualityScore: number;
  status: string;
};

type Skill = {
  id: string;
  name: string;
  category: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedWeeks: number;
  hiringDemand: "CORE" | "IMPORTANT" | "OPTIONAL";
  prerequisites: Array<{ id: string; name: string }>;
  project: {
    suggestion: string;
    difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    hours: number;
    outcome: string;
  } | null;
  resources: LearningResource[];
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
