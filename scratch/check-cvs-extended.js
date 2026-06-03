const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function isRenderableCv(cv) {
  if (!cv.sections || cv.sections.length === 0) return false;

  let nonEmptySectionCount = 0;
  let hasExperience = false;
  let hasEducation = false;

  for (const section of cv.sections) {
    const type = section.type;
    const content = section.content;
    if (!content) continue;

    let isEmpty = true;
    if (type === 'PROFILE') {
      if (content.fullName && content.fullName.trim()) {
        isEmpty = false;
      }
    } else if (type === 'SUMMARY') {
      const text = content.text || content.objective || '';
      if (text.trim()) {
        isEmpty = false;
      }
    } else {
      const items =
        content.items || (Array.isArray(content) ? content : null);
      if (items && Array.isArray(items) && items.length > 0) {
        isEmpty = false;
      }
    }

    if (!isEmpty) {
      nonEmptySectionCount++;
      if (type === 'EXPERIENCE') hasExperience = true;
      if (type === 'EDUCATION') hasEducation = true;
    }
  }

  return nonEmptySectionCount >= 3 && (hasExperience || hasEducation);
}

async function main() {
  const cvs = await prisma.cv.findMany({
    where: { isDeleted: false },
    include: { sections: true }
  });
  
  console.log(`Found ${cvs.length} active CVs in database:`);
  for (const cv of cvs) {
    console.log(`\n- CV ID: ${cv.id}`);
    console.log(`  Title: ${cv.title}`);
    console.log(`  Version: ${cv.version}`);
    console.log(`  Template ID: ${cv.templateId}`);
    console.log(`  Thumbnail Status: ${cv.thumbnailStatus}`);
    console.log(`  Thumbnail URL: ${cv.thumbnailUrl}`);
    console.log(`  Attempt Count: ${cv.thumbnailAttemptCount}`);
    console.log(`  Last Error: ${cv.thumbnailLastError}`);
    console.log(`  Is Renderable: ${isRenderableCv(cv)}`);
    console.log(`  Sections count: ${cv.sections.length}`);
    console.log(`  Sections present: ${cv.sections.map(s => s.type).join(', ')}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
