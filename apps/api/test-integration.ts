import { PrismaClient } from '@prisma/client';
import { AtsService } from './src/modules/ats/ats.service';
import { CvService } from './src/modules/cv/cv.service';

const prisma = new PrismaClient();
let runPromptCount = 0;
const mockAiService = {
  runPrompt: async (supabaseId: string, promptKey: string, payload: any, temp: number) => {
    runPromptCount++;
    return JSON.stringify({
      semanticScore: 85,
      keywordScore: 80,
      experienceScore: 75,
      skillsScore: 90,
      findings: ['CV matches job requirements very well.', 'Experience matches seniority level.'],
      missingKeywords: ['Redis', 'Docker'],
      recommendations: [
        {
          title: 'Bổ sung Docker',
          description: 'Nên thêm kỹ năng Docker vào CV vì JD yêu cầu.',
          category: 'keyword',
          severity: 'medium',
          actionable: true,
        },
        {
          title: 'Cải thiện mô tả kinh nghiệm',
          description: 'Nên mô tả rõ hơn về dự án Backend.',
          category: 'experience',
          severity: 'low',
          actionable: false,
        }
      ]
    });
  }
};

// Instantiate services directly with the Prisma client, mimicking NestJS dependency injection
const atsService = new AtsService(prisma as any, mockAiService as any);
const cvService = new CvService(prisma as any, null as any, null as any);

