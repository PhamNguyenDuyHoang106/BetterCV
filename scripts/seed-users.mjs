/**
 * BetterCV – Supabase User Seed Script
 * ─────────────────────────────────────
 * Generates 200 realistic Vietnamese user profiles using Faker.js and
 * inserts them via the Supabase Auth Admin API + Prisma (for the `users`
 * table and `cvs` / `ats_scans` activity data).
 *
 * Usage:
 *   node scripts/seed-users.mjs
 *
 * Prerequisites:
 *   npm install @faker-js/faker @supabase/supabase-js @prisma/client dotenv
 *
 * The script reads SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DATABASE_URL
 * from the .env file at the project root.
 */

import { createClient } from "@supabase/supabase-js";
import { Faker, vi, en } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

// ─── Load .env from project root ──────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
  console.log("✅ Loaded environment from .env");
}

// ─── Configuration ─────────────────────────────────────────────────────────────
const SEED_VALUE   = 42;          // Deterministic seed
const TOTAL_USERS  = 200;
const BATCH_SIZE   = 10;          // Auth API batch size
const DEFAULT_PASSWORD = "BetterCV@2024!";

const SUPABASE_URL              = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL              = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// ─── Clients ───────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const prisma = new PrismaClient();

// ─── Seeded Faker instance ─────────────────────────────────────────────────────
const faker = new Faker({ locale: [vi, en] });
faker.seed(SEED_VALUE);

// ─── Static Data ───────────────────────────────────────────────────────────────

const VIETNAMESE_LAST_NAMES = [
  "Nguyễn","Trần","Lê","Phạm","Hoàng","Huỳnh","Phan","Vũ","Võ","Đặng",
  "Bùi","Đỗ","Hồ","Ngô","Dương","Lý","Đinh","Mai","Trịnh","Lưu",
  "Đoàn","Tô","Cao","Trương","Hà","Ông","Đào","Chu","Giang","Tạ"
];

const VIETNAMESE_MIDDLE_NAMES_MALE = [
  "Văn","Hữu","Đức","Minh","Quang","Xuân","Thành","Hoàng","Tiến","Bá",
  "Công","Trung","Anh","Duy","Khắc","Ngọc","Phúc","Thế","Gia","Hải"
];

const VIETNAMESE_MIDDLE_NAMES_FEMALE = [
  "Thị","Ngọc","Thu","Minh","Thanh","Kiều","Tuyết","Mỹ","Lan","Hà",
  "Như","Huyền","Phương","Ánh","Bích","Mai","Diệu","Yến","Hồng","Châu"
];

const VIETNAMESE_FIRST_NAMES_MALE = [
  "An","Bình","Cường","Dũng","Đức","Hùng","Khoa","Long","Minh","Nam",
  "Phúc","Quân","Tài","Thắng","Toàn","Trí","Tùng","Vinh","Việt","Tâm",
  "Sơn","Nguyên","Khải","Tuấn","Hòa","Lâm","Đạt","Hưng","Kiên","Thịnh",
  "Khánh","Linh","Nghĩa","Phong","Quốc","Thiện","Đình","Trung","Vũ","Hiếu"
];

const VIETNAMESE_FIRST_NAMES_FEMALE = [
  "Anh","Bảo","Chi","Diễm","Giang","Hà","Hương","Lan","Linh","Mai",
  "Ngân","Ngọc","Phương","Quỳnh","Thu","Thủy","Trang","Trâm","Vy","Yến",
  "An","Châu","Dung","Hạnh","Hiền","Hoa","Khánh","Loan","Nhi","Tâm",
  "Thảo","Thúy","Tiên","Trinh","Vân","Xuân","Ánh","Bích","Hồng","Thanh"
];

const EMAIL_DOMAINS = ["gmail.com", "fpt.edu.vn"];

const UNIVERSITIES = [
  "FPT University",
  "University of Information Technology (UIT)",
  "Ho Chi Minh City University of Technology (HCMUT)",
  "Foreign Trade University (FTU)",
  "University of Economics Ho Chi Minh City (UEH)",
  "Hanoi University of Science and Technology (HUST)"
];

