import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ImpactCalculatorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculates the ATS impact score for each selected skill gap.
   * Required (ADVANCED difficulty) = +5 points
   * Preferred (INTERMEDIATE difficulty) = +2 points
   * Bonus (BEGINNER difficulty) = +1 point
   */
  async calculateImpacts(skillIds: string[]): Promise<Map<string, number>> {
    const impacts = new Map<string, number>();
    if (!skillIds || skillIds.length === 0) return impacts;

    const skills = await this.prisma.skill.findMany({
      where: { id: { in: skillIds } },
      select: { id: true, difficulty: true },
    });

    skills.forEach(skill => {
      let score = 1;
      if (skill.difficulty === 'ADVANCED') {
        score = 5;
      } else if (skill.difficulty === 'INTERMEDIATE') {
        score = 2;
      } else if (skill.difficulty === 'BEGINNER') {
        score = 1;
      }
      impacts.set(skill.id, score);
    });

    return impacts;
  }
}
