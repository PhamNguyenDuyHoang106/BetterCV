const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load environment variables from apps/api/.env
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
  console.error('Error: SUPABASE_JWT_SECRET is not found in apps/api/.env');
  process.exit(1);
}

// Function to generate HMAC SHA256 signature for JWT
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

const mockPayload = {
  iss: 'supabase',
  sub: '60190006-e3e5-4ff0-a9a5-e2aa4b0732b1', // Duy Hoang
  email: 'bonghoakhongthuocveta@gmail.com',
  role: 'authenticated',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
};

const token = signJwt(mockPayload, jwtSecret);
console.log('Generated JWT:', token);

// Test suggest skills endpoint
console.log('Sending request to http://localhost:4000/api/ai/skills/suggest...');
fetch('http://localhost:4000/api/ai/skills/suggest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    jobTitle: 'Software Engineer',
    locale: 'vi',
    currentSkills: ['Java', 'SQL']
  })
})
.then(res => {
  console.log('Response Status:', res.status, res.statusText);
  return res.json();
})
.then(json => {
  console.log('Response Body:', JSON.stringify(json, null, 2));
})
.catch(err => {
  console.error('Error occurred during fetch:', err);
});
