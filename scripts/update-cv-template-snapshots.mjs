import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

// Load .env
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
  console.warn("⚠️  No .env file found");
}

loadEnv();

const prisma = new PrismaClient();

async function main() {
  console.log("📥 Fetching active templates from catalog...");
  const templates = await prisma.template.findMany({
    where: { isActive: true }
  });
  
  const templateMap = new Map(templates.map(t => [t.id, t.schema]));
  console.log(`✅ Found ${templates.length} templates.`);

  console.log("📥 Fetching CVs...");
  const cvs = await prisma.cv.findMany({
    where: { isDeleted: false }
  });
  console.log(`✅ Found ${cvs.length} CVs.`);

  let updatedCount = 0;
  for (const cv of cvs) {
    if (!cv.templateId) continue;
    const latestSchema = templateMap.get(cv.templateId);
    if (!latestSchema) {
      console.log(`⚠️ Template ${cv.templateId} not found in active templates for CV ${cv.id}`);
      continue;
    }

    console.log(`🔄 Updating template snapshot for CV "${cv.title}" (ID: ${cv.id}) to template "${cv.templateId}"`);
    await prisma.cv.update({
      where: { id: cv.id },
      data: {
        templateSnapshot: latestSchema
      }
    });
    updatedCount++;
  }

  console.log(`\n🎉 Successfully updated ${updatedCount} CV template snapshots!`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
