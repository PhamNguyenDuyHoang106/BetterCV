const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || "https://alzammgwwyhszfheqvka.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Supabase login...");
  const email = "bonghoakhongthuocveta@gmail.com";
  const password = "Hoang10062004";

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error("Login failed:", error.message);
    return;
  }

  const token = data.session.access_token;
  console.log("Calling NestJS API /api/billing/checkout via POST...");
  try {
    const res = await fetch("http://localhost:4000/api/billing/checkout", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tier: "PRO",
        mode: "subscription",
        successUrl: "http://localhost:3000/dashboard?paid=1",
        cancelUrl: "http://localhost:3000/dashboard?paid=0"
      })
    });

    console.log("Status:", res.status);
    const body = await res.json();
    console.log("Body:", JSON.stringify(body, null, 2));
  } catch (err) {
    console.error("Fetch API error:", err);
  }
}

test();
