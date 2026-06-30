import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SkillGraphService {
  constructor(private prisma: PrismaService) {}

  /**
   * Performs topological sort on a subset of skills.
   * If a circular dependency is detected, throws a BadRequestException.
   *
   * @param skillIds Array of skill IDs to sort.
   * @returns Sorted array of skill IDs, where dependencies (prerequisites) come first.
   */
  async sortSkills(skillIds: string[]): Promise<string[]> {
    if (!skillIds || skillIds.length === 0) return [];

    // 1. Fetch skills to build ID to Name mapping for error messaging
    const skills = await this.prisma.skill.findMany({
      where: { id: { in: skillIds } },
      select: { id: true, name: true },
    });
    const skillNameMap = new Map(skills.map(s => [s.id, s.name]));

    // 2. Fetch dependencies where both skillId and dependsOnId are in the input list
    const dependencies = await this.prisma.skillDependency.findMany({
      where: {
        skillId: { in: skillIds },
        dependsOnId: { in: skillIds },
      },
    });

    // 3. Build adjacency list representation of the subgraph
    // If u depends on v, there is a directed edge from v (prerequisite) to u (dependent)
    const adjList = new Map<string, string[]>();
    skillIds.forEach(id => adjList.set(id, []));

    dependencies.forEach(dep => {
      const u = dep.skillId;
      const v = dep.dependsOnId;
      adjList.get(v)?.push(u);
    });

    // 4. DFS-based Topological Sort & Cycle Detection
    // Colors: 0 = unvisited, 1 = visiting (in recursion stack), 2 = visited
    const visited = new Map<string, number>();
    skillIds.forEach(id => visited.set(id, 0));

    const result: string[] = [];

    const dfs = (node: string, path: string[]) => {
      visited.set(node, 1);
      path.push(node);

      const neighbors = adjList.get(node) || [];
      for (const neighbor of neighbors) {
        const color = visited.get(neighbor);
        if (color === 1) {
          // Cycle detected! Construct friendly path
          const cycleStartIdx = path.indexOf(neighbor);
          const cyclePathIds = path.slice(cycleStartIdx).concat(neighbor);
          const cyclePathNames = cyclePathIds.map(id => skillNameMap.get(id) || id);
          throw new BadRequestException(
            `Circular dependency detected: ${cyclePathNames.join(' -> ')}`
          );
        } else if (color === 0) {
          dfs(neighbor, [...path]);
        }
      }

      visited.set(node, 2);
      result.push(node);
    };

    for (const id of skillIds) {
      if (visited.get(id) === 0) {
        dfs(id, []);
      }
    }

    // Reverse to get topological order (prerequisites first)
    return result.reverse();
  }
}
