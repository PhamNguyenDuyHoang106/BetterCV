/**
 * E2E Accounting Validation for Phase 5C: Token, Cost & Usage Analytics
 *
 * Tests:
 * 1. Direct AiUsageLog insertion + pricing calculation
 * 2. Fire-and-forget safety (no-throw guarantee)
 * 3. RequestContextStore correlation
 * 4. Pricing constant validation
 *
 * Run: npx ts-node test/e2e/ai-usage-analytics.e2e-spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { AiUsageService } from '../../src/modules/ai/ai-usage.service';
import { AiFeature, AiProvider } from '@prisma/client';
import { RequestContextStore } from '../../src/core/context/request-context.store';

let app: INestApplication;
let prisma: PrismaService;
let aiUsageService: AiUsageService;
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
  aiUsageService = app.get(AiUsageService);
}

async function cleanupTestData() {
  // Clean up any test records we created
  await prisma.aiUsageLog.deleteMany({
    where: { model: 'test-model-e2e' },
  });
}

// ── Test 1: Direct insertion with correct pricing ──────────────
async function testDirectInsertion() {
  console.log('\n📊 Test 1: Direct AiUsageLog insertion');

  // Create a test user
  const testUser = await prisma.user.findFirst({ select: { id: true } });
  if (!testUser) {
    console.log('  ⚠️  No users found in database, skipping user-linked tests');
    return;
  }

  await prisma.aiUsageLog.create({
    data: {
      userId: testUser.id,
      feature: AiFeature.CAREER_COACH,
      provider: AiProvider.OPENAI,
      model: 'test-model-e2e',
      promptTokens: 500,
      completionTokens: 200,
      totalTokens: 700,
      estimatedCostUsd: 0.000195, // (500*0.15 + 200*0.60) / 1_000_000
      requestId: 'test-req-001',
      success: true,
    },
  });

  const record = await prisma.aiUsageLog.findFirst({
    where: { requestId: 'test-req-001', model: 'test-model-e2e' },
  });

  assert(record !== null, 'Record was created');
  assert(record?.feature === 'CAREER_COACH', 'Feature enum is correct');
  assert(record?.provider === 'OPENAI', 'Provider enum is correct');
  assert(record?.promptTokens === 500, 'Prompt tokens stored correctly');
  assert(
    record?.completionTokens === 200,
    'Completion tokens stored correctly',
  );
  assert(record?.totalTokens === 700, 'Total tokens stored correctly');
  assert(record?.success === true, 'Success flag stored correctly');
}

// ── Test 2: Fire-and-forget safety ─────────────────────────────
async function testFireAndForgetSafety() {
  console.log('\n🔥 Test 2: Fire-and-forget safety (no-throw guarantee)');

  // recordUsage should never throw, even with invalid data
  let didThrow = false;
  try {
    // Pass null userId which should cause a DB error but not throw
    aiUsageService.recordUsage({
      userId: undefined,
      feature: AiFeature.OCR,
      model: 'test-model-e2e',
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      success: true,
    });
    // Give it time to execute asynchronously
    await new Promise((r) => setTimeout(r, 500));
  } catch {
    didThrow = true;
  }

  assert(!didThrow, 'recordUsage did not throw synchronously');

  // Verify the record was actually created (userId is nullable)
  const record = await prisma.aiUsageLog.findFirst({
    where: {
      feature: AiFeature.OCR,
      model: 'test-model-e2e',
      userId: null,
    },
  });
  assert(record !== null, 'Record created even with null userId');
}

// ── Test 3: RequestContextStore correlation ────────────────────
async function testRequestContextCorrelation() {
  console.log('\n🔗 Test 3: RequestContextStore correlation');

  const testRequestId = 'test-correlation-id-e2e';

  await RequestContextStore.run({ requestId: testRequestId }, async () => {
    aiUsageService.recordUsage({
      feature: AiFeature.CV_REWRITE,
      model: 'test-model-e2e',
      usage: { promptTokens: 200, completionTokens: 100, totalTokens: 300 },
      success: true,
    });
    // Wait for async persistence
    await new Promise((r) => setTimeout(r, 500));
  });

  const record = await prisma.aiUsageLog.findFirst({
    where: { requestId: testRequestId, model: 'test-model-e2e' },
  });

  assert(record !== null, 'Record exists with correlation requestId');
  assert(
    record?.requestId === testRequestId,
    `requestId matches: ${record?.requestId}`,
  );
}

// ── Test 4: Pricing constant validation ────────────────────────
async function testPricingConstants() {
  console.log('\n💰 Test 4: Pricing constants validation');

  // Dynamic import to validate exports
  const { MODEL_PRICING, DEFAULT_PRICING } =
    await import('../../src/modules/ai/constants/ai-pricing.constants');

  assert(
    MODEL_PRICING['gpt-4o-mini'] !== undefined,
    'gpt-4o-mini pricing exists',
  );
  assert(
    MODEL_PRICING['gpt-4o-mini'].inputUsdPer1M === 0.15,
    'gpt-4o-mini input price is $0.15/1M',
  );
  assert(
    MODEL_PRICING['gpt-4o-mini'].outputUsdPer1M === 0.6,
    'gpt-4o-mini output price is $0.60/1M',
  );
  assert(MODEL_PRICING['gpt-4o'] !== undefined, 'gpt-4o pricing exists');
  assert(
    DEFAULT_PRICING.inputUsdPer1M === 0.15,
    'Default fallback input price correct',
  );
  assert(
    DEFAULT_PRICING.provider === 'OPENAI',
    'Default fallback provider is OPENAI',
  );
}

// ── Main ───────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Phase 5C E2E: Token, Cost & Usage Analytics');
  console.log('═══════════════════════════════════════════════════════');

  try {
    await setup();

    await testPricingConstants();
    await testDirectInsertion();
    await testFireAndForgetSafety();
    await testRequestContextCorrelation();

    await cleanupTestData();
  } catch (err: any) {
    console.error(`\n💥 Setup/teardown error: ${err.message}`);
    failed++;
  } finally {
    if (app) await app.close();
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════');

  process.exit(failed > 0 ? 1 : 0);
}

main();
