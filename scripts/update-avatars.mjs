/**
 * BetterCV – Avatar Update Script
 * ────────────────────────────────
 * Fetches every existing Supabase Auth user, derives their initials from
 * full_name, builds a ui-avatars.com URL, then patches:
 *   • auth.users.raw_user_meta_data.avatar_url  (via Admin API)
 *   • users.avatarUrl                           (via Prisma / your DB)
 *
 * Avatar format:
 *   https://ui-avatars.com/api/?name=<initials>&background=<hex>&color=fff&size=256&bold=true&rounded=true
 *
 * Usage (from project root or apps/api):
 *   node scripts/update-avatars.mjs
 *   node scripts/update-avatars.mjs --force      # overwrite even if avatar already set
 *   node scripts/update-avatars.mjs --dry-run    # preview without writing
 *
 * Options:
 *   --force     Overwrite existing avatar_url values (default: skip)
 *   --dry-run   Print what would be updated, make no changes
 *   --page-size <n>   Auth users per list page  (default: 1000)
 *   --batch-size <n>  Concurrent update requests (default: 10)
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

// ─── Parse CLI flags ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const FORCE    = args.includes("--force");
const DRY_RUN  = args.includes("--dry-run");
const pageSizeIdx  = args.indexOf("--page-size");
const batchSizeIdx = args.indexOf("--batch-size");
const PAGE_SIZE  = pageSizeIdx  !== -1 ? parseInt(args[pageSizeIdx  + 1], 10) : 500;
const BATCH_SIZE = batchSizeIdx !== -1 ? parseInt(args[batchSizeIdx + 1], 10) : 10;

// ─── Load .env (walks up from CWD until it finds .env) ───────────────────────
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

// ─── Validate env ─────────────────────────────────────────────────────────────
const SUPABASE_URL              = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

// ─── Clients ──────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const prisma = new PrismaClient();

// ─── Avatar palette – warm, vibrant, accessible background colours ────────────
// These are intentionally hand-curated so avatars feel Google-like:
// saturated, not too dark, not too light (white text stays legible at all).
const BG_PALETTE = [
  "1a73e8", // Google Blue
  "0f9d58", // Google Green
  "db4437", // Google Red
  "f4b400", // Google Yellow (dark enough for white text at large sizes)
  "9334e6", // Purple
  "e8710a", // Orange
  "00897b", // Teal
  "d81b60", // Pink
  "5e35b1", // Deep Purple
  "00acc1", // Cyan
  "43a047", // Medium Green
  "f06292", // Light Pink
  "8d6e63", // Brown
  "546e7a", // Blue Grey
  "e53935", // Red 600
  "039be5", // Light Blue
  "7cb342", // Light Green
  "fb8c00", // Orange 600
  "6d4c41", // Brown 600
  "3949ab", // Indigo
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Vietnamese diacritic → ASCII map.
 * Used to make names safe for ui-avatars.com `name` parameter.
 */
const VIET_MAP = {
  "à":"a","á":"a","ả":"a","ã":"a","ạ":"a",
  "ă":"a","ắ":"a","ằ":"a","ẳ":"a","ẵ":"a","ặ":"a",
  "â":"a","ấ":"a","ầ":"a","ẩ":"a","ẫ":"a","ậ":"a",
  "è":"e","é":"e","ẻ":"e","ẽ":"e","ẹ":"e",
  "ê":"e","ế":"e","ề":"e","ể":"e","ễ":"e","ệ":"e",
  "ì":"i","í":"i","ỉ":"i","ĩ":"i","ị":"i",
  "ò":"o","ó":"o","ỏ":"o","õ":"o","ọ":"o",
  "ô":"o","ố":"o","ồ":"o","ổ":"o","ỗ":"o","ộ":"o",
  "ơ":"o","ớ":"o","ờ":"o","ở":"o","ỡ":"o","ợ":"o",
  "ù":"u","ú":"u","ủ":"u","ũ":"u","ụ":"u",
  "ư":"u","ứ":"u","ừ":"u","ử":"u","ữ":"u","ự":"u",
  "ỳ":"y","ý":"y","ỷ":"y","ỹ":"y","ỵ":"y",
  "đ":"d",
  "À":"A","Á":"A","Ả":"A","Ã":"A","Ạ":"A",
  "Ă":"A","Ắ":"A","Ằ":"A","Ẳ":"A","Ẵ":"A","Ặ":"A",
  "Â":"A","Ấ":"A","Ầ":"A","Ẩ":"A","Ẫ":"A","Ậ":"A",
  "È":"E","É":"E","Ẻ":"E","Ẽ":"E","Ẹ":"E",
  "Ê":"E","Ế":"E","Ề":"E","Ể":"E","Ễ":"E","Ệ":"E",
  "Ì":"I","Í":"I","Ỉ":"I","Ĩ":"I","Ị":"I",
  "Ò":"O","Ó":"O","Ỏ":"O","Õ":"O","Ọ":"O",
  "Ô":"O","Ố":"O","Ồ":"O","Ổ":"O","Ỗ":"O","Ộ":"O",
  "Ơ":"O","Ớ":"O","Ờ":"O","Ở":"O","Ỡ":"O","Ợ":"O",
  "Ù":"U","Ú":"U","Ủ":"U","Ũ":"U","Ụ":"U",
  "Ư":"U","Ứ":"U","Ừ":"U","Ử":"U","Ữ":"U","Ự":"U",
  "Ỳ":"Y","Ý":"Y","Ỷ":"Y","Ỹ":"Y","Ỵ":"Y",
  "Đ":"D",
};

