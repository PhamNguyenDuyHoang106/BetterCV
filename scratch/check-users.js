const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      subscriptions: {
        include: { plan: true }
      },
      usageQuota: true
    }
  });
  console.log('Users in DB:');
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
