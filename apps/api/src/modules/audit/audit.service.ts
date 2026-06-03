import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RequestContextStore } from '../../core/context/request-context.store';
import {
  AuditLog,
  AuditEventType,
  AuditActorType,
  AuditSeverity,
  Prisma,
} from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface LogAuditOptions {
  actorUserId?: string | null;
  actorType: AuditActorType;
  eventType: AuditEventType;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  oldValue?: any;
  newValue?: any;
  severity: AuditSeverity;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Records an audit log event.
   * Can be run inside an existing Prisma transaction client to ensure atomicity.
   */
  async logEvent(
    options: LogAuditOptions,
    tx?: Prisma.TransactionClient,
  ): Promise<AuditLog> {
    const client = tx || this.prisma;

    // Pull request/trace context from AsyncLocalStorage
    const requestId = RequestContextStore.get('requestId') || null;
    const traceId = RequestContextStore.get('traceId') || null;
    const ipHash = RequestContextStore.get('ipHash') || null;

    // Compute diffs between old and new state to reduce DB payload and make audits clean
    const { oldState, newState } = this.extractStateDiffs(
      options.oldValue,
      options.newValue,
    );

    // Apply safety truncation of 10KB per snapshot column
    const formattedOldValue = this.safePayload(oldState);
    const formattedNewValue = this.safePayload(newState);

    return client.auditLog.create({
      data: {
        actorUserId: options.actorUserId || null,
        actorType: options.actorType,
        eventType: options.eventType,
        action: options.action,
        resourceType: options.resourceType,
        resourceId: options.resourceId || null,
        oldValue:
          formattedOldValue === null
            ? undefined
            : (formattedOldValue as Prisma.InputJsonValue),
        newValue:
          formattedNewValue === null
            ? undefined
            : (formattedNewValue as Prisma.InputJsonValue),
        severity: options.severity,
        requestId,
        traceId,
        ipHash,
      },
    });
  }

  /**
   * Compares old and new states and returns aligned objects containing only properties that changed.
   * Helps save index and table space.
   */
  private extractStateDiffs(
    oldVal: any,
    newVal: any,
  ): { oldState: any; newState: any } {
    if (!oldVal && !newVal) return { oldState: null, newState: null };
    if (!oldVal) return { oldState: null, newState: newVal };
    if (!newVal) return { oldState: oldVal, newState: null };

    if (typeof oldVal !== 'object' || typeof newVal !== 'object') {
      return oldVal === newVal
        ? { oldState: null, newState: null }
        : { oldState: oldVal, newState: newVal };
    }

    if (Array.isArray(oldVal) || Array.isArray(newVal)) {
      return JSON.stringify(oldVal) === JSON.stringify(newVal)
        ? { oldState: null, newState: null }
        : { oldState: oldVal, newState: newVal };
    }

    const oldState: Record<string, any> = {};
    const newState: Record<string, any> = {};
    const keys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
    let hasChanges = false;

    for (const key of keys) {
      const oldSubVal = oldVal[key];
      const newSubVal = newVal[key];

      if (JSON.stringify(oldSubVal) !== JSON.stringify(newSubVal)) {
        oldState[key] = oldSubVal;
        newState[key] = newSubVal;
        hasChanges = true;
      }
    }

    return hasChanges
      ? { oldState, newState }
      : { oldState: null, newState: null };
  }

  /**
   * Safe payload formatter that truncates JSON strings exceeding 10KB (10,240 chars).
   * Formats output as a structured truncation info block.
   */
  private safePayload(val: any): any {
    if (!val) return null;
    const str = JSON.stringify(val);
    if (str.length <= 10240) return val;

    return {
      truncated: true,
      originalSize: str.length,
      data: str.substring(0, 5000) + '... [TRUNCATED]',
    };
  }

  /**
   * Batched physical retention cleanup job running daily at 2:00 AM.
   * Deletes in batches of 1000 items to avoid lock escalation.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async purgeExpiredLogs(): Promise<number> {
    this.logger.log('Starting scheduled audit log retention cleanup...');
    const days = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90', 10);
    const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let deletedCount = 0;
    while (true) {
      const expiredLogs = await this.prisma.auditLog.findMany({
        where: { createdAt: { lt: threshold } },
        select: { id: true },
        take: 1000,
      });

      if (expiredLogs.length === 0) break;

      const ids = expiredLogs.map((l) => l.id);
      await this.prisma.auditLog.deleteMany({
        where: { id: { in: ids } },
      });

      deletedCount += ids.length;
    }

    this.logger.log(
      `Audit log retention cleanup completed. Purged ${deletedCount} logs.`,
    );
    return deletedCount;
  }
}
