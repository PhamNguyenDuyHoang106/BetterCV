import { Module, Global } from '@nestjs/common';
import { PolicyService } from './policy.service';
import { StaticPolicyProvider } from './static-policy.provider';
import { EntitlementService } from './entitlement.service';
import { UsageService } from './usage.service';
import { CvUsageProvider } from './providers/cv-usage.provider';
import { AtsScanUsageProvider } from './providers/ats-usage.provider';
import { AuditModule } from '../audit/audit.module';

@Global()
@Module({
  imports: [AuditModule],
  providers: [
    {
      provide: 'PolicyProvider',
      useClass: StaticPolicyProvider,
    },
    PolicyService,
    EntitlementService,
    CvUsageProvider,
    AtsScanUsageProvider,
    UsageService,
  ],
  exports: [PolicyService, EntitlementService, UsageService],
})
export class EntitlementModule {}
