import { Global, Module } from '@nestjs/common';
import { FeatureFlagService } from './services/feature-flag.service';
import { QueueService } from './services/queue.service';
import { CleanupService } from './services/cleanup.service';

@Global()
@Module({
  providers: [FeatureFlagService, QueueService, CleanupService],
  exports: [FeatureFlagService, QueueService],
})
export class CoreModule {}
