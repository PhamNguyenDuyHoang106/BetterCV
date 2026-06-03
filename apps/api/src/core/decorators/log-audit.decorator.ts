import { SetMetadata } from '@nestjs/common';
import { AuditEventType, AuditSeverity } from '@prisma/client';

export interface LogAuditOptions {
  action: string;
  resourceType: string;
  eventType: AuditEventType;
  severity?: AuditSeverity;
}

export const AUDIT_LOG_KEY = 'audit_log';
export const LogAudit = (options: LogAuditOptions) =>
  SetMetadata(AUDIT_LOG_KEY, options);
