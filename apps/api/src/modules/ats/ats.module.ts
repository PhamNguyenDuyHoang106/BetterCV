import { Module } from '@nestjs/common';
import { AtsController } from './ats.controller';
import { AtsService } from './ats.service';
import { AtsRetentionService } from './ats-retention.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [AtsController],
  providers: [AtsService, AtsRetentionService],
  exports: [AtsService, AtsRetentionService],
})
export class AtsModule {}
