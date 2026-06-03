import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { RequestContextStore } from '../context/request-context.store';

import { hashIp } from '../utils/hash.util';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const originalUrl = req.originalUrl || req.url || '';
    const decodedUrl = decodeURIComponent(originalUrl);
    if (
      originalUrl.includes('..') ||
      originalUrl.includes('%2e') ||
      originalUrl.includes('%2E') ||
      decodedUrl.includes('..')
    ) {
      res.status(400).json({
        statusCode: 400,
        message: 'Malicious path traversal attempt detected',
        error: 'Bad Request',
      });
      return;
    }

    const raw = req.headers['x-request-id'] || (req as any).id;
    let requestId: string;

    if (Array.isArray(raw)) {
      requestId = raw[0];
    } else if (typeof raw === 'string' && raw.length > 0) {
      requestId = raw;
    } else {
      requestId = randomUUID();
    }

    req.headers['x-request-id'] = requestId;
    (req as any).id = requestId;
    res.setHeader('x-request-id', requestId);

    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress ||
      '';
    const ipHash = hashIp(ip);

    RequestContextStore.run({ requestId, ipHash }, () => {
      next();
    });
  }
}
