const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Check all quota records
  const quotas = await p.usageQuota.findMany({
    include: {
      user: { select: { email: true, role: true } }
    }
  });

  console.log('=== UsageQuota Records ===');
  console.log(JSON.stringify(quotas, null, 2));

  // Check for AiRequest errors
  const recentRequests = await p.aiRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { status: true, promptKey: true, createdAt: true, userId: true }
  });

  console.log('\n=== Recent AI Requests (last 10) ===');
  console.log(JSON.stringify(recentRequests, null, 2));

  // Check users
  const users = await p.user.findMany({
    select: { id: true, email: true, role: true },
    take: 5
  });
  console.log('\n=== Users ===');
  console.log(JSON.stringify(users, null, 2));
}

main().catch(e => console.error('Error:', e.message)).finally(() => p.$disconnect());
