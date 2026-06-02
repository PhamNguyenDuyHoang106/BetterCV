import { Module } from '@nestjs/common';
import { AtsController } from './ats.controller';
import { AtsService } from './ats.service';
import { AtsRetentionService } from './ats-retention.service';

@Module({
  controllers: [AtsController],
  providers: [AtsService, AtsRetentionService],
  exports: [AtsService, AtsRetentionService],
})
export class AtsModule {}
