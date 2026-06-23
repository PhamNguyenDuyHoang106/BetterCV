/**
 * BetterCV – Email Migration Script
 * ────────────────────────────────
 * Migrates users with email domains NOT ending in @gmail.com or @fpt.edu.vn
 * to @gmail.com. Updates email address in:
 *   • Supabase Auth (via Admin API)
 *   • Prisma / local DB
 *
 * It checks for conflicts (e.g. if the target email is already taken)
 * and appends a numeric suffix if needed to maintain uniqueness.
 *
 * Usage:
 *   node scripts/migrate-user-emails.mjs
 *   node scripts/migrate-user-emails.mjs --dry-run
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

// ─── Parse CLI flags ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

// ─── Load .env ────────────────────────────────────────────────────────────────
function loadEnv() {
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, ".env");
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, "utf-8");
      for (const line of raw.split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const eq = t.indexOf("=");
        if (eq === -1) continue;
        const key = t.slice(0, eq).trim();
        let val   = t.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
        if (!process.env[key]) process.env[key] = val;
      }
      console.log(`✅ Loaded .env from ${candidate}`);
      return;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  console.warn("⚠️  No .env file found – relying on environment variables");
}
loadEnv();

const SUPABASE_URL              = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const prisma = new PrismaClient();

async function fetchAllAuthUsers() {
  const allUsers = [];
  let page = 1;
  const PAGE_SIZE = 500;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });

    if (error) {
      throw new Error(`Failed to list users (page ${page}): ${error.message}`);
    }

    const users = data.users ?? [];
    const lastPage = data.lastPage ?? null;
    allUsers.push(...users);

    const reachedEnd = (lastPage != null && page >= lastPage) || users.length < PAGE_SIZE;
    if (reachedEnd) break;
    page++;
  }

  return allUsers;
}

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   BetterCV – User Email Migration Script    ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  if (DRY_RUN) console.log("🔍  DRY-RUN mode – no changes will be written\n");

  // 1. Fetch all users from Supabase Auth
  console.log("📥 Fetching all Supabase Auth users...");
  const authUsers = await fetchAllAuthUsers();
  console.log(`✅ Found ${authUsers.length} total auth users\n`);

  // Build a set of all existing emails to check for conflicts
  const existingEmails = new Set(authUsers.map(u => (u.email ?? "").toLowerCase()));

  // 2. Identify candidates for migration
  const toMigrate = [];
  for (const u of authUsers) {
    if (!u.email) continue;
    const email = u.email.toLowerCase();
    
    // Only migrate if not ending in @gmail.com or @fpt.edu.vn
    if (!email.endsWith("@gmail.com") && !email.endsWith("@fpt.edu.vn")) {
      const localPart = email.split("@")[0];
      let newEmail = `${localPart}@gmail.com`;

      // Resolve email conflicts if the target email is already taken
      let suffix = 1;
      while (existingEmails.has(newEmail)) {
        newEmail = `${localPart}${suffix}@gmail.com`;
        suffix++;
      }

      // Add to existing emails set to prevent conflict with other migrated users in the same run
      existingEmails.add(newEmail);

      toMigrate.push({
        id: u.id,
        oldEmail: u.email,
        newEmail: newEmail,
        meta: u.user_metadata ?? {},
      });
    }
  }

  console.log(`📊 Migration plan:`);
  console.log(`   Users to migrate : ${toMigrate.length}`);
  console.log(`   Users unaffected : ${authUsers.length - toMigrate.length}\n`);

  if (toMigrate.length === 0) {
    console.log("✅ No users require email migration. Exiting.\n");
    return;
  }

  // 3. Perform Migration
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < toMigrate.length; i++) {
    const user = toMigrate[i];
    console.log(`[${i + 1}/${toMigrate.length}] Migrating: ${user.oldEmail} ➔ ${user.newEmail}`);

    if (DRY_RUN) {
      successCount++;
      continue;
    }

    try {
      // Step A: Update user in Supabase Auth
      const updatedMeta = { ...user.meta, email: user.newEmail };
      if (updatedMeta.hd) {
        updatedMeta.hd = "gmail.com";
      }

      const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
        email: user.newEmail,
        email_confirm: true,
        user_metadata: updatedMeta
      });

      if (authError) {
        throw new Error(`Supabase error: ${authError.message}`);
      }

      // Step B: Update user in local Prisma DB
      await prisma.user.updateMany({
        where: {
          OR: [
            { supabaseId: user.id },
            { email: user.oldEmail }
          ]
        },
        data: {
          email: user.newEmail
        }
      });

      // Step C: Also update email in CV profile sections to be consistent
      // Let's find all CVs for this user and update the PROFILE section if it exists
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { supabaseId: user.id },
            { email: user.newEmail } // already updated to newEmail
          ]
        }
      });

      if (dbUser) {
        const cvSections = await prisma.cvSection.findMany({
          where: {
            cv: { userId: dbUser.id },
            type: "PROFILE"
          }
        });

        for (const section of cvSections) {
          const content = typeof section.content === "string" 
            ? JSON.parse(section.content) 
            : (section.content || {});
          
          if (content.email === user.oldEmail) {
            content.email = user.newEmail;
            await prisma.cvSection.update({
              where: { id: section.id },
              data: { content: content }
            });
          }
        }
      }

      successCount++;
      console.log(`   ✅ Successfully migrated ${user.oldEmail}`);
    } catch (err) {
      failCount++;
      console.error(`   ❌ Failed to migrate ${user.oldEmail}: ${err.message}`);
    }
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log(DRY_RUN ? "🔍  Migration Dry-Run complete!" : "🎉  Migration complete!");
  console.log("═══════════════════════════════════════════════");
  console.log(`   Success : ${successCount}`);
  console.log(`   Failed  : ${failCount}`);
  console.log("");
}

main()
  .catch((err) => {
    console.error("\n💥 Fatal migration error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
