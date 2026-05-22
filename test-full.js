const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || "https://alzammgwwyhszfheqvka.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error("Missing SUPABASE_ANON_KEY in env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Testing Supabase login with credentials...");
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

  console.log("Supabase Login success!");
  const token = data.session.access_token;
  console.log("User ID:", data.user.id);
  console.log("Session token length:", token.length);

  // Now call NestJS API /auth/me
  console.log("Calling NestJS API /auth/me...");
  try {
    const res = await fetch("http://localhost:4000/api/auth/me", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("Status:", res.status);
    const body = await res.json();
    console.log("Body:", body);
  } catch (err) {
    console.error("Fetch API error:", err);
  }

  // Also try calling /auth/sync
  console.log("Calling NestJS API /auth/sync...");
  try {
    const res = await fetch("http://localhost:4000/api/auth/sync", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fullName: "Pham Nguyen Duy Hoang" })
    });

    console.log("Status:", res.status);
    const body = await res.json();
    console.log("Body:", body);
  } catch (err) {
    console.error("Fetch API error:", err);
  }
}

test();
