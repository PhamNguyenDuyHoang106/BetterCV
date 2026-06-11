const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cv = await prisma.cv.findUnique({
    where: { id: 'cmq6dqeb00001udmsac46x48n' },
    include: { sections: true }
  });
  
  if (!cv) {
    console.log('CV not found');
    return;
  }
  
  console.log(`CV Title: ${cv.title}`);
  for (const sec of cv.sections) {
    console.log(`Section Type: ${sec.type}`);
    console.log(`Content: ${JSON.stringify(sec.content, null, 2)}`);
    console.log('---');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
