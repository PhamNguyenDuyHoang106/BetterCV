const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lastRequests = await prisma.aiRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('Last 5 AI requests:', JSON.stringify(lastRequests, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
