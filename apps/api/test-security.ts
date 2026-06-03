import { spawn, ChildProcess, execSync } from 'child_process';
import * as path from 'path';
import { createHmac } from 'crypto';
import { PrismaClient } from '@prisma/client';
import * as http from 'http';

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

function makeRawRequest(path: string): Promise<number> {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 4000,
        path,
        method: 'GET',
      },
      (res) => {
        resolve(res.statusCode || 0);
      },
    );
    req.on('error', () => {
      resolve(500);
    });
    req.end();
  });
}

function generateMockJwt(
  sub: string,
  email: string,
  role: string,
  secret: string,
  alg: string = 'HS256',
  tamperSignature: boolean = false,
): string {
  const header = { alg, typ: 'JWT' };
  const payload = {
    sub,
    email,
    role,
    iss: 'supabase',
    aud: 'authenticated',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    user_metadata: { full_name: 'Test Security User' },
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

  if (alg === 'none') {
    return `${headerB64}.${payloadB64}.`;
  }

  let key: string | Buffer = secret;
  if (secret.length > 40 && secret.endsWith('=')) {
    try {
      key = Buffer.from(secret, 'base64');
    } catch {}
  }

  const hmac = createHmac('sha256', key);
  hmac.update(`${headerB64}.${payloadB64}`);
  let signatureB64 = hmac.digest('base64url');

  if (tamperSignature) {
    signatureB64 = signatureB64.substring(0, signatureB64.length - 4) + 'abcd';
  }

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
  console.log(`Security Test Results: ${passed} passed, ${failed} failed`);
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
  console.log('    BETTERCV SPRINT 5E.5: SECURITY E2E TESTS       ');
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

  // Direct database seed to ensure test users exist
  const prisma = new PrismaClient();
  await prisma.user.upsert({
    where: { supabaseId: 'sec-user-1' },
    update: { role: 'PRO' },
    create: { email: 'sec1@bettercv.io', fullName: 'Security User 1', supabaseId: 'sec-user-1', role: 'PRO' },
  });
  await prisma.user.upsert({
    where: { supabaseId: 'sec-user-2' },
    update: { role: 'PRO' },
    create: { email: 'sec2@bettercv.io', fullName: 'Security User 2', supabaseId: 'sec-user-2', role: 'PRO' },
  });
  await prisma.user.upsert({
    where: { supabaseId: 'sec-admin-1' },
    update: { role: 'ADMIN' },
    create: { email: 'admin1@bettercv.io', fullName: 'Security Admin 1', supabaseId: 'sec-admin-1', role: 'ADMIN' },
  });
  await prisma.$disconnect();

  const tokenUser1 = generateMockJwt('sec-user-1', 'sec1@bettercv.io', 'PRO', jwtSecret);
  const tokenUser2 = generateMockJwt('sec-user-2', 'sec2@bettercv.io', 'PRO', jwtSecret);
  const tokenAdmin = generateMockJwt('sec-admin-1', 'admin1@bettercv.io', 'ADMIN', jwtSecret);

  // ────────────────────────────────────────────────────────────────
  // Test 1: IDOR Protection
  // ────────────────────────────────────────────────────────────────
  console.log('🧪 Running Test 1: IDOR Protection...');
  
  // User 1 creates a CV
  const createRes = await fetch(`${API_BASE}/cvs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUser1}` },
    body: JSON.stringify({ title: 'User 1 CV', locale: 'en', templateId: 'standard-ats' }),
  });
  const cvData = (await createRes.json()) as any;
  const cvId = cvData.data.id;
  assert(cvId !== undefined, 'User 1 CV created successfully');

  // User 2 attempts to fetch User 1's CV
  const fetchResUser2 = await fetch(`${API_BASE}/cvs/${cvId}`, {
    headers: { Authorization: `Bearer ${tokenUser2}` },
  });
  assert(fetchResUser2.status === 404, `User 2 attempting to fetch User 1 CV is blocked with 404 (got ${fetchResUser2.status})`);

  // User 2 attempts to update User 1's CV
  const updateResUser2 = await fetch(`${API_BASE}/cvs/${cvId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUser2}` },
    body: JSON.stringify({ title: 'Tampered Title', locale: 'en', version: 1 }),
  });
  assert(updateResUser2.status === 404, `User 2 attempting to update User 1 CV is blocked with 404 (got ${updateResUser2.status})`);

  // ────────────────────────────────────────────────────────────────
  // Test 2: Role Escalation Prevention
  // ────────────────────────────────────────────────────────────────
  console.log('\n🧪 Running Test 2: Role Escalation Prevention...');
  
  // Standard user tries to fetch admin audit logs
  const adminLogRes = await fetch(`${API_BASE}/admin/audit-logs`, {
    headers: { Authorization: `Bearer ${tokenUser1}` },
  });
  assert(adminLogRes.status === 403, `Standard user requesting admin audit logs is blocked with 403 Forbidden (got ${adminLogRes.status})`);

  // Admin user can successfully fetch audit logs
  const adminLogResOk = await fetch(`${API_BASE}/admin/audit-logs`, {
    headers: { Authorization: `Bearer ${tokenAdmin}` },
  });
  assert(adminLogResOk.status === 200, `Admin user requesting audit logs is allowed with 200 OK (got ${adminLogResOk.status})`);

  // ────────────────────────────────────────────────────────────────
  // Test 3: JWT Tampering Prevention
  // ────────────────────────────────────────────────────────────────
  console.log('\n🧪 Running Test 3: JWT Tampering Prevention...');
  
  // Alg header 'none'
  const tokenNone = generateMockJwt('sec-user-1', 'sec1@bettercv.io', 'PRO', jwtSecret, 'none');
  const noneRes = await fetch(`${API_BASE}/cvs`, {
    headers: { Authorization: `Bearer ${tokenNone}` },
  });
  assert(noneRes.status === 401, `JWT with algorithm "none" is rejected with 401 Unauthorized (got ${noneRes.status})`);

  // Invalid signature
  const tokenTampered = generateMockJwt('sec-user-1', 'sec1@bettercv.io', 'PRO', jwtSecret, 'HS256', true);
  const tamperedRes = await fetch(`${API_BASE}/cvs`, {
    headers: { Authorization: `Bearer ${tokenTampered}` },
  });
  assert(tamperedRes.status === 401, `JWT with tampered signature is rejected with 401 Unauthorized (got ${tamperedRes.status})`);

  // ────────────────────────────────────────────────────────────────
  // Test 4: Path Traversal Prevention
  // ────────────────────────────────────────────────────────────────
  console.log('\n🧪 Running Test 4: Path Traversal Prevention on Thumbnail Servings...');
  
  const traversalStatusCode = await makeRawRequest('/api/cvs/thumbnails/../../../etc/passwd');
  assert(traversalStatusCode === 400, `Path traversal using relative directory paths is blocked with 400 (got ${traversalStatusCode})`);

  const traversalUrl2 = `${API_BASE}/cvs/thumbnails/invalid_char_$.webp`;
  const traversalRes2 = await fetch(traversalUrl2);
  assert(traversalRes2.status === 400, `Regex rejects invalid chars inside serving route with 400 Bad Request (got ${traversalRes2.status})`);

  // ────────────────────────────────────────────────────────────────
  // Test 5: SQL / NoSQL Injection Protection
  // ────────────────────────────────────────────────────────────────
  console.log('\n🧪 Running Test 5: SQL & NoSQL Injection parameter safety...');

  // SQL Injection query payload in path params
  const sqlInjectionId = "'; DROP TABLE \"Cv\"; --";
  const sqlRes = await fetch(`${API_BASE}/cvs/${sqlInjectionId}`, {
    headers: { Authorization: `Bearer ${tokenUser1}` },
  });
  // Should return 400 or 404 (handled safely by parameterization, not crashing with 500 database error)
  assert(sqlRes.status === 400 || sqlRes.status === 404, `SQL Injection payload in UUID path handled safely (got ${sqlRes.status})`);

  // NoSQL Injection payload in request body
  const nosqlRes = await fetch(`${API_BASE}/cvs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUser1}` },
    body: JSON.stringify({
      title: { "$ne": null }, // NoSQL operator nesting attempt
      locale: 'en',
      templateId: 'standard-ats'
    }),
  });
  // NestJS class-validator DTO should reject non-string title with 400 Bad Request
  assert(nosqlRes.status === 400, `NoSQL operator injection in DTO rejected with 400 Bad Request (got ${nosqlRes.status})`);

  await cleanupAndExit();
}

main().catch(async (err) => {
  console.error('Fatal error running security tests:', err);
  await cleanupAndExit();
});
