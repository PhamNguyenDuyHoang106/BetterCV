import { Injectable, Inject } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { Logger } from 'nestjs-pino';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  @Inject(Logger)
  private readonly logger!: Logger;

  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context, throttler } = requestProps;

    // Isolate the 'ats' throttler to only apply to /ats/score endpoint
    if (throttler.name === 'ats') {
      const req = context.switchToHttp().getRequest();
      const url = req.originalUrl || req.url || '';
      if (!url.includes('/ats/score')) {
        return true; // Skip by returning true instantly without incrementing counters
      }
    }

    // Isolate the 'coach' throttler to only apply to /career/coach-chat endpoint
    if (throttler.name === 'coach') {
      const req = context.switchToHttp().getRequest();
      const url = req.originalUrl || req.url || '';
      if (!url.includes('/career/coach-chat')) {
        return true; // Skip by returning true instantly without incrementing counters
      }
    }

    try {
      return await super.handleRequest(requestProps);
    } catch (err) {
      if (throttler.name === 'coach') {
        const req = context.switchToHttp().getRequest();
        const url = req.originalUrl || req.url || '';
        this.logger.warn({
          event: 'coach_rate_limit_blocked',
          userId: req.user?.sub,
          url,
        }, 'Rate limit blocked for career coach chat');
      }
      throw err;
    }
  }
}