const MAJORS = [
  "Software Engineering",
  "Information Systems",
  "Artificial Intelligence",
  "Computer Science",
  "Data Science",
  "Business Administration",
  "Digital Marketing"
];

const JOB_TITLES = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "Product Manager",
  "Business Analyst",
  "QA Engineer",
  "DevOps Engineer",
  "UI/UX Designer"
];

const CAREER_LEVELS = ["Intern","Junior","Mid-level","Senior","Lead","Staff","Principal","Manager","Director"];

const SKILLS_BY_ROLE = {
  "Software Engineer":     ["Java","Spring Boot","Python","Docker","Kubernetes","PostgreSQL","Redis","Git","REST API","Microservices","CI/CD","JUnit","Maven","Linux","AWS"],
  "Frontend Developer":    ["React","TypeScript","Next.js","Vue.js","HTML5","CSS3","Tailwind CSS","Redux","GraphQL","Webpack","Jest","Figma","Responsive Design","REST API","Git"],
  "Backend Developer":     ["Node.js","NestJS","PostgreSQL","MongoDB","Redis","Docker","AWS","REST API","GraphQL","Python","FastAPI","JWT","Microservices","CI/CD","Git"],
  "Full Stack Developer":  ["React","Node.js","TypeScript","PostgreSQL","MongoDB","Docker","AWS","REST API","GraphQL","Next.js","Git","Redis","CI/CD","Tailwind CSS","Prisma"],
  "Data Analyst":          ["Python","SQL","Power BI","Tableau","Excel","Pandas","NumPy","Statistics","Data Visualization","ETL","BigQuery","Looker","R","A/B Testing","Machine Learning"],
  "Data Scientist":        ["Python","Machine Learning","TensorFlow","PyTorch","SQL","Scikit-learn","NLP","Deep Learning","Jupyter","Statistics","MLflow","Docker","BigQuery","Spark","Feature Engineering"],
  "Product Manager":       ["Product Strategy","Roadmap Planning","Agile","Scrum","JIRA","User Research","A/B Testing","Data Analysis","SQL","Figma","Stakeholder Management","OKRs","Go-to-Market","Analytics","Wireframing"],
  "Business Analyst":      ["Requirements Analysis","SQL","Power BI","Tableau","Excel","JIRA","Agile","Process Modeling","Stakeholder Management","Data Analysis","BPMN","User Stories","Gap Analysis","Documentation","Reporting"],
  "QA Engineer":           ["Selenium","Cypress","Postman","JIRA","SQL","API Testing","Test Planning","Bug Reporting","Agile","Python","Jest","Regression Testing","Performance Testing","CI/CD","TestRail"],
  "DevOps Engineer":       ["Docker","Kubernetes","AWS","Terraform","Ansible","CI/CD","Linux","Shell Scripting","Prometheus","Grafana","Git","Jenkins","Helm","EKS","Infrastructure as Code"],
  "UI/UX Designer":        ["Figma","Adobe XD","User Research","Wireframing","Prototyping","Usability Testing","Design Systems","Sketch","Zeplin","HTML/CSS","Interaction Design","Information Architecture","Adobe Illustrator","Photoshop","Responsive Design"]
};

const AVATAR_SEEDS_MALE = Array.from({length: 100}, (_, i) => `male-vn-${i + 1}`);
const AVATAR_SEEDS_FEMALE = Array.from({length: 100}, (_, i) => `female-vn-${i + 1}`);

// ─── Helper Functions ──────────────────────────────────────────────────────────

function randomItem(arr) {
  return arr[Math.floor(faker.number.float() * arr.length)];
}

function randomIntBetween(min, max) {
  return Math.floor(faker.number.float() * (max - min + 1)) + min;
}

function randomDateBetween(start, end) {
  const startMs = start.getTime();
  const endMs   = end.getTime();
  return new Date(startMs + faker.number.float() * (endMs - startMs));
}

/**
 * Generate a full Vietnamese name object.
 * Returns { fullName, firstName, gender }
 */
