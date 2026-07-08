import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, NotFoundException } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import * as Sentry from '@sentry/node';
import { RequestContextStore } from '../../core/context/request-context.store';
import { PrismaService } from '../../database/prisma.service';
import { SkillGraphService } from './skill-graph.service';
import { AiGapAnalyzerService } from './ai-gap-analyzer.service';
import { PhaseBuilderService } from './phase-builder.service';
import { ImpactCalculatorService } from './impact-calculator.service';

@Processor('career-queue', { concurrency: 2 })
export class CareerProcessor extends WorkerHost {
  private readonly logger = new Logger(CareerProcessor.name);

  constructor(
    private prisma: PrismaService,
    private aiGapAnalyzer: AiGapAnalyzerService,
    private skillGraph: SkillGraphService,
    private phaseBuilder: PhaseBuilderService,
    private impactCalculator: ImpactCalculatorService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { roadmapId, userId, atsScanId, targetRole, trace } = job.data;
    const requestId = trace?.requestId || `worker-${job.id}`;

    return this.generateRoadmapInline({
      roadmapId,
      userId,
      atsScanId,
      targetRole,
      requestId,
    });
  }

  async generateRoadmapInline(data: {
    roadmapId: string;
    userId: string;
    atsScanId: string;
    targetRole: string;
    requestId?: string;
  }): Promise<any> {
    const { roadmapId, userId, atsScanId, targetRole, requestId = 'inline' } = data;
    return RequestContextStore.run(
      { requestId },
      async () => {
        this.logger.log({
          msg: 'Career roadmap inline generation started',
          module: 'CareerService',
          jobType: 'career-roadmap',
          event: 'job_started',
          roadmapId,
          requestId,
        });

        const start = Date.now();

        try {
          // 1. Fetch the AtsScan to get missingKeywords
          const scan = await this.prisma.atsScan.findUnique({
            where: { id: atsScanId },
            select: {
              missingKeywords: true,
              cv: {
                select: { locale: true },
              },
            },
          });

          if (!scan) {
            throw new NotFoundException(`AtsScan with ID ${atsScanId} not found`);
          }

          const rawKeywords = scan.missingKeywords;
          const missingKeywords = Array.isArray(rawKeywords)
            ? (rawKeywords as string[])
            : [];
          const locale = scan.cv?.locale || 'vi';

          // Update progress: 20%
          await this.prisma.careerRoadmap.update({
            where: { id: roadmapId },
            data: { progress: 20 },
          });

          // 2. Call AI Gap Analyzer to select matching skills and generate explanation
          const aiResult = await this.aiGapAnalyzer.analyzeGaps(
            userId,
            missingKeywords,
            targetRole,
            locale,
          );

          const { selectedSkillIds, explanation } = aiResult;

          // Update progress: 50%
          await this.prisma.careerRoadmap.update({
            where: { id: roadmapId },
            data: { progress: 50 },
          });

          if (selectedSkillIds.length === 0) {
            // No skills matching the catalog were selected, complete immediately
            await this.prisma.careerRoadmap.update({
              where: { id: roadmapId },
              data: {
                status: 'READY',
                progress: 100,
                estimatedMonths: 0,
                explanation: explanation || (locale === 'vi' 
                  ? 'Không tìm thấy kỹ năng cần bổ sung nào phù hợp với thư viện.' 
                  : 'No matching skills to improve were found in the library.'),
              },
            });

            this.logger.log({
              msg: 'Career roadmap completed with empty skills selection',
              roadmapId,
            });
            return { success: true, skillsCount: 0 };
          }

          // 3. Topological Sort with cycle checking
          const sortedSkillIds = await this.skillGraph.sortSkills(selectedSkillIds);

          // Update progress: 70%
          await this.prisma.careerRoadmap.update({
            where: { id: roadmapId },
            data: { progress: 70 },
          });

          // 4. Group skills into phases
          const phases = await this.phaseBuilder.buildPhases(sortedSkillIds, locale);

          // 5. Calculate ATS impact for each skill
          const impactMap = await this.impactCalculator.calculateImpacts(selectedSkillIds);

          // Update progress: 90%
          await this.prisma.careerRoadmap.update({
            where: { id: roadmapId },
            data: { progress: 90 },
          });

          // 6. Calculate total estimated months
          const skillsMeta = await this.prisma.skill.findMany({
            where: { id: { in: selectedSkillIds } },
            select: { id: true, estimatedWeeks: true },
          });
          const totalWeeks = skillsMeta.reduce((sum, s) => sum + s.estimatedWeeks, 0);
          const estimatedMonths = Math.max(0.5, parseFloat((totalWeeks / 4).toFixed(1)));

          // 7. Persist roadmap details (phases, roadmap-phase-skills, career-skill-gaps) in a transaction
          await this.prisma.$transaction(async (tx) => {
            // Delete any existing phases/gaps if this is a rebuild/retry
            await tx.roadmapPhase.deleteMany({ where: { roadmapId } });
            await tx.careerSkillGap.deleteMany({ where: { roadmapId } });

            // Create Phases & intermediate RoadmapPhaseSkill records
            for (const phase of phases) {
              const createdPhase = await tx.roadmapPhase.create({
                data: {
                  roadmapId,
                  phaseIndex: phase.phaseIndex,
                  phaseName: phase.phaseName,
                },
              });

              // Create relational link records
              for (let i = 0; i < phase.skillIds.length; i++) {
                const skillId = phase.skillIds[i];
                await tx.roadmapPhaseSkill.create({
                  data: {
                    phaseId: createdPhase.id,
                    skillId,
                    order: i,
                  },
                });
              }
            }

            // Create CareerSkillGap records
            let priorityCounter = 1;
            for (const skillId of sortedSkillIds) {
              const impact = impactMap.get(skillId) ?? 1;
              await tx.careerSkillGap.create({
                data: {
                  roadmapId,
                  skillId,
                  priority: priorityCounter++,
                  estimatedImpact: impact,
                },
              });
            }

            // Update parent CareerRoadmap
            await tx.careerRoadmap.update({
              where: { id: roadmapId },
              data: {
                status: 'READY',
                progress: 100,
                estimatedMonths,
                explanation,
              },
            });
          }, {
            maxWait: 10000, // 10 seconds max wait for connection
            timeout: 30000, // 30 seconds max execution time
          });

          const durationMs = Date.now() - start;
          this.logger.log({
            msg: 'Career roadmap inline generation completed successfully',
            module: 'CareerService',
            jobType: 'career-roadmap',
            event: 'job_completed',
            roadmapId,
            durationMs,
            requestId,
          });

          return { success: true, skillsCount: selectedSkillIds.length };
        } catch (err: any) {
          const durationMs = Date.now() - start;
          this.logger.error({
            msg: `Career roadmap inline generation failed: ${err.message}`,
            module: 'CareerService',
            jobType: 'career-roadmap',
            event: 'job_failed',
            roadmapId,
            durationMs,
            requestId,
            errorMessage: err.message,
            errorStack: err.stack,
          });

          // Update status to FAILED in database
          await this.prisma.careerRoadmap.update({
            where: { id: roadmapId },
            data: {
              status: 'FAILED',
              failureReason: err.message || 'Unknown error occurred during roadmap generation',
              failedAt: new Date(),
            },
          }).catch((dbErr) => {
            this.logger.error(`Failed to mark roadmap ${roadmapId} as FAILED: ${dbErr.message}`);
          });

          throw err;
        }
      }
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<any, any, string>, err: Error) {
    const { trace } = job.data || {};
    const requestId = trace?.requestId || null;

    this.logger.error({
      msg: 'Career roadmap job failed permanently',
      module: 'QueueWorker',
      jobType: 'career-roadmap',
      event: 'job_failed',
      queue: 'career-queue',
      jobId: job.id,
      errorMessage: err.message,
      errorStack: err.stack,
      requestId,
    });

    // Report to Sentry
    Sentry.withScope((scope) => {
      scope.setTag('requestId', requestId);
      scope.setTag('queue', 'career-queue');
      scope.setTag('jobId', job.id);
      scope.setContext('job_data', job.data);
      Sentry.captureException(err);
    });
  }
}
