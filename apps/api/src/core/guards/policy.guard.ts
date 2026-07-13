import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Feature, QuotaKey } from '@acv/shared';
import { EntitlementService } from '../../modules/entitlement/entitlement.service';
import { UsageService } from '../../modules/entitlement/usage.service';
import { PrismaService } from '../../database/prisma.service';
import { REQUIRE_FEATURE_KEY } from '../decorators/require-feature.decorator';
import { REQUIRE_QUOTA_KEY } from '../decorators/require-quota.decorator';

@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlementService: EntitlementService,
    private readonly usageService: UsageService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<Feature>(
      REQUIRE_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredQuota = this.reflector.getAllAndOverride<QuotaKey>(
      REQUIRE_QUOTA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature && !requiredQuota) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.sub) {
      return false;
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { supabaseId: user.sub },
      select: { id: true },
    });

    if (!dbUser) {
      return false;
    }

    if (requiredFeature) {
      await this.entitlementService.assertFeature(dbUser.id, requiredFeature, {
        endpoint: request.url,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });
    }

    if (requiredQuota) {
      await this.usageService.assertQuota(dbUser.id, requiredQuota);
    }

    return true;
  }
}
