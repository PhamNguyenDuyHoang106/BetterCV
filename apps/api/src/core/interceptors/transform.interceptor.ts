import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { RequestContextStore } from '../context/request-context.store';
import { hashUser, hashTenant } from '../utils/hash.util';
import { BYPASS_TRANSFORM_KEY } from '../decorators/bypass-transform.decorator';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    const user = (request as any).user;
    if (user) {
      const userHash = hashUser(user.sub || user.id || '');
      const tenantHash = hashTenant(user.tenantId || 'default');
      RequestContextStore.set('userHash', userHash);
      RequestContextStore.set('tenantHash', tenantHash);
    }

    // Check if bypass transform decorator is present on the controller or handler
    const bypass = this.reflector.getAllAndOverride<boolean>(
      BYPASS_TRANSFORM_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (bypass) {
      return next.handle();
    }

    const requestId =
      (request as any).id ?? request.headers['x-request-id'] ?? null;

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data: data ?? null,
        error: null,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      })),
    );
  }
}
