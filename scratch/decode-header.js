const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || "https://alzammgwwyhszfheqvka.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
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
  const header = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf8'));
  console.log("Token Header:", header);
}

test();
