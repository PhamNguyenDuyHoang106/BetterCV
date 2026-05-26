import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - start;
        const statusCode = response.statusCode;
        const requestId = (request as any).requestId || null;
        const userId = (request as any).user?.sub || null;

        const logPayload = {
          timestamp: new Date().toISOString(),
          requestId,
          userId,
          method,
          url,
          statusCode,
          latencyMs: elapsed,
        };

        this.logger.log(JSON.stringify(logPayload));
      }),
    );
  }
}
