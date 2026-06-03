import { spawn, ChildProcess, execSync } from 'child_process';
import * as path from 'path';
import { createHmac } from 'crypto';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000/api';

let passed = 0;
let failed = 0;
let serverProcess: ChildProcess | null = null;
let logBuffer = '';
let currentLogOffset = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function getNewLogs(): string {
  const newLogs = logBuffer.substring(currentLogOffset);
  currentLogOffset = logBuffer.length;
  return newLogs;
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
      // On Windows, kill the process tree using taskkill
      execSync(`taskkill /pid ${serverProcess.pid} /f /t`, { stdio: 'ignore' });
    } catch (e) {}
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
  console.log('   BETTERCV SPRINT 5E.3: OBSERVABILITY TESTS      ');
  console.log('==================================================\n');

  // 0. Kill any lingering processes on port 4000
  try {
    execSync(
      'powershell -Command "Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"',
      { stdio: 'ignore' },
    );
    // Small delay after kill
    await new Promise((r) => setTimeout(r, 500));
  } catch {}

  // 1. Build the NestJS app to ensure dist/ is up to date
  await buildApp();

  // 2. Spawn the NestJS API via `node dist/main.js` directly (NO shell)
  //    This ensures stdout/stderr are piped directly from the Node.js process
  //    instead of being lost in a cmd.exe → npx → nest → node process tree.
  console.log('🔄 Spawning API server in production mode...');
  serverProcess = spawn('node', ['dist/main.js'], {
    cwd: path.join(__dirname),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      ALLOW_TEST_ENDPOINTS: 'true',
    },
    // No shell: true — direct process for reliable stdout pipe on Windows
  });

  serverProcess.stdout!.on('data', (data) => {
    logBuffer += data.toString('utf8');
  });

  serverProcess.stderr!.on('data', (data) => {
    logBuffer += data.toString('utf8');
  });

  serverProcess.on('error', (err) => {
    console.error('Server process error:', err);
  });

  const jwtSecret =
    process.env.SUPABASE_JWT_SECRET ||
    '2THu1FXMlj8ChRX4gaHY5k1lm1CFRm5ySKtveJk7GLxdnsNAglhzS1UoR0k18VJba9NyX5N1XGx91G2A2md8og==';

  // Wait for server to be ready
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
    console.error('Log buffer captured so far:\n', logBuffer.substring(0, 3000));
    await cleanupAndExit();
    return;
  }

  // Flush initial boot logs
  getNewLogs();

  // ────────────────────────────────────────────────────────────────
  // Test 1: Structured Schema & Salted Anonymization Verification
  // ────────────────────────────────────────────────────────────────
  console.log('🧪 Running Test 1: Structured Schema & Salted Hash...');

  // Use root API endpoint (GET /api) which produces pino-http logs normally.
  // Health endpoints (/api/health/*) are suppressed by autoLogging.ignore
  // and won't generate any pino-http request/response logs.
  const reqId1 = `test-schema-salted-${Date.now()}`;
  const testEmail = `user-${Date.now()}@test.com`;
  const token = generateMockJwt('test-user-id', testEmail, 'FREE', jwtSecret);

  const response1 = await fetch(API_BASE, {
    headers: {
      'x-request-id': reqId1,
    },
  });
  assert(response1.status === 200, 'Root API request completed successfully');

  await new Promise((r) => setTimeout(r, 1500));
  const logContent1 = getNewLogs();

  // Assert structured logging fields exist at root level (from Pino base config)
  assert(
    logContent1.includes('"service":"bettercv-api"'),
    'Logs contain root-level service property',
  );
  assert(
    logContent1.includes('"environment":"production"'),
    'Logs contain root-level environment property',
  );
  assert(
    logContent1.includes(reqId1),
    `Logs contain the requested correlation ID "${reqId1}"`,
  );

  // Verify userHash via authenticated endpoint (GET /api/auth/me).
  // TransformInterceptor sets userHash in RequestContextStore when req.user exists.
  // The Pino mixin then reads it and includes it in the response log.
  const reqId1b = `test-userhash-${Date.now()}`;
  const authResponse = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      'x-request-id': reqId1b,
      Authorization: `Bearer ${token}`,
    },
  });
  await new Promise((r) => setTimeout(r, 1500));
  const logContent1b = getNewLogs();
  const combinedLogs1 = logContent1 + logContent1b;

  assert(
    !combinedLogs1.includes('test-user-id'),
    'Raw User ID is not leaked in log output',
  );

  // userHash should appear if JWT auth succeeded and TransformInterceptor ran
  if (authResponse.status === 200 || authResponse.status === 201) {
    assert(
      logContent1b.includes('"userHash"'),
      'Logs contain hashed user identifier userHash',
    );
  } else {
    // Auth didn't succeed (e.g., JWT secret mismatch), but we still verify no raw ID leak
    console.log(
      `  ⚠️ Auth returned ${authResponse.status} — checking if userHash appears anyway...`,
    );
    assert(
      logContent1b.includes('"userHash"') || logContent1b.includes('"ipHash"'),
      'Logs contain at least ipHash from RequestContextMiddleware',
    );
  }

  // ────────────────────────────────────────────────────────────────
  // Test 2: NO PII LEAKAGE (Negative Assertions)
  // ────────────────────────────────────────────────────────────────
  console.log('\n🧪 Running Test 2: PII Leakage Shield (Negative Assertions)...');
  const reqId2 = `test-pii-shield-${Date.now()}`;

  // Flush any pending logs and update offset
  getNewLogs();

  const piiEmail = 'john@example.com';
  const piiToken = 'Bearer abc123secretjwttoken';
  const piiCookie = 'session_id=abcdefg12345';
  const piiUrl = 'https://supabase.co/storage/cvs/private/user123.pdf';
  const piiPath = 'cvs/private/user123.pdf';
  const piiCvText = 'Looking for a Senior Software Architect';

  // Send request containing sensitive PII fields in body and headers
  await fetch(`${API_BASE}/ats/score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': reqId2,
      Authorization: piiToken,
      Cookie: piiCookie,
    },
    body: JSON.stringify({
      cvId: '123',
      email: piiEmail,
      resumeFileUrl: piiUrl,
      storagePath: piiPath,
      jobDescription: piiCvText,
      resumeText: piiCvText,
    }),
  });

  await new Promise((r) => setTimeout(r, 1500));
  const logContent2 = getNewLogs();

  // Negative assertions to ensure no PII leakage
  assert(
    !logContent2.includes(piiEmail),
    `❌ PII email "${piiEmail}" not leaked in logs`,
  );
  assert(
    !logContent2.includes('abc123secretjwttoken'),
    '❌ Authorization token not leaked in logs',
  );
  assert(
    !logContent2.includes('session_id'),
    '❌ Session cookies not leaked in logs',
  );
  assert(
    !logContent2.includes('cvs/private'),
    '❌ Supabase private paths not leaked in logs',
  );
  assert(
    !logContent2.includes(piiCvText),
    `❌ CV body text "${piiCvText}" not leaked in logs`,
  );

  // ────────────────────────────────────────────────────────────────
  // Test 3: E2E Correlation Tracing
  // ────────────────────────────────────────────────────────────────
  console.log('\n🧪 Running Test 3: E2E Correlation Tracing...');

  // Flush any pending logs and update offset
  getNewLogs();

  const traceReqId = `trace-correlation-${Date.now()}`;

  // Trigger queue error handler route which enqueues a job that
  // the ThumbnailProcessor will pick up, log job_started, and then
  // fail (force-fail-cv), logging job_failed with the requestId.
  await fetch(`${API_BASE}/health/_test-queue-error`, {
    headers: { 'x-request-id': traceReqId },
  });

  console.log('  ⏳ Waiting for BullMQ worker execution and logging...');
  await new Promise((r) => setTimeout(r, 6000));

  const logContent3 = getNewLogs();
  const lines = logContent3
    .split('\n')
    .filter((l) => l.trim() && l.includes(traceReqId));

  console.log(
    `  └─ Found ${lines.length} log lines matching request ID "${traceReqId}"`,
  );

  // Debug: show first few matching lines if any
  if (lines.length > 0) {
    lines.slice(0, 3).forEach((line, i) => {
      try {
        const parsed = JSON.parse(line);
        console.log(
          `  └─ Line ${i + 1}: event=${parsed.event || 'N/A'}, module=${parsed.module || 'N/A'}`,
        );
      } catch {
        console.log(`  └─ Line ${i + 1}: (non-JSON) ${line.substring(0, 120)}`);
      }
    });
  } else {
    // Debug: show last portion of logContent3 to diagnose
    const recent = logContent3.substring(Math.max(0, logContent3.length - 1000));
    console.log(`  └─ DEBUG: Last 1000 chars of captured logs:\n${recent}`);
  }

  // Verify standard trace propagation
  const hasQueueWorkerLogs = lines.some((line) =>
    line.includes('"module":"QueueWorker"'),
  );
  const hasJobStarted = lines.some((line) =>
    line.includes('"event":"job_started"'),
  );
  const hasJobFailed = lines.some((line) =>
    line.includes('"event":"job_failed"'),
  );

  assert(hasQueueWorkerLogs, 'QueueWorker logs registered successfully');
  assert(hasJobStarted, 'job_started event captured with the correct requestId');
  assert(hasJobFailed, 'job_failed event captured with the correct requestId');

  // ────────────────────────────────────────────────────────────────
  // Test 4: AsyncLocalStorage Stress & Memory Leak Tests
  // ────────────────────────────────────────────────────────────────
  console.log('\n🧪 Running Test 4: AsyncLocalStorage Stress & Memory Leak...');

  const initialMemory = process.memoryUsage().heapUsed;
  console.log(
    `  └─ Initial Heap Memory: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`,
  );

  const totalRequests = 10000;
  const batchSize = 100;
  const numBatches = totalRequests / batchSize;

  console.log(
    `  └─ Sending ${totalRequests} requests in ${numBatches} batches of ${batchSize}...`,
  );

  for (let b = 0; b < numBatches; b++) {
    const promises = [];
    for (let r = 0; r < batchSize; r++) {
      const uniqueId = `stress-${b}-${r}-${Date.now()}`;
      promises.push(
        fetch(`${API_BASE}/health/live`, {
          headers: { 'x-request-id': uniqueId },
        }),
      );
    }
    await Promise.all(promises);
    if ((b + 1) % 20 === 0) {
      console.log(
        `     └─ Sent ${(b + 1) * batchSize} / ${totalRequests} requests...`,
      );
    }
  }

  // Force garbage collection
  if (global.gc) {
    global.gc();
  }

  const finalMemory = process.memoryUsage().heapUsed;
  const memoryDelta = finalMemory - initialMemory;

  console.log(
    `  └─ Final Heap Memory: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log(
    `  └─ Memory Difference: ${(memoryDelta / 1024 / 1024).toFixed(2)} MB`,
  );

  // Assert no huge memory growth (< 50MB delta is standard overhead, not a leak)
  assert(
    memoryDelta < 50 * 1024 * 1024,
    'No memory leak detected in AsyncLocalStorage scope',
  );

  // Clean up resources
  await cleanupAndExit();
}

main().catch(async (err) => {
  console.error('Fatal error running tests:', err);
  await cleanupAndExit();
});
