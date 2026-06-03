import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
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

    return super.handleRequest(requestProps);
  }
}
