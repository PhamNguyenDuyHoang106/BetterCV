const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || "https://alzammgwwyhszfheqvka.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const jwtSecret = process.env.SUPABASE_JWT_SECRET;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function base64url(str) {
  return str.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
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
  const parts = token.split('.');
  const [header, payload, signature] = parts;
  const dataToVerify = `${header}.${payload}`;

  console.log("Token Signature:", signature);

  // 1. Verify as string
  const hmacStr = crypto.createHmac('sha256', jwtSecret);
  hmacStr.update(dataToVerify);
  const sigStr = base64url(hmacStr.digest('base64'));
  console.log("String Verification Match:", sigStr === signature);

  // 2. Verify as base64
  try {
    const bufferSecret = Buffer.from(jwtSecret, 'base64');
    const hmacBuf = crypto.createHmac('sha256', bufferSecret);
    hmacBuf.update(dataToVerify);
    const sigBuf = base64url(hmacBuf.digest('base64'));
    console.log("Base64 Verification Match:", sigBuf === signature);
  } catch (e) {
    console.log("Base64 Verification Error:", e.message);
  }
}

test();
