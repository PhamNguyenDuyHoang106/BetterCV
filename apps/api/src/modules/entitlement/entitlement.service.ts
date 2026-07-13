import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Feature } from '@acv/shared';
import { PolicyService } from './policy.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { FeatureLockedException } from '../../core/exceptions/feature-locked.exception';
import { RequestContextStore } from '../../core/context/request-context.store';

@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);
  private readonly cache = new Map<string, {
    planTier: string;
    planName: string;
    features: string[];
    subscriptionUpdatedAt: string;
    policyHash: string;
    expiresAt: number;
  }>();

  private featureFlags: Record<string, boolean> = {};

  constructor(
    private readonly policyService: PolicyService,
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {
    this.loadFeatureFlags();
  }

  private loadFeatureFlags() {
    for (const feat of Object.values(Feature)) {
      const envKey = `FEATURE_FLAG_${feat.replace('.', '_').toUpperCase()}`;
      const flagVal = process.env[envKey];
      // Default to true unless explicitly configured as 'false'
      this.featureFlags[feat] = flagVal !== 'false';
    }
    this.logger.log('Entitlement feature flags loaded into memory.');
  }

  async getEntitlements(userId: string) {
    const dates = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        updatedAt: true,
        subscriptions: {
          where: { status: { in: ['active', 'trialing'] } },
          select: { updatedAt: true },
        },
      },
    });

    if (!dates) {
      throw new ForbiddenException('User not found');
    }

    const subUpdatedAt = dates.subscriptions[0]?.updatedAt || new Date(0);
    const policyVersion = this.policyService.getPolicyVersion();

    const cached = this.cache.get(userId);
    const now = Date.now();

    if (
      cached &&
      cached.expiresAt > now &&
      cached.policyHash === policyVersion &&
      cached.subscriptionUpdatedAt === subUpdatedAt.toISOString()
    ) {
      return {
        planTier: cached.planTier,
        planName: cached.planName,
        features: cached.features,
        subscriptionUpdatedAt: cached.subscriptionUpdatedAt,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: { in: ['active', 'trialing'] } },
          include: { plan: true },
        },
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    let activePlan: any;
    let subscriptionUpdatedAt = new Date(0).toISOString();

    if (user.subscriptions.length > 0) {
      const activeSub = user.subscriptions[0];
      activePlan = activeSub.plan;
      subscriptionUpdatedAt = activeSub.updatedAt.toISOString();
    } else {
      activePlan = await this.prisma.plan.findUnique({
        where: { tier: 'FREE' },
      });
      if (!activePlan) {
        throw new NotFoundException('Default FREE plan not found in database');
      }
    }

    const planTier = activePlan.tier;
    const planName = activePlan.name;

    const features: string[] = [];
    for (const feat of Object.values(Feature)) {
      if (this.policyService.isFeatureAllowed(planTier, feat)) {
        features.push(feat);
      }
    }

    this.cache.set(userId, {
      planTier,
      planName,
      features,
      subscriptionUpdatedAt,
      policyHash: policyVersion,
      expiresAt: now + 5 * 60 * 1000, // 5 minutes TTL
    });

    return {
      planTier,
      planName,
      features,
      subscriptionUpdatedAt,
    };
  }

  async hasFeature(userId: string, feature: Feature): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'ADMIN') return true;
    if (this.featureFlags[feature] === false) return false;

    const entitlements = await this.getEntitlements(userId);
    return entitlements.features.includes(feature);
  }

  async assertFeature(userId: string, feature: Feature, context?: any): Promise<void> {
    const startTime = Date.now();
    let isAllowed = false;
    try {
      isAllowed = await this.hasFeature(userId, feature);
    } catch (err) {
      isAllowed = false;
    }
    const latency = Date.now() - startTime;

    if (!isAllowed) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscriptions: {
            where: { status: { in: ['active', 'trialing'] } },
            include: { plan: true },
          },
        },
      });

      const currentPlan = user?.subscriptions[0]?.plan?.tier || 'FREE';
      const { FEATURE_DEFINITIONS } = await import('@acv/shared');
      const requiredPlan = FEATURE_DEFINITIONS[feature]?.requiredPlan || 'PRO';

      await this.logBlockedEvent(userId, feature, currentPlan, requiredPlan, latency, context);
      throw new FeatureLockedException(feature, requiredPlan);
    }
  }

  invalidateCache(userId: string): void {
    this.cache.delete(userId);
    this.logger.log(`Entitlements cache invalidated for user: ${userId}`);
  }

  private async logBlockedEvent(
    userId: string,
    feature: Feature,
    currentPlan: string,
    requiredPlan: string,
    decisionLatencyMs: number,
    context?: any,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, subscriptions: { select: { id: true } } },
      });
      const subscriptionId = user?.subscriptions[0]?.id || null;

      const requestId = RequestContextStore.get('requestId') || null;
      const traceId = RequestContextStore.get('traceId') || null;

      await this.auditLog.logEvent({
        actorUserId: userId,
        actorType: user?.role === 'ADMIN' ? 'ADMIN' : 'USER',
        eventType: 'FEATURE_BLOCKED' as any,
        action: `Attempted to access locked feature: ${feature}`,
        resourceType: 'Feature',
        resourceId: feature,
        severity: 'WARNING',
        newValue: {
          feature,
          currentPlan,
          requiredPlan,
          reason: 'FEATURE_LOCKED',
          decisionLatencyMs,
          requestId,
          traceId,
          subscriptionId,
          policyVersion: this.policyService.getPolicyVersion(),
          ...context,
        },
      });
    } catch (err) {
      this.logger.error('Failed to log blocked entitlement audit event:', err);
    }
  }
}
