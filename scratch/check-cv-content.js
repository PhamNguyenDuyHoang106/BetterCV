const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cv = await prisma.cv.findUnique({
    where: { id: 'cmpy3rzwl0006udiwzx3epro7' },
    include: { sections: true }
  });
  
  if (!cv) {
    console.log('CV not found');
    return;
  }
  
  const profileSection = cv.sections.find(s => s.type === 'PROFILE');
  console.log('Profile Section Content:');
  console.log(JSON.stringify(profileSection ? profileSection.content : null, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
