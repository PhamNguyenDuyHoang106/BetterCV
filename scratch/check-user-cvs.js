const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cvs = await prisma.cv.findMany({
    where: {
      userId: 'cmpjd1e8q0000foqcmto6xlkb',
      isDeleted: false,
    },
    include: { sections: true }
  });
  
  console.log(`User CVs count: ${cvs.length}`);
  for (const cv of cvs) {
    console.log(`- CV ID: ${cv.id}`);
    console.log(`  Title: ${cv.title}`);
    console.log(`  Template ID: ${cv.templateId}`);
    console.log(`  Thumbnail Status: ${cv.thumbnailStatus}`);
    console.log(`  Thumbnail URL: ${cv.thumbnailUrl}`);
    console.log(`  Version: ${cv.version}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
