require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const anonKey = process.env.SUPABASE_ANON_KEY;
const supabaseUrl = process.env.SUPABASE_URL;

const supabase = createClient(supabaseUrl, anonKey);

async function test() {
  const { data } = await supabase.auth.signInWithPassword({
    email: "bonghoakhongthuocveta@gmail.com",
    password: "Hoang10062004"
  });

  const userToken = data.session.access_token;

  console.log("=== ANON KEY ===");
  const anonParts = anonKey.split('.');
  console.log("Header:", JSON.parse(Buffer.from(anonParts[0], 'base64').toString('utf8')));
  console.log("Payload:", JSON.parse(Buffer.from(anonParts[1], 'base64').toString('utf8')));

  console.log("\n=== USER TOKEN ===");
  const userParts = userToken.split('.');
  console.log("Header:", JSON.parse(Buffer.from(userParts[0], 'base64').toString('utf8')));
  console.log("Payload:", JSON.parse(Buffer.from(userParts[1], 'base64').toString('utf8')));
}

test();
