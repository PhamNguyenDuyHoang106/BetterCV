import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface Phase {
  phaseIndex: number;
  phaseName: string;
  skillIds: string[];
}

@Injectable()
export class PhaseBuilderService {
  constructor(private prisma: PrismaService) {}

  /**
   * Groups a topologically sorted list of skill IDs into phases.
   * A skill's phase index is determined by: max(phaseIndex of its dependencies) + 1.
   * If it has no dependencies within the list, it starts in Phase 1 (index 0).
   */
  async buildPhases(sortedSkillIds: string[], locale = 'vi'): Promise<Phase[]> {
    if (!sortedSkillIds || sortedSkillIds.length === 0) return [];

    // 1. Fetch dependencies between these selected skills
    const dependencies = await this.prisma.skillDependency.findMany({
      where: {
        skillId: { in: sortedSkillIds },
        dependsOnId: { in: sortedSkillIds },
      },
    });

    // Map each skill to the list of selected skills it depends on
    const depMap = new Map<string, string[]>();
    sortedSkillIds.forEach(id => depMap.set(id, []));
    dependencies.forEach(dep => {
      depMap.get(dep.skillId)?.push(dep.dependsOnId);
    });

    // 2. Assign phase index to each skill in topological order
    const skillPhases = new Map<string, number>();
    
    for (const id of sortedSkillIds) {
      const parentDeps = depMap.get(id) || [];
      if (parentDeps.length === 0) {
        skillPhases.set(id, 0); // Phase 1
      } else {
        let maxParentPhase = 0;
        parentDeps.forEach(parentId => {
          const parentPhase = skillPhases.get(parentId) ?? 0;
          if (parentPhase > maxParentPhase) {
            maxParentPhase = parentPhase;
          }
        });
        skillPhases.set(id, maxParentPhase + 1);
      }
    }

    // 3. Group skills by phase index
    const phaseGroups = new Map<number, string[]>();
    skillPhases.forEach((phaseIdx, skillId) => {
      if (!phaseGroups.has(phaseIdx)) {
        phaseGroups.set(phaseIdx, []);
      }
      phaseGroups.get(phaseIdx)!.push(skillId);
    });

    // Sort phase indices
    const sortedPhaseIndices = Array.from(phaseGroups.keys()).sort((a, b) => a - b);
    const isVi = locale === 'vi';

    // 4. Construct phase name metadata based on index and locale
    return sortedPhaseIndices.map(idx => {
      let phaseName = '';
      if (isVi) {
        if (idx === 0) phaseName = 'Giai đoạn 1: Kiến thức nền tảng';
        else if (idx === 1) phaseName = 'Giai đoạn 2: Phát triển cốt lõi';
        else if (idx === 2) phaseName = 'Giai đoạn 3: Nâng cao & Tối ưu';
        else phaseName = `Giai đoạn ${idx + 1}: Kỹ năng mở rộng`;
      } else {
        if (idx === 0) phaseName = 'Phase 1: Foundation Skills';
        else if (idx === 1) phaseName = 'Phase 2: Core Expansion';
        else if (idx === 2) phaseName = 'Phase 3: Advanced Mastery';
        else phaseName = `Phase ${idx + 1}: Professional Expansion`;
      }

      return {
        phaseIndex: idx,
        phaseName,
        skillIds: phaseGroups.get(idx)!,
      };
    });
  }
}
