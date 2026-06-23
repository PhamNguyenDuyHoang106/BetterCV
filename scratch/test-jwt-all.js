const crypto = require('crypto');
require('dotenv').config();

const jwtSecret = process.env.SUPABASE_JWT_SECRET;
const token = process.argv[2];

if (!token) {
  console.error("Please provide token as argument: node scratch/test-jwt-all.js <token>");
  process.exit(1);
}

function base64url(str) {
  return str.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function verify(token, secret) {
  const parts = token.split('.');
  const [header, payload, signature] = parts;
  const data = `${header}.${payload}`;

  // 1. As string
  const hmacStr = crypto.createHmac('sha256', secret);
  hmacStr.update(data);
  const sigStr = base64url(hmacStr.digest('base64'));
  console.log("As string calculated:", sigStr);
  console.log("Actual signature:   ", signature);
  console.log("Match:", sigStr === signature);

  // 2. As base64
  try {
    const buf = Buffer.from(secret, 'base64');
    const hmacBuf = crypto.createHmac('sha256', buf);
    hmacBuf.update(data);
    const sigBuf = base64url(hmacBuf.digest('base64'));
    console.log("As base64 calculated:", sigBuf);
    console.log("Match:", sigBuf === signature);
  } catch (e) {
    console.log("As base64 failed:", e.message);
  }
}

verify(token, jwtSecret);