async function runTests() {
  console.log('\x1b[36m==================================================\x1b[0m');
  console.log('\x1b[36m   BETTERCV SPRINT 5D: INTEGRATION TESTS SUITE   \x1b[0m');
  console.log('\x1b[36m==================================================\x1b[0m\n');

  let testUser: any = null;
  let testCv: any = null;

  try {
    // 1. Setup: Create test user and a blank test CV
    console.log('🔄 Setting up isolated integration test environment...');
    testUser = await prisma.user.upsert({
      where: { email: 'architect-test@bettercv.io' },
      update: {},
      create: {
        email: 'architect-test@bettercv.io',
        fullName: 'Architect Test User',
        supabaseId: 'supabase-architect-test-uid',
        role: 'FREE',
      },
    });

    testCv = await prisma.cv.create({
      data: {
        userId: testUser.id,
        title: 'Architect Integration Test Resume',
        locale: 'vi',
      },
    });

    console.log(`✓ Established Test User ID: ${testUser.id}`);
    console.log(`✓ Established Test CV ID: ${testCv.id}\n`);

    // ─── TEST 1: ATS Retention 50 scans limit ───
    console.log('🧪 Running Test 1: ATS Scan Retention (Insert 60 scans, verify capped at 50)...');
    
    // Perform 60 sequential scans to trigger retention threshold
    const totalScansToInsert = 60;
    const expectedCappedCount = 50;

    for (let i = 1; i <= totalScansToInsert; i++) {
      const dummyJobDesc = `Nodejs Developer Job Description #${i}\nRequirements:\n- JavaScript\n- Express\n- PostgreSQL\n- Redis`;
      await atsService.evaluateCv(testUser.supabaseId, testCv.id, dummyJobDesc);
      if (i % 10 === 0) {
        console.log(`  └─ Inserted ${i}/${totalScansToInsert} scans...`);
      }
    }

    // Verify scans count in DB
    const finalScanCount = await prisma.atsScan.count({
      where: { cvId: testCv.id },
    });

    console.log(`\n  └─ DB scan count for test CV: ${finalScanCount}`);
    if (finalScanCount === expectedCappedCount) {
      console.log('\x1b[32m  [PASS] ✓ Test 1: ATS Retention successfully capped scans to exactly 50!\x1b[0m\n');
    } else {
      throw new Error(`[FAIL] ✗ Test 1 FAILED: Expected exactly ${expectedCappedCount} scans but found ${finalScanCount} in DB!`);
    }

    // ─── TEST 2: ATS History Ascending Order ───
    console.log('🧪 Running Test 2: ATS History Ascending Order (Verify oldest to newest order for Sparkline)...');

    // Fetch history using same service method as GET /cvs/:id/ats-history
    const historyScans = await cvService.listAtsHistory(testUser.supabaseId, testCv.id);

    console.log(`  └─ listAtsHistory returned ${historyScans.length} scans (capped at 20 max history).`);
    
    // Assert ascending chronological order
    let isChronologicallyAscending = true;
    for (let i = 0; i < historyScans.length - 1; i++) {
      const currentTimestamp = new Date(historyScans[i].createdAt).getTime();
      const nextTimestamp = new Date(historyScans[i + 1].createdAt).getTime();
      
      if (currentTimestamp > nextTimestamp) {
        isChronologicallyAscending = false;
        console.log(`  ✗ Found sorting mismatch at index ${i}: Scan #${i} timestamp (${historyScans[i].createdAt.toISOString()}) is newer than Scan #${i+1} (${historyScans[i+1].createdAt.toISOString()})`);
        break;
      }
    }

    if (isChronologicallyAscending && historyScans.length > 0) {
      console.log('\x1b[32m  [PASS] ✓ Test 2: listAtsHistory successfully returned scans in ascending chronological order!\x1b[0m\n');
    } else {
      throw new Error('[FAIL] ✗ Test 2 FAILED: History scans are not sorted in chronologically ascending order!');
    }

    // ─── TEST 3: Concurrent ATS Scan Retention ───
    console.log('🧪 Running Test 3: Concurrent ATS Scan Retention (Insert 10 concurrent scans)...');
    
    // Perform 10 concurrent evaluations simultaneously (staying within Supabase connection pool size 15)
    await Promise.all(
      Array.from({ length: 10 }).map((_, idx) =>
        atsService.evaluateCv(testUser.supabaseId, testCv.id, `Concurrent Job Desc #${idx}\nRequirements:\n- Node.js\n- API`)
      )
    );

    // Verify scans count in DB after concurrent load is strictly <= 50
    const concurrentScanCount = await prisma.atsScan.count({
      where: { cvId: testCv.id },
    });

    console.log(`  └─ DB scan count after concurrent load: ${concurrentScanCount}`);
    if (concurrentScanCount <= expectedCappedCount) {
      console.log('\x1b[32m  [PASS] ✓ Test 3: Concurrent ATS Retention successfully capped scans below 50!\x1b[0m\n');
    } else {
      throw new Error(`[FAIL] ✗ Test 3 FAILED: Expected scan count to be capped at <= ${expectedCappedCount}, but found ${concurrentScanCount} in DB!`);
    }

    // ─── TEST 4: Invalid AI Response Fallback ───
    console.log('🧪 Running Test 4: Invalid AI Response Fallback (Inject malformed JSON, verify fallback is active)...');
    
    // Mutate mockAiService to return invalid JSON
    const originalRunPrompt = mockAiService.runPrompt;
    mockAiService.runPrompt = async () => {
      return 'Sorry, I cannot analyze this. The CV text is empty or format is unsupported.';
    };

    try {
      const fallbackResult = await atsService.evaluateCv(
        testUser.supabaseId!,
        testCv.id,
        'React and Node Developer Job Description'
      );

      console.log('  └─ Fallback scores:', {
        success: fallbackResult.success,
        overallScore: fallbackResult.data.score,
        findings: fallbackResult.data.findings
      });

      // Verify that the analysis is marked as success: false (degraded) and the score is null
      if (fallbackResult.success === false && fallbackResult.data.score === null) {
        console.log('\x1b[32m  [PASS] ✓ Test 4: Successfully verified graceful degraded fallback returning null score!\x1b[0m\n');
      } else {
        throw new Error(`[FAIL] ✗ Test 4 FAILED: Expected success to be false and score to be null, but got success=${fallbackResult.success} and score=${fallbackResult.data.score}!`);
      }
    } finally {
      // Restore original mock
      mockAiService.runPrompt = originalRunPrompt;
    }

    // ─── TEST 5: Concurrent Scan Deduplication ───
    console.log('🧪 Running Test 5: Concurrent Scan Deduplication (Trigger 5 parallel requests for same CV + JD, verify exactly 1 AI call)...');
    
    // Reset call counter
    runPromptCount = 0;

    // Trigger 5 concurrent requests simultaneously
    const deduplicateJd = 'A completely fresh and unique job description to bypass any existing DB cache check ' + Math.random();
    
    await Promise.all(
      Array.from({ length: 5 }).map(() =>
        atsService.evaluateCv(testUser.supabaseId!, testCv.id, deduplicateJd)
      )
    );

    console.log(`  └─ Completed 5 concurrent requests. AI calls: ${runPromptCount}`);
    
    if (runPromptCount === 1) {
      console.log('\x1b[32m  [PASS] ✓ Test 5: Successfully verified concurrent scan deduplication (only 1 AI call made)!\x1b[0m\n');
    } else {
      throw new Error(`[FAIL] ✗ Test 5 FAILED: Expected exactly 1 AI call for concurrent requests, but got ${runPromptCount}!`);
    }

  } catch (error: any) {
    console.error(`\n\x1b[31m💥 Integration tests failed with error: ${error.message}\x1b[0m\n`);
    process.exit(1);
  } finally {
    // 3. Teardown: Cleanup database to remain 100% pristine
    console.log('🧹 Cleaning up integration test records...');
    if (testCv) {
      await prisma.cv.delete({ where: { id: testCv.id } }).catch(() => {});
      console.log('  └─ Deleted test CV.');
    }
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
      console.log('  └─ Deleted test user.');
    }
    await prisma.$disconnect();
    console.log('\n\x1b[32m==================================================\x1b[0m');
    console.log('\x1b[32m    ALL BETTERCV INTEGRATION TESTS PASSED OK     \x1b[0m');
    console.log('\x1b[32m==================================================\x1b[0m');
  }
}

runTests();