function generateVietnameseName() {
  const gender  = faker.number.float() < 0.5 ? "male" : "female";
  const lastName  = randomItem(VIETNAMESE_LAST_NAMES);
  const middleName = gender === "male"
    ? randomItem(VIETNAMESE_MIDDLE_NAMES_MALE)
    : randomItem(VIETNAMESE_MIDDLE_NAMES_FEMALE);
  const firstName = gender === "male"
    ? randomItem(VIETNAMESE_FIRST_NAMES_MALE)
    : randomItem(VIETNAMESE_FIRST_NAMES_FEMALE);

  return {
    fullName: `${lastName} ${middleName} ${firstName}`,
    firstName,
    lastName,
    gender
  };
}

/**
 * Convert a Vietnamese name to an ASCII-safe slug for email generation.
 * Strips diacritics and converts to lowercase.
 */
function toAsciiSlug(str) {
  const map = {
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
    "đ":"d","Đ":"d",
    "À":"a","Á":"a","Ả":"a","Ã":"a","Ạ":"a",
    "Ă":"a","Ắ":"a","Ằ":"a","Ẳ":"a","Ẵ":"a","Ặ":"a",
    "Â":"a","Ấ":"a","Ầ":"a","Ẩ":"a","Ẫ":"a","Ậ":"a",
    "È":"e","É":"e","Ẻ":"e","Ẽ":"e","Ẹ":"e",
    "Ê":"e","Ế":"e","Ề":"e","Ể":"e","Ễ":"e","Ệ":"e",
    "Ì":"i","Í":"i","Ỉ":"i","Ĩ":"i","Ị":"i",
    "Ò":"o","Ó":"o","Ỏ":"o","Õ":"o","Ọ":"o",
    "Ô":"o","Ố":"o","Ồ":"o","Ổ":"o","Ỗ":"o","Ộ":"o",
    "Ơ":"o","Ớ":"o","Ờ":"o","Ở":"o","Ỡ":"o","Ợ":"o",
    "Ù":"u","Ú":"u","Ủ":"u","Ũ":"u","Ụ":"u",
    "Ư":"u","Ứ":"u","Ừ":"u","Ử":"u","Ữ":"u","Ự":"u",
    "Ỳ":"y","Ý":"y","Ỷ":"y","Ỹ":"y","Ỵ":"y"
  };
  return str.split("").map(c => map[c] || c).join("").toLowerCase().replace(/\s+/g, ".");
}

/**
 * Generate a realistic email for a Vietnamese name.
 * Avoids test-style patterns.
 */
function generateEmail(firstName, lastName, usedEmails) {
  const firstSlug = toAsciiSlug(firstName);
  const lastSlug  = toAsciiSlug(lastName);
  const domain    = randomItem(EMAIL_DOMAINS);

  const patterns = [
    () => `${firstSlug}.${lastSlug}`,
    () => `${lastSlug}.${firstSlug}`,
    () => `${firstSlug}${lastSlug}`,
    () => `${lastSlug}${firstSlug}`,
    () => `${firstSlug}.${lastSlug}${randomIntBetween(1990, 2005)}`,
    () => `${firstSlug}${randomIntBetween(10, 99)}.${lastSlug}`,
    () => `${lastSlug}.${firstSlug}${randomIntBetween(1, 99)}`,
    () => `${firstSlug[0]}${lastSlug}${randomIntBetween(1980, 2005)}`,
  ];

  // Shuffle patterns and try until we find a unique one
  const shuffled = [...patterns].sort(() => faker.number.float() - 0.5);
  for (const patternFn of shuffled) {
    const localPart = patternFn().replace(/\s+/g,"").toLowerCase();
    const email = `${localPart}@${domain}`;
    if (!usedEmails.has(email)) {
      usedEmails.add(email);
      return email;
    }
  }
  // Final fallback with uuid suffix
  const fallback = `${firstSlug}.${lastSlug}.${faker.string.alphanumeric(6)}@${domain}`;
  usedEmails.add(fallback);
  return fallback;
}

