const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || "https://alzammgwwyhszfheqvka.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const jwtSecret = process.env.SUPABASE_JWT_SECRET;

if (!supabaseAnonKey || !jwtSecret) {
  console.error("Missing SUPABASE_ANON_KEY or SUPABASE_JWT_SECRET in env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    return true;
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

async function test() {
  console.log("Testing Supabase login...");
  const email = "bonghoakhongthuocveta@gmail.com";
  const password = "Hoang10062004";

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error("Supabase Login failed:", error.message);
    return;
  }

  const token = data.session.access_token;
  console.log("Supabase Login success!");
  console.log("Token payload:", JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8')));
  
  console.log("Verifying token with SUPABASE_JWT_SECRET...");
  const result = verifyJwt(token, jwtSecret);
  console.log("Verification result:", result);
}

test();
