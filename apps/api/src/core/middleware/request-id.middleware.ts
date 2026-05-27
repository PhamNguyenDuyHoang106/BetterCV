import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Read x-request-id from headers or generate a new unique UUID
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();

    // Attach to request object so we can read it down the line
    req.headers['x-request-id'] = requestId;
    (req as any).requestId = requestId;

    // Send it back in the response headers for frontend tracking/auditing
    res.setHeader('x-request-id', requestId);

    next();
  }
}
