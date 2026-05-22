const crypto = require('crypto');
require('dotenv').config();

const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.SUPABASE_JWT_SECRET;

function base64url(str) {
  return str.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function verifyJwt(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  const [header, payload, signature] = parts;
  const data = `${header}.${payload}`;
  
  // Try directly as string
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  const calculatedSignature = base64url(hmac.digest('base64'));
  
  if (calculatedSignature === signature) {
    return 'string';
  }
  
  // Try as base64 secret (sometimes Supabase secrets are base64 encoded)
  try {
    const bufferSecret = Buffer.from(secret, 'base64');
    const hmac2 = crypto.createHmac('sha256', bufferSecret);
    hmac2.update(data);
    const calculatedSignature2 = base64url(hmac2.digest('base64'));
    if (calculatedSignature2 === signature) {
      return 'base64';
    }
  } catch (e) {
    // ignore
  }

  return false;
}

console.log("Verifying Anon Key with JWT Secret...");
console.log("Result (Anon Key):", verifyJwt(anonKey, jwtSecret));

console.log("Verifying Service Role Key with JWT Secret...");
console.log("Result (Service Key):", verifyJwt(serviceKey, jwtSecret));
