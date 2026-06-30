import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CareerController } from './career.controller';
import { CareerService } from './career.service';
import { SkillGraphService } from './skill-graph.service';
import { AiGapAnalyzerService } from './ai-gap-analyzer.service';
import { PhaseBuilderService } from './phase-builder.service';
import { ImpactCalculatorService } from './impact-calculator.service';
import { CareerProcessor } from './career.processor';
import { AiModule } from '../ai/ai.module';
import { AtsModule } from '../ats/ats.module';
import { CareerCoachService } from './career-coach.service';
import { CareerCoachCacheListener } from './career-coach-cache.listener';

@Module({
  imports: [
    AiModule,
    AtsModule,
    BullModule.registerQueue({
      name: 'career-queue',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // 5 seconds
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    }),
  ],
  controllers: [CareerController],
  providers: [
    CareerService,
    CareerCoachService,
    CareerCoachCacheListener,
    SkillGraphService,
    AiGapAnalyzerService,
    PhaseBuilderService,
    ImpactCalculatorService,
    CareerProcessor,
  ],
  exports: [CareerService, CareerCoachService],
})
export class CareerModule {}

