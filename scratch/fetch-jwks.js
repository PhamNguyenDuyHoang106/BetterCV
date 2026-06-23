const https = require('https');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || "https://alzammgwwyhszfheqvka.supabase.co";
const jwksUri = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`;

console.log("Fetching JWKS from:", jwksUri);

https.get(jwksUri, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const jwks = JSON.parse(data);
      console.log("JWKS Keys:", JSON.stringify(jwks, null, 2));
    } catch (e) {
      console.error("Failed to parse JWKS JSON:", e.message);
      console.log("Raw response:", data);
    }
  });
}).on('error', (err) => {
  console.error("HTTP error:", err.message);
});