/**
 * Strip Vietnamese diacritics → plain ASCII.
 * e.g. "Nguyễn Văn An" → "Nguyen Van An"
 */
function toAscii(str) {
  if (!str) return "";
  return str.split("").map((c) => VIET_MAP[c] ?? c).join("");
}

/**
 * Pick a deterministic background colour for a user based on their email.
 * Same email always → same colour, no external seed library needed.
 */
function deterministicColor(email) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) | 0;
  }
  return BG_PALETTE[Math.abs(hash) % BG_PALETTE.length];
}

function deriveInitials(fullName) {
  const asciiName = toAscii(fullName || "User");
  const firstWord = asciiName.trim().split(/\s+/)[0] || asciiName;
  return firstWord[0] || "";
}

/**
 * Build a ui-avatars.com URL.
 *
 * IMPORTANT: the `name` parameter must be pure ASCII.
 * ui-avatars extracts initials automatically from the words in `name`.
 *
 * Example (matches user's spec):
 *   name=Vu+My+Diem → shows "VD"
 *   name=Nguyen+Van+An → shows "NA"
 *
 * Docs: https://ui-avatars.com/
 */
function buildAvatarUrl(fullName, email) {
  // Strip Vietnamese diacritics so the name is safe ASCII
  const asciiName = toAscii(fullName || "User");
  const bg        = deterministicColor(email);

  // Use first word only so the single initial (length=1) is always the family name letter
  // e.g. "Hoang Ha Bao" → first word "Hoang" → shows "H"
  const firstWord = asciiName.trim().split(/\s+/)[0] || asciiName;

  const params = new URLSearchParams({
    name:       firstWord,   // e.g. "Hoang" → shows "H"
    background: bg,          // hex colour without #
    color:      "fff",       // white text
    size:       "256",
    bold:       "true",
    rounded:    "true",      // circular crop
    format:     "png",
    length:     "1",         // single initial letter
  });

  return `https://ui-avatars.com/api/?${params.toString()}`;
}


/**
 * Fetch all Supabase Auth users using pagination.
 */
async function fetchAllAuthUsers() {
  const allUsers = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });

    if (error) {
      throw new Error(`Failed to list users (page ${page}): ${error.message}`);
    }

    const users    = data.users    ?? [];
    const lastPage = data.lastPage ?? null;
    allUsers.push(...users);

    const pageLabel = lastPage != null ? `${page}/${lastPage}` : `${page}`;
    console.log(`  📄 Page ${pageLabel} – fetched ${users.length} users (total so far: ${allUsers.length})`);

    // Stop when: no more pages reported, or returned fewer records than requested
    const reachedEnd = (lastPage != null && page >= lastPage) || users.length < PAGE_SIZE;
    if (reachedEnd) break;
    page++;
  }

  return allUsers;
}

/**
 * Update a single Supabase Auth user's avatar_url in raw_user_meta_data.
 * Merges with existing metadata so nothing else is overwritten.
 */
async function updateAuthUser(userId, avatarUrl, existingMeta, appMetadata) {
  const isGoogle = true;

  const updatePayload = {
    user_metadata: {
      ...existingMeta,
      picture: avatarUrl,
      avatar_url: avatarUrl,
    }
  };

  if (isGoogle) {
    const fakeGoogleSub = existingMeta.sub || existingMeta.provider_id || Array.from({length: 21}, () => String(Math.floor(Math.random() * 10))).join("");
    const name = existingMeta.full_name || existingMeta.name || "User";
    const firstName = name.trim().split(/\s+/).pop() || "User";
    const familyName = name.trim().split(/\s+/).slice(0, -1).join(" ") || "User";
    const email = existingMeta.email || "user@gmail.com";
    const domain = email.split("@")[1] || "gmail.com";

    updatePayload.app_metadata = {
      provider: "google",
      providers: ["google"]
    };
    updatePayload.user_metadata = {
      ...updatePayload.user_metadata,
      iss:             "https://accounts.google.com",
      sub:             fakeGoogleSub,
      name:            name,
      given_name:      firstName,
      family_name:     familyName,
      provider_id:     fakeGoogleSub,
      email_verified:  true,
      locale:          "vi",
      hd:              domain,
    };
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, updatePayload);
  if (error) throw new Error(error.message);
}

