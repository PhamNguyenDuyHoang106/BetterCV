import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../../modules/audit/audit.service';
import {
  AUDIT_LOG_KEY,
  LogAuditOptions,
} from '../decorators/log-audit.decorator';
import { PrismaService } from '../../database/prisma.service';
import { AuditActorType } from '@prisma/client';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditLogService: AuditLogService,
    private prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.getAllAndOverride<LogAuditOptions>(
      AUDIT_LOG_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: async (data) => {
          await this.log(request, auditOptions, startTime, null, data);
        },
        error: async (err) => {
          await this.log(request, auditOptions, startTime, err, null);
        },
      }),
    );
  }

  private async log(
    request: any,
    options: LogAuditOptions,
    startTime: number,
    error: any,
    responseData: any,
  ) {
    try {
      const durationMs = Date.now() - startTime;
      const user = request.user;
      let actorUserId: string | null = null;
      let actorType: AuditActorType = 'SYSTEM';

      if (user && user.sub) {
        // Resolve database user ID from Supabase ID
        const dbUser = await this.prisma.user.findUnique({
          where: { supabaseId: user.sub },
          select: { id: true, role: true },
        });
        if (dbUser) {
          actorUserId = dbUser.id;
          actorType = dbUser.role === 'ADMIN' ? 'ADMIN' : 'USER';
        }
      }

      // Determine resource ID
      // If resourceId is in request params (e.g. :id or :cvId), use it.
      // Otherwise check request body or responseData.
      let resourceId: string | null =
        request.params?.id || request.params?.cvId || null;
      if (!resourceId && request.body?.cvId) {
        resourceId = request.body.cvId;
      }
      if (!resourceId && responseData?.id) {
        resourceId = responseData.id;
      }

      // Build newValue metadata
      const statusCode = error
        ? error.status || 500
        : request.res?.statusCode || 200;
      const metadata = {
        method: request.method,
        url: request.url,
        statusCode,
        durationMs,
        errorMessage: error ? error.message : undefined,
      };

      await this.auditLogService.logEvent({
        actorUserId,
        actorType,
        eventType: options.eventType,
        action: options.action,
        resourceType: options.resourceType,
        resourceId,
        oldValue: undefined,
        newValue: metadata,
        severity: options.severity || 'INFO',
      });
    } catch (logErr) {
      // Never fail the request because audit logging fails
      console.error('Failed to write request audit log:', logErr);
    }
  }
}
