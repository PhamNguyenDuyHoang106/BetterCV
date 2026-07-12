import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { EntitlementService } from '../../src/modules/entitlement/entitlement.service';
import { UsageService } from '../../src/modules/entitlement/usage.service';
import { AuthController } from '../../src/modules/auth/auth.controller';
import { Feature, QuotaKey } from '@acv/shared';
import { UserRole } from '@prisma/client';

let app: INestApplication;
let prisma: PrismaService;
let entitlementService: EntitlementService;
let usageService: UsageService;
let authController: AuthController;
let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${label}`);
    failed++;
  }
}

async function setup() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();

  prisma = app.get(PrismaService);
  entitlementService = await app.resolve(EntitlementService);
  usageService = await app.resolve(UsageService);
  authController = await app.resolve(AuthController);
}

async function createTestUser(email: string, role: UserRole) {
  const supabaseId = `sb-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const user = await prisma.user.create({
    data: {
      email,
      fullName: `Test ${role} User`,
      role,
      supabaseId,
    },
  });
  return user;
}

async function upgradeUserToPlan(userId: string, tier: 'PRO' | 'PREMIUM') {
  const plan = await prisma.plan.findUnique({
    where: { tier },
  });
  if (!plan) throw new Error(`Plan not found for tier: ${tier}`);

  await prisma.subscription.deleteMany({ where: { userId } });

  await prisma.subscription.create({
    data: {
      userId,
      planId: plan.id,
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });
}

async function cleanupUser(userId: string) {
  await prisma.cv.deleteMany({ where: { userId } });
  await prisma.subscription.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}

async function testEntitlementsResolution() {
  console.log('\n🔐 Test 1: Resolution of capabilities and rendering watermarks');

  const freeUser = await createTestUser('free-test-e2e@bettercv.vn', 'FREE');
  const premiumUser = await createTestUser('premium-test-e2e@bettercv.vn', 'PREMIUM');

  try {
    // Free remains default (no subscription)
    const freePayload = await authController.getEntitlements({
      sub: freeUser.supabaseId!,
      email: freeUser.email,
    } as any);

    assert(freePayload.plan.tier === 'FREE', 'Free user resolves plan tier as FREE');
    assert(freePayload.features.includes(Feature.AI_REWRITE) === false, 'Free user does NOT have AI rewrite');
    assert(freePayload.features.includes(Feature.PREMIUM_TEMPLATE) === false, 'Free user does NOT have premium templates');
    assert(freePayload.rendering.watermark.enabled === true, 'Free user has watermark ENABLED');

    // Premium user gets a subscription
    await upgradeUserToPlan(premiumUser.id, 'PREMIUM');

    const premiumPayload = await authController.getEntitlements({
      sub: premiumUser.supabaseId!,
      email: premiumUser.email,
    } as any);

    assert(premiumPayload.plan.tier === 'PREMIUM', 'Premium user resolves plan tier as PREMIUM');
    assert(premiumPayload.features.includes(Feature.AI_REWRITE) === true, 'Premium user has AI rewrite enabled');
    assert(premiumPayload.features.includes(Feature.PREMIUM_TEMPLATE) === true, 'Premium user has premium templates enabled');
    assert(premiumPayload.rendering.watermark.enabled === false, 'Premium user has watermark DISABLED');
  } finally {
    await cleanupUser(freeUser.id);
    await cleanupUser(premiumUser.id);
  }
}

async function testCvQuotaLock() {
  console.log('\n📄 Test 2: CV Quota Lock enforcement');

  const freeUser = await createTestUser('free-cv-quota-e2e@bettercv.vn', 'FREE');

  try {
    // Simulate request 1: initial check (no CVs yet)
    const req1Usage = await app.resolve(UsageService);
    const isAllowedInitial = await req1Usage.hasQuota(freeUser.id, QuotaKey.MAX_CV);
    assert(isAllowedInitial === true, 'Initially allowed to create CV');

    // Simulate 3 CV creations in the DB
    for (let i = 0; i < 3; i++) {
      await prisma.cv.create({
        data: {
          userId: freeUser.id,
          title: `CV ${i + 1}`,
        },
      });
    }

    // Simulate request 2: fresh instance sees updated DB state
    const req2Usage = await app.resolve(UsageService);
    const isAllowedAfter3 = await req2Usage.hasQuota(freeUser.id, QuotaKey.MAX_CV);
    assert(isAllowedAfter3 === false, 'Blocked after creating 3 CVs');

    // Simulate request 3: assertQuota on fresh instance
    const req3Usage = await app.resolve(UsageService);
    let threw = false;
    try {
      await req3Usage.assertQuota(freeUser.id, QuotaKey.MAX_CV);
    } catch (e: any) {
      threw = true;
      assert(e.status === 403, `assertQuota threw ForbiddenException (status 403)`);
    }
    assert(threw === true, 'assertQuota correctly threw error on quota limit hit');

  } finally {
    await cleanupUser(freeUser.id);
  }
}

async function testCacheInvalidation() {
  console.log('\n⚡ Test 3: Cache invalidation and plan upgrades');

  const user = await createTestUser('upgrade-test-e2e@bettercv.vn', 'FREE');

  try {
    const initial = await entitlementService.getEntitlements(user.id);
    assert(initial.planTier === 'FREE', 'Cached initial plan as FREE');

    // Upgrade the user by assigning a PRO subscription
    await upgradeUserToPlan(user.id, 'PRO');

    entitlementService.invalidateCache(user.id);

    const updated = await entitlementService.getEntitlements(user.id);
    assert(updated.planTier === 'PRO', 'Resolved as PRO after invalidating cache');
    assert(updated.features.includes(Feature.AI_REWRITE) === true, 'PRO user now has AI rewrite enabled');

  } finally {
    await cleanupUser(user.id);
  }
}

async function main() {
  console.log('=======================================================');
  console.log('        BetterCV Entitlements E2E Test Suite');
  console.log('=======================================================');

  try {
    await setup();

    await testEntitlementsResolution();
    await testCvQuotaLock();
    await testCacheInvalidation();

  } catch (err: any) {
    console.error(`\n💥 Setup/execution error: ${err.message}`);
    failed++;
  } finally {
    if (app) await app.close();
  }

  console.log('\n=======================================================');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('=======================================================');

  process.exit(failed > 0 ? 1 : 0);
}

main();