/**
 * Generate a Vietnamese phone number: 03x, 07x, 08x, 09x prefixes.
 */
function generateVietnamesePhone() {
  const prefixes = ["032","033","034","035","036","037","038","039",
                    "070","076","077","078","079",
                    "081","082","083","084","085","086","089",
                    "090","091","092","093","094","096","097","098"];
  const prefix = randomItem(prefixes);
  const suffix = String(randomIntBetween(1000000, 9999999)).padStart(7, "0");
  return `+84 ${prefix.slice(1)} ${suffix.slice(0,3)} ${suffix.slice(3)}`;
}

/**
 * Generate a realistic avatar URL using DiceBear API with face-style avatars.
 * Uses ui-avatars as a fallback that's always accessible.
 */
function generateAvatarUrl(fullName, gender) {
  const nameEncoded = encodeURIComponent(fullName);
  const bgColors = gender === "male"
    ? ["0d6efd","0dcaf0","198754","6f42c1","20c997"]
    : ["d63384","fd7e14","6610f2","dc3545","ffc107"];
  const bg = randomItem(bgColors);

  // Use DiceBear with gender-appropriate style
  const style    = gender === "male" ? "adventurer" : "adventurer-neutral";
  const seedWord = toAsciiSlug(fullName) + randomIntBetween(1, 999);
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seedWord)}&backgroundColor=${bg}`;
}

/**
 * Determine user activity tier: "active" (20%), "moderate" (50%), "inactive" (30%).
 */
function getActivityTier() {
  const r = faker.number.float();
  if (r < 0.20) return "active";
  if (r < 0.70) return "moderate";
  return "inactive";
}

/**
 * Generate resume count based on activity tier.
 */
function getResumeCount(tier) {
  if (tier === "active")   return randomIntBetween(3, 5);
  if (tier === "moderate") return randomIntBetween(1, 3);
  return randomIntBetween(1, 2);
}

/**
 * Generate ATS score based on activity tier.
 */
function getAtsScore(tier) {
  if (tier === "active")   return randomIntBetween(72, 98);
  if (tier === "moderate") return randomIntBetween(55, 82);
  return randomIntBetween(45, 65);
}

// ─── Generate User Profiles ────────────────────────────────────────────────────

function generateUsers(count) {
  const usedEmails = new Set();
  const users = [];
  const now = new Date();
  const eighteenMonthsAgo = new Date(now);
  eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);

  for (let i = 0; i < count; i++) {
    const { fullName, firstName, lastName, gender } = generateVietnameseName();

    // Date of birth: 1990–2005
    const dob = randomDateBetween(new Date("1990-01-01"), new Date("2005-12-31"));
    const dobYear = dob.getFullYear();

    // Account creation: last 18 months
    const createdAt = randomDateBetween(eighteenMonthsAgo, now);

    // Last sign-in: after creation, up to now
    const lastSignInAt = randomDateBetween(createdAt, now);

    // University & major
    const university = randomItem(UNIVERSITIES);
    const major = randomItem(MAJORS);

    // Graduation year: dob year + 18 to 22 years, cap at 2026
    const gradYear = Math.min(dobYear + randomIntBetween(18, 22), 2026);

    // Job & career
    const jobTitle = randomItem(JOB_TITLES);
    const yearsExp = randomIntBetween(0, 10);
    const careerLevel = (() => {
      if (yearsExp === 0)      return "Intern";
      if (yearsExp <= 1)       return "Junior";
      if (yearsExp <= 3)       return "Junior";
      if (yearsExp <= 5)       return "Mid-level";
      if (yearsExp <= 7)       return "Senior";
      if (yearsExp <= 9)       return "Lead";
      return "Staff";
    })();

    // Skills: pick 5–15 relevant skills
    const allSkills = SKILLS_BY_ROLE[jobTitle] || SKILLS_BY_ROLE["Software Engineer"];
    const skillCount = randomIntBetween(5, Math.min(15, allSkills.length));
    const shuffledSkills = [...allSkills].sort(() => faker.number.float() - 0.5);
    const skills = shuffledSkills.slice(0, skillCount);

    // Email & phone
    const email = generateEmail(firstName, lastName, usedEmails);
    const phone = generateVietnamesePhone();

    // Avatar
    const avatarUrl = generateAvatarUrl(fullName, gender);

    // Activity
    const activityTier = getActivityTier();
    const resumeCount  = getResumeCount(activityTier);

    users.push({
      fullName,
      firstName,
      lastName,
      gender,
      email,
      phone,
      dob,
      createdAt,
      lastSignInAt,
      university,
      major,
      graduationYear: gradYear,
      jobTitle,
      yearsOfExperience: yearsExp,
      careerLevel,
      skills,
      avatarUrl,
      activityTier,
      resumeCount
    });
  }

  return users;
}

// ─── Resume Generator ──────────────────────────────────────────────────────────

function generateResumesForUser(user, supabaseUserId, prismaUserId) {
  const resumes = [];
  const now = new Date();

  const cvTitleOptions = [
    `${user.jobTitle} Resume`,
    `${user.fullName} - ${user.jobTitle}`,
    `${user.major} Graduate CV`,
    `Updated ${user.jobTitle} CV`,
    `${user.careerLevel} ${user.jobTitle}`,
  ];

  for (let r = 0; r < user.resumeCount; r++) {
    // Resume created between account creation and now
    const cvCreatedAt = randomDateBetween(user.createdAt, now);
    // Last updated: created to now
    const cvUpdatedAt = randomDateBetween(cvCreatedAt, now);
    const atsScore    = getAtsScore(user.activityTier);
    const title       = randomItem(cvTitleOptions) + (r > 0 ? ` v${r + 1}` : "");

    resumes.push({
      userId:    prismaUserId,
      title,
      locale:    "vi",
      templateId: null,
      isDeleted:  false,
      createdAt:  cvCreatedAt,
      updatedAt:  cvUpdatedAt,
      atsScore,
      atsScannedAt: cvUpdatedAt,
      atsVersion:   "v2",
      thumbnailStatus: "PENDING",
      sections: {
        PROFILE: {
          fullName: user.fullName,
          title:    user.jobTitle,
          email:    user.email,
          phone:    user.phone,
          linkedin: `https://linkedin.com/in/${toAsciiSlug(user.fullName).replace(/\./g, "-")}`,
        },
        SUMMARY: {
          text: `${user.careerLevel} ${user.jobTitle} with ${user.yearsOfExperience} year(s) of experience in ${user.major}. Graduated from ${user.university}.`
        },
        SKILLS: {
          items: user.skills
        }
      }
    });
  }

  return resumes;
}

