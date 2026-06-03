const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '../apps/api/.env');
let jwtSecret = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*SUPABASE_JWT_SECRET\s*=\s*["']?([^"'\s]+)["']?/);
    if (match) jwtSecret = match[1];
  }
}

if (!jwtSecret) {
  console.error('Error: SUPABASE_JWT_SECRET not found');
  process.exit(1);
}

function signJwt(payload, secretBase64) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const secret = Buffer.from(secretBase64, 'base64');
  
  const base64UrlEncode = (obj) => {
    return Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const headerEncoded = base64UrlEncode(header);
  const payloadEncoded = base64UrlEncode(payload);

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

const token = signJwt({
  iss: 'supabase',
  sub: '60190006-e3e5-4ff0-a9a5-e2aa4b0732b1',
  email: 'bonghoakhongthuocveta@gmail.com',
  role: 'authenticated',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
}, jwtSecret);

const payload = {
  locale: 'vi',
  sectionType: 'SUMMARY',
  content: { text: 'Tôi là lập trình viên Java có 2 năm kinh nghiệm làm việc.' },
  style: 'professional',
  resumeContext: {
    jobTitle: 'Software Engineer',
    fullName: 'Phạm Nguyễn Duy Hoàng',
    experiences: [],
    skills: [],
    educations: [],
    projects: [],
  }
};

async function testRewrite() {
  console.log('Testing /api/ai/rewrite...');
  const res = await fetch('http://localhost:4000/api/ai/rewrite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  console.log('Status:', res.status, res.statusText);
  const json = await res.json();
  console.log('Body:', JSON.stringify(json, null, 2));
}

async function testRewriteStream() {
  console.log('Testing /api/ai/rewrite/stream...');
  const res = await fetch('http://localhost:4000/api/ai/rewrite/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  console.log('Status:', res.status, res.statusText);
  if (res.ok) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log('Chunk:', decoder.decode(value));
    }
  } else {
    const json = await res.json();
    console.log('Error Body:', JSON.stringify(json, null, 2));
  }
}

async function run() {
  await testRewrite();
  console.log('\n--------------------\n');
  await testRewriteStream();
}

run().catch(console.error);
