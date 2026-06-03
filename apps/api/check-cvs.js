const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cvs = await prisma.cv.findMany({
    where: { isDeleted: false },
    include: { sections: true }
  });
  const cvWithSections = cvs.find(c => c.sections.length > 0);
  if (cvWithSections) {
    console.log('CV with sections:', cvWithSections.id, cvWithSections.title);
    console.log('Sections:', JSON.stringify(cvWithSections.sections, null, 2));
  } else {
    console.log('No CV has sections!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
