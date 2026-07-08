import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { RequestContextStore } from '../../core/context/request-context.store';
import { AiService } from '../ai/ai.service';
import { AtsService } from '../ats/ats.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { CareerProcessor } from './career.processor';

@Injectable()
export class CareerService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('career-queue') private careerQueue: Queue,
    private aiService: AiService,
    private atsService: AtsService,
    private eventEmitter: EventEmitter2,
    private config: ConfigService,
    private careerProcessor: CareerProcessor,
  ) {}

  /**
   * Triggers the asynchronous career roadmap generation process.
   * Performs quota checks, idempotency verification, and enqueues the BullMQ job.
   */
  async createRoadmap(
    supabaseId: string,
    dto: { atsScanId: string; currentRole: string; targetRole: string },
  ) {
    // 1. Resolve User ID
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true, role: true, subscriptions: { where: { status: 'active' }, include: { plan: true } } },
    });
    if (!user) throw new NotFoundException('User not found');

    const userId = user.id;
    const { atsScanId, currentRole, targetRole } = dto;

    // Verify AtsScan exists
    const scan = await this.prisma.atsScan.findUnique({
      where: { id: atsScanId },
      select: { id: true },
    });
    if (!scan) throw new NotFoundException('ATS Scan not found');

    // 2. Idempotency & Cache Check: Verify if there is an active generation job or already cached roadmap
    let existing = await this.prisma.careerRoadmap.findFirst({
      where: {
        userId,
        atsScanId,
        targetRole,
        status: { in: ['GENERATING', 'READY'] },
      },
      select: { id: true, status: true, createdAt: true },
    });

    if (existing) {
      if (
        existing.status === 'GENERATING' &&
        Date.now() - new Date(existing.createdAt).getTime() > 5 * 60 * 1000 // 5 minutes timeout
      ) {
        // Stale job! Mark it as FAILED so it can be re-run
        await this.prisma.careerRoadmap.update({
          where: { id: existing.id },
          data: {
            status: 'FAILED',
            failureReason: 'Roadmap generation timed out (stale job).',
            failedAt: new Date(),
          },
        });
        existing = null; // Proceed to create a new job
      } else {
        return {
          success: true,
          roadmapId: existing.id,
          msg: existing.status === 'GENERATING'
            ? 'Roadmap generation already in progress'
            : 'Roadmap already generated and cached',
        };
      }
    }

    // 3. Quota Check (Monthly Quota)
    // FREE: 1 roadmap per calendar month
    // PRO/PREMIUM/ADMIN: Unlimited
    const hasActivePremium = user.subscriptions.length > 0 || ['PRO', 'PREMIUM', 'ADMIN'].includes(user.role);
    if (!hasActivePremium) {
      const startOfMonth = new Date();
      startOfMonth.setUTCDate(1);
      startOfMonth.setUTCHours(0, 0, 0, 0);

      const roadmapCount = await this.prisma.careerRoadmap.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
      });

      if (roadmapCount >= 1) {
        throw new ForbiddenException('Monthly career roadmap quota exceeded. Please upgrade to PRO.');
      }
    }

    // 4. Create record with GENERATING status
    const roadmap = await this.prisma.careerRoadmap.create({
      data: {
        userId,
        atsScanId,
        currentRole,
        targetRole,
        estimatedMonths: 0,
        status: 'GENERATING',
        progress: 0,
      },
    });

    // 5. Enqueue Job or process inline
    const requestId = RequestContextStore.get('requestId') || `worker-req-${roadmap.id}`;
    const redisEnabled = this.config.get<string>('REDIS_ENABLED', 'true') === 'true';

    if (!redisEnabled) {
      // Process inline asynchronously to avoid blocking the HTTP request
      setImmediate(() => {
        this.careerProcessor
          .generateRoadmapInline({
            roadmapId: roadmap.id,
            userId,
            atsScanId,
            targetRole,
            requestId,
          })
          .catch((err) => {
            // Sentry or log error is already handled inside generateRoadmapInline
          });
      });
    } else {
      await this.careerQueue.add(
        'generate-roadmap',
        {
          roadmapId: roadmap.id,
          userId,
          atsScanId,
          targetRole,
          trace: {
            requestId,
            createdAt: Date.now(),
          },
        },
        {
          jobId: roadmap.id, // Ensure single active job per roadmap ID in queue
        },
      );
    }

    return { success: true, roadmapId: roadmap.id };
  }

  /**
   * Retrieves full details of a CareerRoadmap, mapping courses in real-time.
   */
  async getRoadmap(supabaseId: string, roadmapId: string) {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    let roadmap = await this.prisma.careerRoadmap.findFirst({
      where: { id: roadmapId, userId: user.id },
      include: {
        phases: {
          orderBy: { phaseIndex: 'asc' },
          include: {
            skills: {
              orderBy: { order: 'asc' },
              include: {
                skill: true,
              },
            },
          },
        },
        skillGaps: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!roadmap) throw new NotFoundException('Career Roadmap not found');

    // Auto-fail stale generating job on-read
    if (
      roadmap.status === 'GENERATING' &&
      Date.now() - new Date(roadmap.createdAt).getTime() > 5 * 60 * 1000
    ) {
      roadmap = await this.prisma.careerRoadmap.update({
        where: { id: roadmap.id },
        data: {
          status: 'FAILED',
          failureReason: 'Roadmap generation timed out (stale job).',
          failedAt: new Date(),
        },
        include: {
          phases: {
            orderBy: { phaseIndex: 'asc' },
            include: {
              skills: {
                orderBy: { order: 'asc' },
                include: {
                  skill: true,
                },
              },
            },
          },
          skillGaps: {
            include: {
              skill: true,
            },
          },
        },
      });
    }

    if (roadmap.status !== 'READY') {
      return {
        id: roadmap.id,
        status: roadmap.status,
        progress: roadmap.progress,
        currentRole: roadmap.currentRole,
        targetRole: roadmap.targetRole,
        createdAt: roadmap.createdAt,
        failureReason: roadmap.failureReason || null,
        failedAt: roadmap.failedAt || null,
      };
    }

    // 1. Collect all Skill IDs in the phases
    const allSkillIds: string[] = [];
    roadmap.phases.forEach(phase => {
      phase.skills.forEach(ps => {
        allSkillIds.push(ps.skillId);
      });
    });

    // 2. Query all active courses for these skills in a single query
    const courses = await this.prisma.course.findMany({
      where: {
        skillId: { in: allSkillIds },
        isActive: true,
      },
    });

    // Group courses by skillId for fast O(1) lookup
    const coursesBySkillId = new Map<string, any[]>();
    courses.forEach(course => {
      if (!coursesBySkillId.has(course.skillId)) {
        coursesBySkillId.set(course.skillId, []);
      }
      coursesBySkillId.get(course.skillId)!.push(course);
    });

    // 3. Compute ATS match improvement range (deterministic)
    const totalImpact = roadmap.skillGaps.reduce((sum, gap) => sum + gap.estimatedImpact, 0);
    const impactMax = Math.min(20, totalImpact);
    const impactMin = Math.max(1, Math.round(impactMax * 0.4));

    // 4. Map courses to skills inside the phases list dynamically
    const formattedPhases = roadmap.phases.map(phase => ({
      id: phase.id,
      phaseIndex: phase.phaseIndex,
      phaseName: phase.phaseName,
      skills: phase.skills.map(ps => ({
        id: ps.skill.id,
        name: ps.skill.name,
        category: ps.skill.category,
        difficulty: ps.skill.difficulty,
        estimatedWeeks: ps.skill.estimatedWeeks,
        courses: coursesBySkillId.get(ps.skillId) || [],
      })),
    }));

    return {
      id: roadmap.id,
      status: roadmap.status,
      progress: roadmap.progress,
      currentRole: roadmap.currentRole,
      targetRole: roadmap.targetRole,
      estimatedMonths: roadmap.estimatedMonths,
      explanation: roadmap.explanation,
      atsImprovementRange: {
        min: impactMin,
        max: impactMax,
      },
      phases: formattedPhases,
      skillGaps: roadmap.skillGaps.map(gap => ({
        id: gap.id,
        name: gap.skill.name,
        priority: gap.priority,
        estimatedImpact: gap.estimatedImpact,
      })),
      createdAt: roadmap.createdAt,
    };
  }

  /**
   * Lists all roadmaps created by a user.
   */
  async listRoadmaps(supabaseId: string) {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.careerRoadmap.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        currentRole: true,
        targetRole: true,
        status: true,
        progress: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Adds a skill from the Career Roadmap to the user's CV SKILLS section.
   * - Backend resolves cvId via roadmap → atsScan → cv (no cvId param needed from client)
   * - Idempotency: checks skill.id to prevent duplicates (handles "NodeJS" vs "Node.js" naming variants)
   */
  async addSkillToCv(
    supabaseId: string,
    dto: { roadmapId: string; skillId: string },
  ) {
    // 1. Resolve user
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // 2. Fetch roadmap and verify ownership, then resolve cvId via atsScan
    const roadmap = await this.prisma.careerRoadmap.findFirst({
      where: { id: dto.roadmapId, userId: user.id },
      include: {
        atsScan: {
          select: { cvId: true, cv: { select: { locale: true } } },
        },
      },
    });
    if (!roadmap) throw new NotFoundException('Career Roadmap not found');

    const cvId = roadmap.atsScan?.cvId;
    if (!cvId) throw new NotFoundException('No CV associated with this roadmap\'s ATS scan');

    // 3. Fetch skill from catalog
    const skill = await this.prisma.skill.findUnique({
      where: { id: dto.skillId },
      select: { id: true, name: true, difficulty: true },
    });
    if (!skill) throw new NotFoundException('Skill not found in catalog');

    // 4. Map SkillDifficulty enum → CV skill level string
    const levelMap: Record<string, string> = {
      BEGINNER: 'Beginner',
      INTERMEDIATE: 'Intermediate',
      ADVANCED: 'Advanced',
    };
    const level = levelMap[skill.difficulty] || 'Intermediate';

    // 5. Find the SKILLS CvSection for this CV
    const skillsSection = await this.prisma.cvSection.findFirst({
      where: { cvId, type: 'SKILLS' },
    });

    const currentContent: any = skillsSection?.content || { items: [], showLevel: true };
    const items: any[] = Array.isArray(currentContent.items) ? currentContent.items : [];

    // 6. Idempotency: check by skill.id (catalog ID) to prevent duplicates
    const alreadyAdded = items.some((i: any) => i.id === skill.id);
    if (alreadyAdded) {
      return {
        success: true,
        alreadyAdded: true,
        skill: { id: skill.id, name: skill.name, level },
        cvId,
      };
    }

    // 7. Prepend the new skill to the items list
    const newSkillItem = { id: skill.id, name: skill.name, level };
    const updatedItems = [newSkillItem, ...items];
    const updatedContent = { ...currentContent, items: updatedItems };

    // 8. Upsert the SKILLS CvSection
    if (skillsSection) {
      await this.prisma.cvSection.update({
        where: { id: skillsSection.id },
        data: { content: updatedContent, updatedAt: new Date() },
      });
    } else {
      // Create SKILLS section if it doesn't exist yet
      await this.prisma.cvSection.create({
        data: {
          cvId,
          type: 'SKILLS',
          content: updatedContent,
          order: 5,
        },
      });
    }

    // Invalidate career coach personalization cache on CV update (Phase 5B event-driven)
    this.eventEmitter.emit('cv.updated', { userId: user.id });

    return {
      success: true,
      alreadyAdded: false,
      skill: { id: skill.id, name: skill.name, level },
      cvId,
    };
  }

  /**
   * Generates a single ATS-optimized resume bullet point for a skill.
   * Separate endpoint from addSkillToCv for resilience — AI failure won't block skill addition.
   */
  async generateSkillBullet(
    supabaseId: string,
    dto: { skillId: string; roadmapId: string },
  ) {
    // 1. Fetch skill info
    const skill = await this.prisma.skill.findUnique({
      where: { id: dto.skillId },
      select: { name: true, category: true },
    });
    if (!skill) throw new NotFoundException('Skill not found');

    // 2. Fetch roadmap for targetRole + locale
    const roadmap = await this.prisma.careerRoadmap.findUnique({
      where: { id: dto.roadmapId },
      include: {
        atsScan: {
          select: { cv: { select: { locale: true } } },
        },
      },
    });
    if (!roadmap) throw new NotFoundException('Roadmap not found');

    const locale = roadmap.atsScan?.cv?.locale || 'vi';

    // 3. Call AiService to generate bullet
    const bullet = await this.aiService.generateSkillBullet({
      supabaseId,
      skillName: skill.name,
      skillCategory: skill.category,
      targetRole: roadmap.targetRole,
      locale,
    });

    return { success: true, bullet };
  }

  /**
   * Re-runs ATS scoring for the CV associated with a roadmap.
   * Uses the exact same jobDescription from the roadmap's original AtsScan (idempotent).
   */
  async rescoreAts(
    supabaseId: string,
    dto: { roadmapId: string },
  ) {
    // 1. Fetch roadmap → atsScan (source of truth for JD)
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const roadmap = await this.prisma.careerRoadmap.findFirst({
      where: { id: dto.roadmapId, userId: user.id },
      include: {
        atsScan: {
          select: { cvId: true, jobDescription: true, overallScore: true, cv: { select: { locale: true } } },
        },
      },
    });
    if (!roadmap) throw new NotFoundException('Career Roadmap not found');

    const atsScan = roadmap.atsScan;
    if (!atsScan?.cvId || !atsScan?.jobDescription) {
      throw new NotFoundException('No ATS scan data associated with this roadmap');
    }

    const previousScore = atsScan.overallScore || 0;
    const locale = atsScan.cv?.locale || 'vi';

    // 2. Re-run ATS evaluation with the same JD (cache may hit if CV unchanged)
    const result = await this.atsService.evaluateCv(
      supabaseId,
      atsScan.cvId,
      atsScan.jobDescription,
      locale,
    );

    const newScore = result?.data?.score ?? previousScore;
    const delta = newScore - previousScore;

    // Invalidate career coach personalization cache on rescoring (Phase 5B event-driven)
    this.eventEmitter.emit('roadmap.updated', { userId: user.id, roadmapId: dto.roadmapId });

    return {
      success: true,
      previousScore,
      newScore,
      delta,
      atsScanId: result?.data?.id,
    };
  }
}
