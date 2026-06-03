const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cvs = await prisma.cv.findMany({
    where: {
      id: {
        startsWith: 'cmpy3'
      }
    }
  });
  console.log('CVs starting with cmpy3:', JSON.stringify(cvs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
