import { spawn, ChildProcess, execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { createHmac } from 'crypto';
import { PrismaClient } from '@prisma/client';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000/api';

let passed = 0;
let failed = 0;
let serverProcess: ChildProcess | null = null;
let logBuffer = '';

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function generateMockJwt(
  sub: string,
  email: string,
  role: string,
  secret: string,
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub,
    email,
    role,
    iss: 'supabase',
    aud: 'authenticated',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    user_metadata: { full_name: 'Test Tester' },
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

  let key: string | Buffer = secret;
  if (secret.length > 40 && secret.endsWith('=')) {
    try {
      key = Buffer.from(secret, 'base64');
    } catch {}
  }

  const hmac = createHmac('sha256', key);
  hmac.update(`${headerB64}.${payloadB64}`);
  const signatureB64 = hmac.digest('base64url');

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

async function cleanupAndExit() {
  if (serverProcess && serverProcess.pid) {
    console.log('\n🧹 Terminating API server process...');
    try {
      execSync(`taskkill /pid ${serverProcess.pid} /f /t`, { stdio: 'ignore' });
    } catch (e) {}
  }

  if (failed > 0) {
    console.log('\n=== API Server Logs (for debugging) ===');
    console.log(logBuffer);
    console.log('========================================\n');
  }

  console.log('\n==================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('==================================================');

  process.exit(failed > 0 ? 1 : 0);
}

async function buildApp(): Promise<void> {
  console.log('🔨 Building NestJS app...');
  return new Promise<void>((resolve, reject) => {
    const build = spawn('npx', ['nest', 'build'], {
      cwd: path.join(__dirname),
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let buildOutput = '';
    build.stdout?.on('data', (d) => {
      buildOutput += d.toString();
    });
    build.stderr?.on('data', (d) => {
      buildOutput += d.toString();
    });

    build.on('close', (code) => {
      if (code === 0) {
        console.log('✓ Build completed successfully!\n');
        resolve();
      } else {
        console.error(`Build output:\n${buildOutput}`);
        reject(new Error(`Build failed with exit code ${code}`));
      }
    });
  });
}

async function main(): Promise<void> {
  console.log('==================================================');
  console.log('    BETTERCV SPRINT 5E.4: INTEGRATION TESTS        ');
  console.log('==================================================\n');

  // 0. Kill lingering processes on port 4000
  try {
    execSync(
      'powershell -Command "Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"',
      { stdio: 'ignore' },
    );
    await new Promise((r) => setTimeout(r, 500));
  } catch {}

  // 1. Build
  await buildApp();

  // 2. Spawn server
  console.log('🔄 Spawning API server in production mode...');
  serverProcess = spawn('node', ['dist/main.js'], {
    cwd: path.join(__dirname),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      ALLOW_TEST_ENDPOINTS: 'true',
      SKIP_THUMBNAIL_QUEUE: 'false', // Enable thumbnail worker in production test
      THUMBNAIL_DEBOUNCE_MS: '0',     // Process immediately without delay
    },
  });

  serverProcess.stdout!.on('data', (data) => {
    logBuffer += data.toString('utf8');
  });

  serverProcess.stderr!.on('data', (data) => {
    logBuffer += data.toString('utf8');
  });

  const jwtSecret =
    process.env.SUPABASE_JWT_SECRET ||
    '2THu1FXMlj8ChRX4gaHY5k1lm1CFRm5ySKtveJk7GLxdnsNAglhzS1UoR0k18VJba9NyX5N1XGx91G2A2md8og==';

  console.log('⏳ Waiting for API to be reachable...');
  let retries = 0;
  while (retries < 30) {
    try {
      const res = await fetch(`${API_BASE}/health/live`);
      if (res.status === 200) {
        console.log('✓ API Server is live!\n');
        break;
      }
    } catch (err) {}
    retries++;
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (retries === 30) {
    console.error('❌ Timeout waiting for server.');
    await cleanupAndExit();
    return;
  }

  // Seed the test user into the database
  const prisma = new PrismaClient();
  await prisma.user.upsert({
    where: { supabaseId: 'test-user-id' },
    update: { role: 'PRO' },
    create: {
      email: 'test@example.com',
      fullName: 'Test User',
      supabaseId: 'test-user-id',
      role: 'PRO',
    },
  });
  await prisma.$disconnect();

  const token = generateMockJwt('test-user-id', 'test@example.com', 'PRO', jwtSecret);

  // ────────────────────────────────────────────────────────────────
  // Test 1: Create CV & Verify PENDING thumbnail status
  // ────────────────────────────────────────────────────────────────
  console.log('🧪 Running Test 1: Create CV & Verify PENDING Status...');
  const createRes = await fetch(`${API_BASE}/cvs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: `Test CV ${Date.now()}`,
      locale: 'en',
      templateId: 'standard-ats',
    }),
  });

  assert(createRes.status === 201 || createRes.status === 200, 'CV created successfully');
  const createResJson = (await createRes.json()) as any;
  const cv = createResJson.data;
  assert(cv !== null && cv !== undefined, 'Response data is not null');
  assert(cv.id !== undefined, 'CV has a valid ID');
  assert(cv.thumbnailStatus === 'PENDING', 'Created CV has thumbnailStatus = PENDING');

  // Add PROFILE section
  console.log('  Adding PROFILE section...');
  const sec1Res = await fetch(`${API_BASE}/cvs/${cv.id}/sections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: 'PROFILE',
      order: 1,
      content: {
        fullName: 'Nguyen Van A',
        email: 'a@example.com',
        phone: '0987654321',
      },
    }),
  });
  assert(sec1Res.status === 201 || sec1Res.status === 200, 'PROFILE section added successfully');

  // Add SUMMARY section
  console.log('  Adding SUMMARY section...');
  const sec2Res = await fetch(`${API_BASE}/cvs/${cv.id}/sections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: 'SUMMARY',
      order: 2,
      content: {
        text: 'Experienced software developer.',
      },
    }),
  });
  assert(sec2Res.status === 201 || sec2Res.status === 200, 'SUMMARY section added successfully');

  // Add EXPERIENCE section (this will satisfy isRenderableCv and trigger the thumbnail enqueuing!)
  console.log('  Adding EXPERIENCE section (should trigger thumbnail enqueue)...');
  const sec3Res = await fetch(`${API_BASE}/cvs/${cv.id}/sections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: 'EXPERIENCE',
      order: 3,
      content: {
        items: [
          {
            company: 'Company A',
            position: 'Developer',
            duration: '2020 - Present',
            description: 'Building stuff with Node.js',
          },
        ],
      },
    }),
  });
  assert(sec3Res.status === 201 || sec3Res.status === 200, 'EXPERIENCE section added successfully');

  // ────────────────────────────────────────────────────────────────
  // Test 2: Verify local storage file and serving endpoint
  // ────────────────────────────────────────────────────────────────
  console.log('\n🧪 Running Test 2: Wait for Thumbnail Worker & Serving Endpoint...');
  
  // Wait for BullMQ worker to generate thumbnail (debounce is 0ms, should take 2-4s)
  console.log('  ⏳ Waiting for BullMQ worker and Puppeteer rendering...');
  await new Promise((r) => setTimeout(r, 6000));

  const getCvRes = await fetch(`${API_BASE}/cvs/${cv.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const getCvResJson = (await getCvRes.json()) as any;
  const updatedCv = getCvResJson.data;

  assert(updatedCv.thumbnailStatus === 'READY', 'CV thumbnail status updated to READY');
  assert(updatedCv.thumbnailUrl !== null, `thumbnailUrl populated: ${updatedCv.thumbnailUrl}`);

  // Fetch local WebP file directly
  const localWebpPath = path.join(process.cwd(), 'storage', 'thumbnails', `${cv.id}.webp`);
  assert(fs.existsSync(localWebpPath), 'WebP thumbnail file exists on local filesystem');

  // Fetch via serving endpoint
  const getThumbnailRes = await fetch(updatedCv.thumbnailUrl);
  assert(getThumbnailRes.status === 200, 'Public thumbnail streaming endpoint returns 200 OK');
  assert(
    getThumbnailRes.headers.get('content-type') === 'image/webp',
    'Thumbnail endpoint serves content-type: image/webp',
  );

  // Fetch via local serving endpoint directly to verify the unauthenticated local streaming route
  const localServingUrl = `${API_BASE}/cvs/thumbnails/${cv.id}.webp`;
  const getLocalThumbnailRes = await fetch(localServingUrl);
  assert(getLocalThumbnailRes.status === 200, 'Local thumbnail streaming endpoint returns 200 OK');
  assert(
    getLocalThumbnailRes.headers.get('content-type') === 'image/webp',
    'Local thumbnail endpoint serves content-type: image/webp',
  );

  // ────────────────────────────────────────────────────────────────
  // Test 3: Real ATS persistence & version metadata
  // ────────────────────────────────────────────────────────────────
  console.log('\n🧪 Running Test 3: Real ATS Persistence & Version Metadata...');
  
  // First evaluate CV against a job description
  const evalRes = await fetch(`${API_BASE}/ats/score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      cvId: cv.id,
      jobDescription: 'Looking for a Software Engineer with Node.js and TypeScript experience. Must understand databases.',
    }),
  });

  assert(evalRes.status === 201 || evalRes.status === 200, 'ATS evaluation triggered successfully');
  const evalDataJson = (await evalRes.json()) as any;
  const evalData = evalDataJson.data.data;
  assert(evalData.score > 0, `Real ATS match score computed: ${evalData.score}%`);

  // Reload CV and verify persisted score & scannedAt
  const getCvRes2 = await fetch(`${API_BASE}/cvs/${cv.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const getCvRes2Json = (await getCvRes2.json()) as any;
  const scannedCv = getCvRes2Json.data;
  assert(scannedCv.atsScore === evalData.score, `persisted atsScore matches evaluated score: ${scannedCv.atsScore}%`);
  assert(scannedCv.atsScannedAt !== null, `atsScannedAt populated: ${scannedCv.atsScannedAt}`);
  assert(scannedCv.atsVersion === '1.0.0', `atsVersion populated correctly: ${scannedCv.atsVersion}`);

  // ────────────────────────────────────────────────────────────────
  // Test 4: CV edits set atsScannedAt to null & thumbnailStatus to PENDING (preserves atsScore)
  // ────────────────────────────────────────────────────────────────
  console.log('\n🧪 Running Test 4: Edit CV & Verify Stale Scan + Pending status...');

  // Update CV title or contents
  const updateRes = await fetch(`${API_BASE}/cvs/${cv.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: `Updated Test CV ${Date.now()}`,
      locale: 'en',
      templateId: 'standard-ats',
      version: scannedCv.version,
    }),
  });

  assert(updateRes.status === 200, 'CV updated successfully');
  const updateResJson = (await updateRes.json()) as any;
  const editedCv = updateResJson.data;

  assert(editedCv.atsScore === scannedCv.atsScore, 'atsScore remains preserved after editing');
  assert(editedCv.atsScannedAt === null, 'atsScannedAt reset to null to mark scan as stale');
  assert(editedCv.thumbnailStatus === 'PENDING', 'thumbnailStatus reset to PENDING on CV edit');

  // ────────────────────────────────────────────────────────────────
  // Test 5: Endpoint path traversal protection
  // ────────────────────────────────────────────────────────────────
  console.log('\n🧪 Running Test 5: Verify Path Traversal Protection on Thumbnail Endpoint...');
  const badUrl = `${API_BASE}/cvs/thumbnails/invalid_id..webp`;
  const badUrlRes = await fetch(badUrl);
  assert(badUrlRes.status === 400, `Path traversal request is blocked with 400 Bad Request (got ${badUrlRes.status})`);
  const badUrlJson = (await badUrlRes.json()) as any;
  const errorMsg = badUrlJson.message || badUrlJson.error?.message || '';
  assert(errorMsg.includes('Invalid thumbnail ID format'), 'Error response contains correct traversal message');

  await cleanupAndExit();
}

main().catch(async (err) => {
  console.error('Fatal error running tests:', err);
  await cleanupAndExit();
});
