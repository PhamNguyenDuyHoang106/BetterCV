import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'thumbnail-queue',
    }),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
