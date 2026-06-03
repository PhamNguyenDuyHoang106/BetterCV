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
    user_metadata: { full_name: 'Audit Test User' },
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
  console.log(`Audit Test Results: ${passed} passed, ${failed} failed`);
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
  console.log('    BETTERCV SPRINT 5E.5: AUDIT LOG E2E TESTS     ');
  console.log('==================================================\n');

  try {
    execSync(
      'powershell -Command "Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"',
      { stdio: 'ignore' },
    );
    await new Promise((r) => setTimeout(r, 500));
  } catch {}

  await buildApp();

  console.log('🔄 Spawning API server in production mode...');
  serverProcess = spawn('node', ['dist/main.js'], {
    cwd: path.join(__dirname),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      ALLOW_TEST_ENDPOINTS: 'true',
      SKIP_THUMBNAIL_QUEUE: 'false',
      THUMBNAIL_DEBOUNCE_MS: '0',
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

  const prisma = new PrismaClient();

  // Seed test users
  console.log('🌱 Seeding test users...');
  const user = await prisma.user.upsert({
    where: { supabaseId: 'audit-user-id' },
    update: { role: 'PRO' },
    create: { email: 'audit-user@bettercv.io', fullName: 'Audit User', supabaseId: 'audit-user-id', role: 'PRO' },
  });
  const seededUserId = user.id;
  await prisma.user.upsert({
    where: { supabaseId: 'audit-admin-id' },
    update: { role: 'ADMIN' },
    create: { email: 'audit-admin@bettercv.io', fullName: 'Audit Admin', supabaseId: 'audit-admin-id', role: 'ADMIN' },
  });

  const tokenUser = generateMockJwt('audit-user-id', 'audit-user@bettercv.io', 'PRO', jwtSecret);
  const tokenAdmin = generateMockJwt('audit-admin-id', 'audit-admin@bettercv.io', 'ADMIN', jwtSecret);

  // Clear existing audit logs
  console.log('🧹 Clearing old audit logs in DB...');
  await prisma.auditLog.deleteMany({});

  // ────────────────────────────────────────────────────────────────
  // Test 1: Transactional Audit Log Generation & Diff Verification
  // ────────────────────────────────────────────────────────────────
  console.log('\n🧪 Running Test 1: Transactional Audit Log & Diffs...');

  // Create CV
  const createRes = await fetch(`${API_BASE}/cvs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUser}` },
    body: JSON.stringify({ title: 'Original CV', locale: 'en', templateId: 'standard-ats' }),
  });
  assert(createRes.status === 201, 'CV created successfully');
  const cvData = (await createRes.json()) as any;
  const cvId = cvData.data.id;

  // Update CV title
  const updateRes = await fetch(`${API_BASE}/cvs/${cvId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUser}` },
    body: JSON.stringify({ title: 'Updated CV Metadata', locale: 'en', version: 1 }),
  });
  assert(updateRes.status === 200, 'CV updated successfully');

  // Verify Audit Log records
  const auditRes = await fetch(`${API_BASE}/admin/audit-logs?resourceId=${cvId}`, {
    headers: { Authorization: `Bearer ${tokenAdmin}` },
  });
  assert(auditRes.status === 200, 'Admin can fetch audit logs');
  const auditData = (await auditRes.json()) as any;
  const logs = auditData.data.data || auditData.data || [];
  
  // Find CV_UPDATED log
  const updateLog = logs.find((l: any) => l.eventType === 'CV_UPDATED' && l.action === 'CV metadata updated');
  assert(updateLog !== undefined, 'Audit log CV_UPDATED was successfully generated');
  
  if (updateLog) {
    assert(updateLog.oldValue !== null, 'oldValue is recorded');
    assert(updateLog.newValue !== null, 'newValue is recorded');
    
    // Assert diff-only: oldValue should have 'title' but NOT 'locale' (which didn't change)
    const oldKeys = Object.keys(updateLog.oldValue);
    assert(oldKeys.includes('title'), 'oldValue contains the modified field "title"');
    assert(!oldKeys.includes('locale'), 'oldValue does NOT contain unmodified field "locale" (diff-only verification)');
  }

  // ────────────────────────────────────────────────────────────────
  // Test 2: Transaction Rollback Verification
  // ────────────────────────────────────────────────────────────────
  console.log('\n🧪 Running Test 2: Transaction Rollback Verification...');
  
  // Clear audit logs to make counting trivial
  await prisma.auditLog.deleteMany({});

  // Trigger failed transaction (upsert section with invalid id)
  const failRes = await fetch(`${API_BASE}/cvs/${cvId}/sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUser}` },
    body: JSON.stringify({
      id: 'cmpxfjtd60001udmwfjj1pbeb', // non-existent section ID
      type: 'SUMMARY',
      order: 1,
      content: { text: 'Rollback text' }
    }),
  });
  // Express/NestJS transaction failure will bubble up as 404 or 500
  assert(failRes.status !== 200 && failRes.status !== 201, `Failed transaction correctly returns error (got ${failRes.status})`);

  // Verify no audit logs were written
  const rollbackLogsCount = await prisma.auditLog.count({});
  assert(rollbackLogsCount === 0, `No audit logs were written during rolled back transaction (count is ${rollbackLogsCount})`);

  // ────────────────────────────────────────────────────────────────
  // Test 3: IP Hashing Verification
  // ────────────────────────────────────────────────────────────────
  console.log('\n🧪 Running Test 3: IP Hashing with Secret...');
  
  // Generate a valid log again by updating CV metadata
  await fetch(`${API_BASE}/cvs/${cvId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUser}` },
    body: JSON.stringify({ title: 'Another CV Title', locale: 'en', version: 2 }),
  });

  const ipLogs = await prisma.auditLog.findMany({
    where: { resourceId: cvId, eventType: 'CV_UPDATED' },
    orderBy: { createdAt: 'desc' }
  });
  
  assert(ipLogs.length > 0, 'Found updated CV log');
  if (ipLogs.length > 0) {
    const log = ipLogs[0];
    assert(log.ipHash !== null && log.ipHash.length > 0, 'ipHash column is populated');
    
    // Compute local HMAC for comparison (client is running locally, calling via localhost)
    const expectedHash1 = createHmac('sha256', 'dev-audit-ip-hash-secret-value-987654')
      .update('::1')
      .digest('hex');
    const expectedHash2 = createHmac('sha256', 'dev-audit-ip-hash-secret-value-987654')
      .update('127.0.0.1')
      .digest('hex');
    const expectedHash3 = createHmac('sha256', 'dev-audit-ip-hash-secret-value-987654')
      .update('::ffff:127.0.0.1')
      .digest('hex');
      
    const matched = log.ipHash === expectedHash1 || log.ipHash === expectedHash2 || log.ipHash === expectedHash3;
    assert(matched, `ipHash is correct HMAC-SHA256 hash of IP (got ${log.ipHash})`);
  }

  // ────────────────────────────────────────────────────────────────
  // Test 4: Structured Snapshot Truncation (>10KB)
  // ────────────────────────────────────────────────────────────────
  console.log('\n🧪 Running Test 4: Structured Truncation (>10KB)...');

  const hugeString = 'A'.repeat(12000); // 12KB
  const truncateRes = await fetch(`${API_BASE}/cvs/${cvId}/sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUser}` },
    body: JSON.stringify({
      type: 'SUMMARY',
      order: 2,
      content: { text: hugeString }
    }),
  });
  assert(truncateRes.status === 201 || truncateRes.status === 200, 'Large section created successfully');

  // Verify the audit log newValue is truncated structured object
  const sectionData = (await truncateRes.json()) as any;
  const sectionId = sectionData.data.id;
  
  const sectionLog = await prisma.auditLog.findFirst({
    where: { resourceId: sectionId, eventType: 'CV_SECTION_UPDATED' }
  });
  
  assert(sectionLog !== null, 'Section audit log exists');
  if (sectionLog) {
    const newValueObj = sectionLog.newValue as any;
    assert(newValueObj !== null, 'newValue is present');
    if (newValueObj) {
      // It should match the truncated format
      assert(newValueObj.truncated === true, 'newValue is marked as truncated');
      assert(newValueObj.originalSize > 10240, `newValue originalSize exceeds 10KB cap (originalSize: ${newValueObj.originalSize})`);
      assert(typeof newValueObj.data === 'string' && newValueObj.data.includes('... [TRUNCATED]'), 'newValue data contains truncation snippet');
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Test 5: Retention Purge (AuditLogService.purgeExpiredLogs)
  // ────────────────────────────────────────────────────────────────
  console.log('\n🧪 Running Test 5: Retention Purge...');
  
  // Insert an old log
  await prisma.auditLog.create({
    data: {
      actorUserId: 'audit-user-id',
      actorType: 'USER',
      eventType: 'CV_UPDATED',
      action: 'old historical log',
      resourceType: 'Cv',
      resourceId: cvId,
      severity: 'INFO',
      createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago (expires past 90 days retention)
    }
  });

  // Trigger test-purge endpoint
  const purgeRes = await fetch(`${API_BASE}/admin/audit-logs/test-purge`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenAdmin}` }
  });
  assert(purgeRes.status === 201 || purgeRes.status === 200, 'Test purge endpoint executed successfully');
  const purgeJson = (await purgeRes.json()) as any;
  assert(purgeJson.data?.purged >= 1, `Test purge reported deleting at least 1 old log (purged count: ${purgeJson.data?.purged})`);

  // Verify that there is no log older than 90 days
  const oldLogs = await prisma.auditLog.findMany({
    where: { createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }
  });
  assert(oldLogs.length === 0, 'No logs older than 90 days remaining in database');

  // ────────────────────────────────────────────────────────────────
  // Test 6: Thumbnail Reconciliation (Reconcile & Orphan Purge)
  // ────────────────────────────────────────────────────────────────
  console.log('\n🧪 Running Test 6: Thumbnail Cleanup Queue & Reconciliation...');

  // Setup mock local files
  const thumbnailDir = path.join(process.cwd(), 'storage', 'thumbnails');
  if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir, { recursive: true });
  }

  const cvWebpPath = path.join(thumbnailDir, `${cvId}.webp`);
  fs.writeFileSync(cvWebpPath, 'mock-webp-data');
  assert(fs.existsSync(cvWebpPath), `Created mock WebP file for CV ${cvId}`);

  // 6.1 Soft Delete CV and verify cleanup worker deletes file
  await fetch(`${API_BASE}/cvs/${cvId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenUser}` },
  });
  
  console.log('  ⏳ Waiting for BullMQ thumbnail cleanup queue processing...');
  await new Promise((r) => setTimeout(r, 3000));
  assert(!fs.existsSync(cvWebpPath), 'WebP thumbnail file was physically deleted by the cleanup queue processor');

  // 6.2 Reconciliation orphan file delete
  const orphanWebpPath = path.join(thumbnailDir, 'orphan-cv.webp');
  fs.writeFileSync(orphanWebpPath, 'mock-orphan-data');
  assert(fs.existsSync(orphanWebpPath), 'Created mock orphan WebP file on disk');

  // Create corresponding soft-deleted CV in DB to trigger physical purge by reconciliation task
  await prisma.cv.upsert({
    where: { id: 'orphan-cv' },
    update: { isDeleted: true, thumbnailStatus: 'READY' },
    create: { id: 'orphan-cv', userId: seededUserId, title: 'Orphan CV', isDeleted: true, thumbnailStatus: 'READY' }
  });

  // 6.3 Active CV with missing thumbnail should be reset to PENDING
  await prisma.cv.upsert({
    where: { id: 'active-missing' },
    update: { isDeleted: false, thumbnailStatus: 'READY', thumbnailGeneratedAt: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000) },
    create: {
      id: 'active-missing',
      userId: seededUserId,
      title: 'Active Missing Thumbnail CV',
      isDeleted: false,
      thumbnailStatus: 'READY',
      thumbnailGeneratedAt: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000), // > 24 hours threshold
    }
  });

  const activeMissingWebpPath = path.join(thumbnailDir, 'active-missing.webp');
  if (fs.existsSync(activeMissingWebpPath)) {
    fs.unlinkSync(activeMissingWebpPath);
  }

  // Trigger reconciliation via internal route
  const reconcileRes = await fetch(`${API_BASE}/cvs/internal/test-reconcile`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenUser}` }
  });
  assert(reconcileRes.status === 201 || reconcileRes.status === 200, 'Test reconciliation endpoint executed successfully');
  
  // Wait a small moment for reconciliation task completion
  await new Promise((r) => setTimeout(r, 1000));

  // Assert orphan file was deleted
  assert(!fs.existsSync(orphanWebpPath), 'Orphan thumbnail file was purged by reconciliation cron');

  // Assert active CV with missing file was reset to PENDING
  const activeMissingCv = await prisma.cv.findUnique({ where: { id: 'active-missing' } });
  assert(activeMissingCv?.thumbnailStatus === 'PENDING', 'Active CV with missing file was reset to PENDING');
  assert(activeMissingCv?.thumbnailUrl === null, 'Active CV thumbnailUrl was set to null');

  // Cleanup seeded DB records
  console.log('🧹 Cleaning up test DB records...');
  await prisma.cv.deleteMany({ where: { id: { in: [cvId, 'orphan-cv', 'active-missing'] } } });
  await prisma.user.deleteMany({ where: { supabaseId: { in: ['audit-user-id', 'audit-admin-id'] } } });
  await prisma.auditLog.deleteMany({});
  await prisma.$disconnect();

  await cleanupAndExit();
}

main().catch(async (err) => {
  console.error('Fatal error running audit tests:', err);
  await cleanupAndExit();
});
