const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || "https://alzammgwwyhszfheqvka.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error("Missing SUPABASE_ANON_KEY in env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const prisma = new PrismaClient();

async function test() {
  console.log("1. Logging into Supabase...");
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
  const supabaseId = data.user.id;
  console.log(`Supabase Login success! ID: ${supabaseId}`);

  console.log("2. Deleting user from local Prisma DB (if exists) to simulate first-time login...");
  try {
    const deleted = await prisma.user.deleteMany({
      where: { supabaseId }
    });
    console.log(`Deleted ${deleted.count} user(s) from local DB.`);
  } catch (e) {
    console.error("Error deleting user:", e.message);
  }

  console.log("3. Calling NestJS API /auth/me with the valid token...");
  try {
    const res = await fetch("http://localhost:4000/api/auth/me", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("Status:", res.status);
    const body = await res.json();
    console.log("Profile returned:", body);

    console.log("4. Verifying if user was automatically created in local Prisma DB...");
    const userInDb = await prisma.user.findUnique({
      where: { supabaseId }
    });
    if (userInDb) {
      console.log("SUCCESS! User was automatically synchronized in the database:", userInDb);
    } else {
      console.error("FAILURE! User was not found in the database.");
    }
  } catch (err) {
    console.error("Fetch API error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
