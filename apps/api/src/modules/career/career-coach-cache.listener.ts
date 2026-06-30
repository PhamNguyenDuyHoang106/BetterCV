import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CareerCoachService } from './career-coach.service';

@Injectable()
export class CareerCoachCacheListener {
  private readonly logger = new Logger(CareerCoachCacheListener.name);

  constructor(private readonly coachService: CareerCoachService) {}

  @OnEvent('cv.updated')
  async handleCvUpdated(event: { userId: string }) {
    this.logger.log(`Handling cv.updated event for userId=${event.userId}`);
    await this.coachService.clearUserCoachCache(event.userId);
  }

  @OnEvent('roadmap.updated')
  async handleRoadmapUpdated(event: { userId: string; roadmapId: string }) {
    this.logger.log(`Handling roadmap.updated event for userId=${event.userId}, roadmapId=${event.roadmapId}`);
    await this.coachService.clearCoachCache(event.userId, event.roadmapId);
  }
}