// ─── Main Seed Logic ───────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 BetterCV Seed Script – Starting...\n");
  console.log(`📊 Generating ${TOTAL_USERS} user profiles (seed: ${SEED_VALUE})...`);

  const users = generateUsers(TOTAL_USERS);

  console.log(`✅ Generated ${users.length} profiles\n`);
  console.log(`🔐 Activity distribution:`);
  const activeCount   = users.filter(u => u.activityTier === "active").length;
  const moderateCount = users.filter(u => u.activityTier === "moderate").length;
  const inactiveCount = users.filter(u => u.activityTier === "inactive").length;
  console.log(`   Active   : ${activeCount} (${Math.round(activeCount/TOTAL_USERS*100)}%)`);
  console.log(`   Moderate : ${moderateCount} (${Math.round(moderateCount/TOTAL_USERS*100)}%)`);
  console.log(`   Inactive : ${inactiveCount} (${Math.round(inactiveCount/TOTAL_USERS*100)}%)\n`);

  // ── Step 1: Create Supabase Auth users in batches ──────────────────────────
  console.log("📤 Creating Supabase Auth users in batches...\n");

  const createdAuthUsers = [];
  const failedUsers      = [];

  const batches = [];
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    batches.push(users.slice(i, i + BATCH_SIZE));
  }

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    console.log(`  Batch ${batchIdx + 1}/${batches.length} (users ${batchIdx * BATCH_SIZE + 1}–${Math.min((batchIdx + 1) * BATCH_SIZE, users.length)})...`);

    const batchPromises = batch.map(async (user) => {
      try {
        const fakeGoogleSub = Array.from({length: 21}, () => String(Math.floor(faker.number.float() * 10))).join("");
        const { data, error } = await supabase.auth.admin.createUser({
          email:          user.email,
          password:       DEFAULT_PASSWORD,
          email_confirm:  true,
          phone:          user.phone.replace(/\s+/g,""),
          created_at:     user.createdAt.toISOString(),
          app_metadata: {
            provider: "google",
            providers: ["google"]
          },
          user_metadata: {
            iss:             "https://accounts.google.com",
            sub:             fakeGoogleSub,
            name:            user.fullName,
            given_name:      user.firstName,
            family_name:     user.fullName.split(" ").slice(0, -1).join(" ") || user.lastName,
            email:           user.email,
            picture:         user.avatarUrl,
            full_name:       user.fullName,
            avatar_url:      user.avatarUrl,
            provider_id:     fakeGoogleSub,
            email_verified:  true,
            phone_verified:  false,
            locale:          "vi",
            hd:              user.email.split("@")[1] || "gmail.com",
            phone:           user.phone,
            university:      user.university,
            major:           user.major,
            graduation_year: user.graduationYear,
            job_title:       user.jobTitle,
            years_of_experience: user.yearsOfExperience,
            career_level:    user.careerLevel,
            skills:          user.skills,
            gender:          user.gender,
            date_of_birth:   user.dob.toISOString().split("T")[0]
          }
        });

        if (error) {
          if (error.message?.includes("already been registered") || error.status === 422) {
            console.log(`    ⚠️  Skip (already exists): ${user.email}`);
          } else {
            console.error(`    ❌ Failed: ${user.email} → ${error.message}`);
            failedUsers.push({ user, error: error.message });
          }
          return null;
        }

        return { supabaseUser: data.user, profile: user };
      } catch (err) {
        console.error(`    ❌ Exception for ${user.email}: ${err.message}`);
        failedUsers.push({ user, error: err.message });
        return null;
      }
    });

    const results = await Promise.all(batchPromises);
    const successful = results.filter(Boolean);
    createdAuthUsers.push(...successful);

    console.log(`    ✅ Batch ${batchIdx + 1}: ${successful.length}/${batch.length} created`);

    // Small delay to avoid rate-limiting
    if (batchIdx < batches.length - 1) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`\n📊 Auth creation summary:`);
  console.log(`   Success : ${createdAuthUsers.length}`);
  console.log(`   Failed  : ${failedUsers.length}\n`);

  if (createdAuthUsers.length === 0) {
    console.log("⚠️  No users created. Exiting.");
    return;
  }

  // ── Step 2: Sync to Prisma `users` table ──────────────────────────────────
  console.log("💾 Syncing users to database (Prisma)...\n");

  const prismaUserMap = new Map(); // supabaseId → prisma user id

  for (let i = 0; i < createdAuthUsers.length; i++) {
    const { supabaseUser, profile } = createdAuthUsers[i];

    try {
      const dbUser = await prisma.user.upsert({
        where:  { email: profile.email },
        update: {
          fullName:   profile.fullName,
          avatarUrl:  profile.avatarUrl,
          supabaseId: supabaseUser.id,
          isActive:   true,
          updatedAt:  profile.lastSignInAt
        },
        create: {
          email:      profile.email,
          fullName:   profile.fullName,
          avatarUrl:  profile.avatarUrl,
          supabaseId: supabaseUser.id,
          role:       "FREE",
          isActive:   true,
          createdAt:  profile.createdAt
        }
      });

      prismaUserMap.set(supabaseUser.id, dbUser.id);

      if ((i + 1) % 20 === 0) {
        process.stdout.write(`  Progress: ${i + 1}/${createdAuthUsers.length}\r`);
      }
    } catch (err) {
      console.error(`  ❌ DB sync failed for ${profile.email}: ${err.message}`);
    }
  }

  console.log(`\n✅ Database sync: ${prismaUserMap.size}/${createdAuthUsers.length} users\n`);

  // ── Step 3: Generate CVs for each user ────────────────────────────────────
  console.log("📄 Creating CV records...\n");

  let totalCvsCreated = 0;

  for (const { supabaseUser, profile } of createdAuthUsers) {
    const prismaUserId = prismaUserMap.get(supabaseUser.id);
    if (!prismaUserId) continue;

    const resumeData = generateResumesForUser(profile, supabaseUser.id, prismaUserId);

    for (const resumeDatum of resumeData) {
      try {
        const { sections, ...cvData } = resumeDatum;

        const cv = await prisma.cv.create({
          data: {
            userId:          cvData.userId,
            title:           cvData.title,
            locale:          cvData.locale,
            isDeleted:       cvData.isDeleted,
            createdAt:       cvData.createdAt,
            updatedAt:       cvData.updatedAt,
            atsScore:        cvData.atsScore,
            atsScannedAt:    cvData.atsScannedAt,
            atsVersion:      cvData.atsVersion,
            thumbnailStatus: cvData.thumbnailStatus,
          }
        });

        // Create CV sections
        const sectionOrder = { PROFILE: 1, SUMMARY: 2, EXPERIENCE: 3, EDUCATION: 4, SKILLS: 5, PROJECTS: 6 };
        const sectionTypes = Object.keys(sections);

        for (const sectionType of sectionTypes) {
          if (!["PROFILE","SUMMARY","EXPERIENCE","EDUCATION","SKILLS","PROJECTS"].includes(sectionType)) continue;
          await prisma.cvSection.create({
            data: {
              cvId:      cv.id,
              type:      sectionType,
              content:   sections[sectionType],
              order:     sectionOrder[sectionType] || 99,
              createdAt: cvData.createdAt,
              updatedAt: cvData.updatedAt
            }
          });
        }

        // Create ATS scan record if score exists
        if (cvData.atsScore) {
          const keywordScore     = Math.max(cvData.atsScore - randomIntBetween(0, 15), 40);
          const formatScore      = Math.max(cvData.atsScore - randomIntBetween(0, 10), 45);
          const completenessScore = Math.max(cvData.atsScore - randomIntBetween(0, 12), 40);
          const semanticScore    = Math.max(cvData.atsScore - randomIntBetween(0, 8),  45);
          const skillsScore      = Math.max(cvData.atsScore - randomIntBetween(0, 10), 40);

          await prisma.atsScan.create({
            data: {
              cvId:             cv.id,
              jobTitle:         profile.jobTitle,
              overallScore:     cvData.atsScore,
              keywordScore,
              formatScore,
              completenessScore,
              semanticScore,
              skillsScore,
              aiModel:          "gpt-4o-mini",
              promptVersion:    "v2",
              missingKeywords:  [],
              recommendations:  ["Thêm thành tích cụ thể với số liệu", "Mở rộng phần kinh nghiệm"],
              createdAt:        cvData.atsScannedAt
            }
          });
        }

        totalCvsCreated++;
      } catch (err) {
        console.error(`  ❌ CV creation failed for user ${prismaUserId}: ${err.message}`);
      }
    }
  }

  console.log(`✅ Created ${totalCvsCreated} CV records\n`);

  // ── Step 4: Final Summary ──────────────────────────────────────────────────
  console.log("═══════════════════════════════════════");
  console.log("🎉 Seed completed!");
  console.log("═══════════════════════════════════════");
  console.log(`   Auth users created : ${createdAuthUsers.length}`);
  console.log(`   DB users synced    : ${prismaUserMap.size}`);
  console.log(`   CVs created        : ${totalCvsCreated}`);
  console.log(`   Failed auth users  : ${failedUsers.length}`);

  if (failedUsers.length > 0) {
    console.log("\n⚠️  Failed users:");
    failedUsers.forEach(f => {
      console.log(`   - ${f.user.email}: ${f.error}`);
    });
  }

  console.log("\n✅ All done! Default password for all users:", DEFAULT_PASSWORD);
}

main()
  .catch((err) => {
    console.error("\n💥 Fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
