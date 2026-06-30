/**
 * BetterCV – Skill & Course Seeding Script
 * ─────────────────────────────────────────
 * Populates the database with initial Skill Taxonomy, Skill Dependency Graph,
 * and Course Catalog data.
 *
 * Usage:
 *   node scripts/seed-skills-and-courses.mjs
 *
 * The script reads DATABASE_URL from the .env file at the project root.
 */

import { PrismaClient } from "@prisma/client";
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

const prisma = new PrismaClient();

const SKILLS_DATA = [
  // DevOps & Cloud
  { name: "Linux", category: "DEVOPS", difficulty: "BEGINNER", estimatedWeeks: 2 },
  { name: "Git", category: "SOFT_SKILL", difficulty: "BEGINNER", estimatedWeeks: 1 },
  { name: "Docker", category: "DEVOPS", difficulty: "INTERMEDIATE", estimatedWeeks: 2, dependsOn: ["Linux"] },
  { name: "AWS", category: "CLOUD", difficulty: "INTERMEDIATE", estimatedWeeks: 4, dependsOn: ["Linux"] },
  { name: "Kubernetes", category: "DEVOPS", difficulty: "ADVANCED", estimatedWeeks: 4, dependsOn: ["Docker", "AWS"] },
  { name: "CI/CD", category: "DEVOPS", difficulty: "INTERMEDIATE", estimatedWeeks: 2, dependsOn: ["Docker", "Git"] },

  // Frontend
  { name: "CSS", category: "FRONTEND", difficulty: "BEGINNER", estimatedWeeks: 1 },
  { name: "TailwindCSS", category: "FRONTEND", difficulty: "BEGINNER", estimatedWeeks: 1, dependsOn: ["CSS"] },
  { name: "JavaScript", category: "FRONTEND", difficulty: "BEGINNER", estimatedWeeks: 2 },
  { name: "TypeScript", category: "FRONTEND", difficulty: "INTERMEDIATE", estimatedWeeks: 2, dependsOn: ["JavaScript"] },
  { name: "React", category: "FRONTEND", difficulty: "INTERMEDIATE", estimatedWeeks: 3, dependsOn: ["JavaScript"] },
  { name: "Next.js", category: "FRONTEND", difficulty: "INTERMEDIATE", estimatedWeeks: 3, dependsOn: ["React", "TypeScript"] },

  // Backend & Databases
  { name: "SQL", category: "DATABASE", difficulty: "BEGINNER", estimatedWeeks: 2 },
  { name: "PostgreSQL", category: "DATABASE", difficulty: "INTERMEDIATE", estimatedWeeks: 2, dependsOn: ["SQL"] },
  { name: "MongoDB", category: "DATABASE", difficulty: "INTERMEDIATE", estimatedWeeks: 2 },
  { name: "Redis", category: "DATABASE", difficulty: "INTERMEDIATE", estimatedWeeks: 2 },
  { name: "Node.js", category: "BACKEND", difficulty: "BEGINNER", estimatedWeeks: 2, dependsOn: ["JavaScript"] },
  { name: "NestJS", category: "BACKEND", difficulty: "INTERMEDIATE", estimatedWeeks: 3, dependsOn: ["Node.js", "TypeScript"] },
  { name: "Go", category: "BACKEND", difficulty: "BEGINNER", estimatedWeeks: 3 },
  { name: "Python", category: "BACKEND", difficulty: "BEGINNER", estimatedWeeks: 2 },
  { name: "FastAPI", category: "BACKEND", difficulty: "INTERMEDIATE", estimatedWeeks: 2, dependsOn: ["Python"] },
  { name: "System Design", category: "BACKEND", difficulty: "ADVANCED", estimatedWeeks: 4 },
  { name: "Microservices", category: "BACKEND", difficulty: "ADVANCED", estimatedWeeks: 3, dependsOn: ["System Design", "Docker"] },

  // AI & ML
  { name: "Machine Learning", category: "AI_ML", difficulty: "INTERMEDIATE", estimatedWeeks: 4, dependsOn: ["Python"] },
  { name: "Deep Learning", category: "AI_ML", difficulty: "ADVANCED", estimatedWeeks: 6, dependsOn: ["Machine Learning"] },

  // Mobile
  { name: "Kotlin", category: "MOBILE", difficulty: "BEGINNER", estimatedWeeks: 3 },
  { name: "Swift", category: "MOBILE", difficulty: "BEGINNER", estimatedWeeks: 3 }
];

