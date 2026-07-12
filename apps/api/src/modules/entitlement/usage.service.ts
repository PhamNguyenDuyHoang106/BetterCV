import { Injectable, NotFoundException, ForbiddenException, Scope } from '@nestjs/common';
import { QuotaKey } from '@acv/shared';
import { UsageProvider, UsageSnapshot } from './usage-provider.interface';
import { CvUsageProvider } from './providers/cv-usage.provider';
import { AtsScanUsageProvider } from './providers/ats-usage.provider';
import { PolicyService } from './policy.service';
import { PrismaService } from '../../database/prisma.service';

@Injectable({ scope: Scope.REQUEST })
export class UsageService {
  private readonly providers: UsageProvider[];
  private readonly usageCache = new Map<string, UsageSnapshot>();
  private readonly planCache = new Map<string, any>();

  constructor(
    private readonly policyService: PolicyService,
    private readonly prisma: PrismaService,
    private readonly cvUsage: CvUsageProvider,
    private readonly atsUsage: AtsScanUsageProvider,
  ) {
    this.providers = [this.cvUsage, this.atsUsage];
  }

  async getCurrentUsage(userId: string, key: QuotaKey): Promise<UsageSnapshot> {
    const cacheKey = `${userId}:${key}`;
    const cached = this.usageCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const provider = this.providers.find((p) => p.supports(key));
    if (!provider) {
      throw new NotFoundException(`No usage provider registered for quota key: ${key}`);
    }
    const usage = await provider.getCurrentUsage(userId, key);
    this.usageCache.set(cacheKey, usage);
    return usage;
  }

  async hasQuota(userId: string, key: QuotaKey): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === 'ADMIN') return true;

    const activePlan = await this.getActivePlan(userId);
    const limit = this.policyService.getPlanQuota(activePlan, key);

    if (limit === -1) return true;

    const usage = await this.getCurrentUsage(userId, key);
    return usage.used < limit;
  }

  async assertQuota(userId: string, key: QuotaKey): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === 'ADMIN') return;

    const activePlan = await this.getActivePlan(userId);
    const limit = this.policyService.getPlanQuota(activePlan, key);

    if (limit === -1) return;

    const usage = await this.getCurrentUsage(userId, key);
    if (usage.used >= limit) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: `Quota limit of ${limit} for ${key} exceeded.`,
        code: 'QUOTA_EXCEEDED',
        quotaKey: key,
        limit,
        current: usage.used,
        remaining: 0,
        unlimited: false,
        exhausted: true,
      });
    }
  }

  async getActivePlan(userId: string) {
    const cached = this.planCache.get(userId);
    if (cached) {
      return cached;
    }

    const activeSub = await this.prisma.subscription.findFirst({
      where: { userId, status: { in: ['active', 'trialing'] } },
      include: { plan: true },
    });

    let plan: any;
    if (activeSub?.plan) {
      plan = activeSub.plan;
    } else {
      const freePlan = await this.prisma.plan.findUnique({
        where: { tier: 'FREE' },
      });
      if (!freePlan) {
        throw new NotFoundException('Default FREE plan not found in database');
      }
      plan = freePlan;
    }

    this.planCache.set(userId, plan);
    return plan;
  }
}
