import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Lightweight middleware that echoes the pino-http-generated request ID
 * back in the response headers. Must run AFTER pino-http middleware
 * (which sets req.id via genReqId).
 *
 * This replaces the old RequestIdMiddleware. The ID generation itself
 * is now handled by pino-http's genReqId configuration.
 */
@Injectable()
export class RequestIdHeaderMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // pino-http sets req.id via genReqId callback
    // Echo it in the response header for client-side correlation
    const requestId = (req as any).id;
    if (requestId) {
      res.setHeader('x-request-id', requestId);
    }
    next();
  }
}