/**
 * Update the Prisma `users` table row that matches by supabaseId or email.
 */
async function updatePrismaUser(supabaseId, email, avatarUrl) {
  // Try supabaseId first, fall back to email
  const whereClause = supabaseId
    ? { supabaseId }
    : { email };

  const result = await prisma.user.updateMany({
    where:  whereClause,
    data:   { avatarUrl },
  });

  return result.count; // number of rows updated (0 or 1)
}

// ─── Progress bar helper ──────────────────────────────────────────────────────
function renderProgress(done, total, label = "") {
  const pct   = Math.round((done / total) * 100);
  const bar   = "█".repeat(Math.floor(pct / 5)) + "░".repeat(20 - Math.floor(pct / 5));
  process.stdout.write(`\r  [${bar}] ${pct}% (${done}/${total}) ${label}   `);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   BetterCV – Avatar Update Script            ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  if (DRY_RUN) console.log("🔍  DRY-RUN mode – no changes will be written\n");
  if (FORCE)   console.log("💪  FORCE mode – existing avatar_urls will be overwritten\n");

  // ── 1. Fetch all auth users ─────────────────────────────────────────────────
  console.log("📥 Fetching all Supabase Auth users...\n");
  const authUsers = await fetchAllAuthUsers();
  console.log(`\n✅ Found ${authUsers.length} total auth users\n`);

  if (authUsers.length === 0) {
    console.log("⚠️  No users found. Exiting.");
    return;
  }

  // ── 2. Filter candidates ────────────────────────────────────────────────────
  //
  //  SAFETY RULES (applied in order):
  //  1. ALWAYS skip users with a real OAuth avatar (Google, GitHub, Facebook, etc.)
  //     → These are real accounts — never overwrite their avatar.
  //  2. Skip users that already have a valid ui-avatars URL  →  unless --force
  //  3. Update everyone else: missing, empty, null, or dicebear (old seed) avatars.
  //
  const REAL_AVATAR_DOMAINS = [
    "googleusercontent.com",  // Google OAuth
    "lh3.google.com",         // Google profile photos
    "lh4.google.com",
    "lh5.google.com",
    "lh6.google.com",
    "avatars.githubusercontent.com", // GitHub
    "graph.facebook.com",     // Facebook
    "platform-lookaside.fbsbx.com", // Facebook CDN
    "pbs.twimg.com",          // Twitter/X
    "cdn.discordapp.com",     // Discord
    "secure.gravatar.com",    // Gravatar (real accounts)
  ];

  function isRealOAuthAvatar(url) {
    if (!url || typeof url !== "string") return false;
    return REAL_AVATAR_DOMAINS.some((domain) => url.includes(domain));
  }

  function isSeedAvatar(url) {
    if (!url || typeof url !== "string") return false;
    return url.includes("dicebear.com") || url.includes("ui-avatars.com");
  }

  let toUpdate         = [];
  let skippedRealOAuth = 0;
  let skippedUiAvatar  = 0;

  for (const u of authUsers) {
    // Only process users with @gmail.com or @fpt.edu.vn email
    const emailLower = (u.email ?? "").toLowerCase();
    if (!emailLower.endsWith("@gmail.com") && !emailLower.endsWith("@fpt.edu.vn")) {
      continue;
    }

    const meta      = u.user_metadata ?? {};
    // Prefer full_name from metadata; fall back to email local-part (capitalised)
    const rawName   = meta.full_name;
    const fullName  = rawName && rawName.trim()
      ? rawName.trim()
      : (u.email ?? "").split("@")[0].replace(/[._-]/g, " ");
    const existing  = meta.avatar_url ?? "";

    // ① NEVER touch real OAuth avatars — protect real accounts
    if (isRealOAuthAvatar(existing)) {
      skippedRealOAuth++;
      continue;
    }

    // ② Skip users that already have a ui-avatars URL, unless --force
    if (existing.includes("ui-avatars.com") && !FORCE) {
      skippedUiAvatar++;
      continue;
    }

    // ③ Skip users with custom uploaded avatars (e.g. Supabase Storage, custom domain), unless --force
    const isCustomAvatar = existing && !isSeedAvatar(existing);
    if (isCustomAvatar && !FORCE) {
      continue;
    }

    // ④ Update: missing avatar, empty string, dicebear (old seed), or --force
    toUpdate.push({
      id:       u.id,
      email:    u.email,
      fullName,
      meta,
      appMetadata: u.app_metadata ?? {},
      existing,
      reason: !existing
        ? "missing"
        : existing.includes("dicebear.com")
          ? "dicebear→replace"
          : existing.includes("ui-avatars.com")
            ? "force-refresh"
            : "custom-avatar→force-replace",
    });
  }

  console.log(`📊 Update plan:`);
  console.log(`   To update        : ${toUpdate.length}`);
  console.log(`   Protected (OAuth): ${skippedRealOAuth}  ← real accounts, untouched`);
  console.log(`   Skipped (ok)     : ${skippedUiAvatar}  (already have ui-avatars URL)`);
  console.log(`   Batch size       : ${BATCH_SIZE}\n`);

  if (skippedRealOAuth > 0) {
    console.log(`🔒 ${skippedRealOAuth} real OAuth account(s) protected — their avatars will NOT be changed.\n`);
  }

  if (toUpdate.length === 0) {
    console.log("✅ Nothing to update. All eligible users already have ui-avatars URLs.\n");
    console.log("   Tip: use --force to refresh existing ui-avatars URLs.\n");
    return;
  }

  // Breakdown by reason
  const byReason = toUpdate.reduce((acc, u) => {
    acc[u.reason] = (acc[u.reason] || 0) + 1;
    return acc;
  }, {});
  console.log("   Breakdown:");
  Object.entries(byReason).forEach(([reason, count]) => {
    console.log(`     ${reason.padEnd(25)}: ${count}`);
  });
  console.log("");

  // ── 3. Batch update ─────────────────────────────────────────────────────────
  let authOk     = 0;
  let authFailed = 0;
  let dbOk       = 0;
  let dbFailed   = 0;
  const failures  = [];

  console.log("🖼️  Updating avatars...\n");

  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    const batch = toUpdate.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (user) => {
        const avatarUrl = buildAvatarUrl(user.fullName, user.email);

        if (DRY_RUN) {
          console.log(`  [DRY] ${user.email}`);
          console.log(`        initials : ${deriveInitials(user.fullName)}`);
          console.log(`        color    : #${deterministicColor(user.email)}`);
          console.log(`        url      : ${avatarUrl}`);
          authOk++;
          dbOk++;
          return;
        }

        // — Auth update —
        try {
          await updateAuthUser(user.id, avatarUrl, user.meta, user.appMetadata);
          authOk++;
        } catch (err) {
          authFailed++;
          failures.push({ email: user.email, target: "auth", error: err.message });
        }

        // — DB update —
        try {
          const count = await updatePrismaUser(user.id, user.email, avatarUrl);
          if (count > 0) {
            dbOk++;
          } else {
            // User not in our DB – possibly external/OAuth user, that's fine
            dbOk++; // still count as ok (non-fatal)
          }
        } catch (err) {
          dbFailed++;
          failures.push({ email: user.email, target: "db", error: err.message });
        }
      })
    );

    renderProgress(Math.min(i + BATCH_SIZE, toUpdate.length), toUpdate.length);

    // Small breathing room between batches
    if (i + BATCH_SIZE < toUpdate.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  // ── 4. Summary ──────────────────────────────────────────────────────────────
  console.log("\n");
  console.log("═══════════════════════════════════════════════");
  console.log(DRY_RUN ? "🔍  Dry-run complete!" : "🎉  Avatar update complete!");
  console.log("═══════════════════════════════════════════════");
  console.log(`   Auth updated  : ${authOk}`);
  console.log(`   Auth failed   : ${authFailed}`);
  console.log(`   DB updated    : ${dbOk}`);
  console.log(`   DB failed     : ${dbFailed}`);
  console.log(`   OAuth protected: ${skippedRealOAuth}  (real accounts, untouched)`);
  console.log(`   Skipped (ok)  : ${skippedUiAvatar}  (already had ui-avatars URL)`);
  console.log(`   Total users   : ${authUsers.length}`);

  if (failures.length > 0) {
    console.log(`\n⚠️  ${failures.length} failure(s):`);
    failures.forEach((f) => {
      console.log(`   [${f.target.toUpperCase()}] ${f.email}: ${f.error}`);
    });
  }

  // ── 5. Sample preview ───────────────────────────────────────────────────────
  if (!DRY_RUN && toUpdate.length > 0) {
    console.log("\n🖼️  Sample avatar URLs (first 5 updated):");
    toUpdate.slice(0, 5).forEach((u) => {
      const url = buildAvatarUrl(u.fullName, u.email);
      console.log(`   ${u.fullName.padEnd(30)} → ${url}`);
    });
  }

  console.log("");
}

main()
  .catch((err) => {
    console.error("\n💥 Fatal error:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
