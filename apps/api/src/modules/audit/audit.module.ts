import { Module, Global } from '@nestjs/common';
import { AuditLogService } from './audit.service';

@Global()
@Module({
  controllers: [],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditModule {}
