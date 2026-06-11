const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reqs = await prisma.aiRequest.findMany({
    where: { promptKey: 'cv_github_analyze' },
    orderBy: { createdAt: 'desc' },
    take: 3
  });

  for (const r of reqs) {
    console.log(`Request ID: ${r.id}`);
    console.log(`Created At: ${r.createdAt}`);
    console.log(`Status: ${r.status}`);
    console.log(`Input: ${JSON.stringify(r.input, null, 2)}`);
    
    const resp = await prisma.aiResponse.findFirst({
      where: { requestId: r.id }
    });
    
    if (resp) {
      console.log(`Output: ${JSON.stringify(resp.output, null, 2)}`);
    } else {
      console.log('No response found');
    }
    console.log('------------------------------------');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