const COURSES_DATA = [
  // Linux
  { title: "Linux for Beginners Course", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=wBp0Rb-ZJak", skillName: "Linux", level: "BEGINNER", durationMin: 360 },
  { title: "Linux Administration Bootcamp", provider: "YouTube", url: "https://www.youtube.com/watch?v=V1y-mbwm3B8", skillName: "Linux", level: "INTERMEDIATE", durationMin: 180 },
  
  // Git
  { title: "Git and GitHub for Beginners", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=RGOj5yH7evk", skillName: "Git", level: "BEGINNER", durationMin: 270 },
  { title: "Git Advanced Techniques Tutorial", provider: "YouTube", url: "https://www.youtube.com/watch?v=ecK3-P5U37U", skillName: "Git", level: "ADVANCED", durationMin: 45 },

  // Docker
  { title: "Docker Tutorial for Beginners", provider: "Programming with Mosh", url: "https://www.youtube.com/watch?v=pTFZFxd4hOI", skillName: "Docker", level: "BEGINNER", durationMin: 60 },
  { title: "Docker Course for Beginners", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=3c-iFnVzZyA", skillName: "Docker", level: "BEGINNER", durationMin: 180 },

  // AWS
  { title: "AWS Certified Cloud Practitioner Training", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=SOTamWGuDKc", skillName: "AWS", level: "BEGINNER", durationMin: 780 },
  { title: "AWS Solution Architect Associate Course", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=Ia-UEYYR44Y", skillName: "AWS", level: "INTERMEDIATE", durationMin: 600 },

  // Kubernetes
  { title: "Kubernetes Tutorial for Beginners", provider: "TechWorld with Nana", url: "https://www.youtube.com/watch?v=X48VuDVv0do", skillName: "Kubernetes", level: "BEGINNER", durationMin: 210 },
  { title: "Kubernetes Full Course", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=d6WC5n9G_sM", skillName: "Kubernetes", level: "INTERMEDIATE", durationMin: 300 },

  // CI/CD
  { title: "DevOps CI/CD Tutorial", provider: "YouTube", url: "https://www.youtube.com/watch?v=scEDHsr3APg", skillName: "CI/CD", level: "BEGINNER", durationMin: 120 },
  { title: "GitHub Actions CI/CD Full Course", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=R8_veQiYUrw", skillName: "CI/CD", level: "INTERMEDIATE", durationMin: 150 },

  // CSS & Tailwind
  { title: "CSS Full Course for Beginners", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=OXGznpKZ_sA", skillName: "CSS", level: "BEGINNER", durationMin: 360 },
  { title: "Tailwind CSS Full Course", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=ft30ycDx70c", skillName: "TailwindCSS", level: "BEGINNER", durationMin: 200 },

  // JavaScript & TypeScript
  { title: "JavaScript Full Course", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=PkZNo7MFNFg", skillName: "JavaScript", level: "BEGINNER", durationMin: 200 },
  { title: "TypeScript Course for Beginners", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=30LWjhZzg50", skillName: "TypeScript", level: "BEGINNER", durationMin: 240 },
  { title: "TypeScript Advanced Tutorial", provider: "YouTube", url: "https://www.youtube.com/watch?v=hBShsAnx2tU", skillName: "TypeScript", level: "ADVANCED", durationMin: 120 },

  // React & Next.js
  { title: "React JS Full Course for Beginners", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=bMknfKXIFA8", skillName: "React", level: "BEGINNER", durationMin: 700 },
  { title: "Next.js Full Course", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=ZjAqacIY_wM", skillName: "Next.js", level: "BEGINNER", durationMin: 300 },
  { title: "Next.js 14 Developer Guide", provider: "YouTube", url: "https://www.youtube.com/watch?v=wm5gMKuwSYk", skillName: "Next.js", level: "INTERMEDIATE", durationMin: 180 },

  // SQL & Databases
  { title: "SQL Tutorial for Beginners", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=HXTtLSGGDyA", skillName: "SQL", level: "BEGINNER", durationMin: 260 },
  { title: "PostgreSQL Tutorial for Beginners", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=qw--VYLpxG4", skillName: "PostgreSQL", level: "BEGINNER", durationMin: 260 },
  { title: "PostgreSQL Database Administration", provider: "YouTube", url: "https://www.youtube.com/watch?v=SpfIwlAYaKk", skillName: "PostgreSQL", level: "INTERMEDIATE", durationMin: 240 },
  { title: "MongoDB Complete Tutorial", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=ExcRbA7fy_A", skillName: "MongoDB", level: "BEGINNER", durationMin: 180 },
  { title: "Redis Crash Course", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=jgpVdJB2sKQ", skillName: "Redis", level: "BEGINNER", durationMin: 75 },

  // Node.js & NestJS
  { title: "Node.js and Express.js Full Course", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=Oe421EPjeBE", skillName: "Node.js", level: "BEGINNER", durationMin: 480 },
  { title: "NestJS Crash Course", provider: "YouTube", url: "https://www.youtube.com/watch?v=GHTA143_b-s", skillName: "NestJS", level: "BEGINNER", durationMin: 90 },
  { title: "NestJS Enterprise Microservices", provider: "YouTube", url: "https://www.youtube.com/watch?v=y3nE_aT8P4M", skillName: "NestJS", level: "INTERMEDIATE", durationMin: 210 },

  // Go & Python
  { title: "Go Programming Full Course", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=yyUHQIec83I", skillName: "Go", level: "BEGINNER", durationMin: 400 },
  { title: "Python for Beginners", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=eWRfhZUzrAM", skillName: "Python", level: "BEGINNER", durationMin: 300 },
  { title: "FastAPI Complete Tutorial", provider: "YouTube", url: "https://www.youtube.com/watch?v=tLKKmouUrms", skillName: "FastAPI", level: "BEGINNER", durationMin: 150 },

  // System Design & Microservices
  { title: "System Design for Beginners", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=m8IOfRcxT4I", skillName: "System Design", level: "BEGINNER", durationMin: 120 },
  { title: "System Design Interview Prep", provider: "YouTube", url: "https://www.youtube.com/watch?v=SqcXyQdRBlw", skillName: "System Design", level: "INTERMEDIATE", durationMin: 240 },
  { title: "Microservices Architecture Tutorial", provider: "YouTube", url: "https://www.youtube.com/watch?v=CdBtNQZH8a4", skillName: "Microservices", level: "BEGINNER", durationMin: 60 },

  // AI & ML
  { title: "Machine Learning for Everybody", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=i_LwzRVP7bg", skillName: "Machine Learning", level: "BEGINNER", durationMin: 230 },
  { title: "Deep Learning with PyTorch", provider: "FreeCodeCamp", url: "https://www.youtube.com/watch?v=V_xro1bcAuA", skillName: "Deep Learning", level: "BEGINNER", durationMin: 1500 },

  // Mobile
  { title: "Kotlin for Beginners Course", provider: "YouTube", url: "https://www.youtube.com/watch?v=F9UC9DY-vIU", skillName: "Kotlin", level: "BEGINNER", durationMin: 120 },
  { title: "SwiftUI Full Course for Beginners", provider: "YouTube", url: "https://www.youtube.com/watch?v=hG9JbYAlgWk", skillName: "Swift", level: "BEGINNER", durationMin: 360 }
];

async function main() {
  console.log("🚀 Starting Skill & Course Seeding...");

  // 1. Clear existing data in topological dependencies order
  console.log("🧹 Clearing old Skills, Dependencies, and Courses...");
  await prisma.course.deleteMany({});
  await prisma.skillDependency.deleteMany({});
  await prisma.skill.deleteMany({});
  console.log("🧹 DB clean up completed.");

  // 2. Insert Skills (without dependencies first)
  console.log("🌱 Seeding Skills...");
  const skillMap = new Map();

  for (const s of SKILLS_DATA) {
    const created = await prisma.skill.create({
      data: {
        name: s.name,
        category: s.category,
        difficulty: s.difficulty,
        estimatedWeeks: s.estimatedWeeks
      }
    });
    skillMap.set(s.name, created.id);
  }
  console.log(`✅ Seeded ${skillMap.size} skills.`);

  // 3. Insert Skill Dependencies
  console.log("🔗 Seeding Skill Dependencies...");
  let depCount = 0;
  for (const s of SKILLS_DATA) {
    if (s.dependsOn && s.dependsOn.length > 0) {
      const skillId = skillMap.get(s.name);
      for (const depName of s.dependsOn) {
        const dependsOnId = skillMap.get(depName);
        if (!dependsOnId) {
          console.warn(`⚠️ Skill dependency target '${depName}' not found for '${s.name}'`);
          continue;
        }
        await prisma.skillDependency.create({
          data: {
            skillId,
            dependsOnId
          }
        });
        depCount++;
      }
    }
  }
  console.log(`✅ Seeded ${depCount} skill dependency links.`);

  // 4. Insert Courses
  console.log("📚 Seeding Courses...");
  let courseCount = 0;
  for (const c of COURSES_DATA) {
    const skillId = skillMap.get(c.skillName);
    if (!skillId) {
      console.warn(`⚠️ Course target skill '${c.skillName}' not found for course '${c.title}'`);
      continue;
    }

    await prisma.course.create({
      data: {
        title: c.title,
        provider: c.provider,
        url: c.url,
        skillId: skillId,
        level: c.level,
        durationMin: c.durationMin,
        language: "en"
      }
    });
    courseCount++;
  }
  console.log(`✅ Seeded ${courseCount} courses.`);

  console.log("\n🎉 Seeding finished successfully!\n");
}

main()
  .catch((e) => {
    console.error("💥 Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
