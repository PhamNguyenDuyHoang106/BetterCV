import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../core/decorators';
import { RolesGuard } from '../../core/guards';
import { PrismaService } from '../../database/prisma.service';
import { AuditSeverity, AuditEventType, AuditActorType } from '@prisma/client';
import { AuditLogService } from './audit.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
@Controller('admin/audit-logs')
export class AuditController {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  @Post('test-purge')
  async testPurge() {
    if (process.env.ALLOW_TEST_ENDPOINTS !== 'true') {
      throw new ForbiddenException('Test endpoints are disabled');
    }
    const count = await this.auditLogService.purgeExpiredLogs();
    return { purged: count };
  }

  @Get()
  async getAuditLogs(
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
    @Query('actorUserId') actorUserId?: string,
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
    @Query('action') action?: string,
    @Query('severity') severity?: AuditSeverity,
    @Query('eventType') eventType?: AuditEventType,
    @Query('actorType') actorType?: AuditActorType,
    @Query('startDate') startDateRaw?: string,
    @Query('endDate') endDateRaw?: string,
    @Query('sortBy') sortBy = 'createdAt',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const page = Math.max(1, parseInt(pageRaw || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(limitRaw || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (actorUserId) {
      where.actorUserId = actorUserId;
    }
    if (resourceType) {
      where.resourceType = resourceType;
    }
    if (resourceId) {
      where.resourceId = resourceId;
    }
    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }
    if (severity) {
      where.severity = severity;
    }
    if (eventType) {
      where.eventType = eventType;
    }
    if (actorType) {
      where.actorType = actorType;
    }

    if (startDateRaw || endDateRaw) {
      where.createdAt = {};
      if (startDateRaw) {
        where.createdAt.gte = new Date(startDateRaw);
      }
      if (endDateRaw) {
        where.createdAt.lte = new Date(endDateRaw);
      }
    }

    // Validate sort fields to prevent Prisma query failures
    const allowedSortFields = ['createdAt', 'severity', 'action', 'eventType'];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';
    const finalSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { [finalSortBy]: finalSortOrder },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
