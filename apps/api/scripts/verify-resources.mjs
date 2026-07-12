import { PrismaClient, ResourceStatus } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': '*/*'
      },
      signal: controller.signal
    }).catch(async (err) => {
      // Some servers fail on HEAD, fallback to GET with Abort
      if (err.name === 'AbortError') throw err;
      return fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          'Range': 'bytes=0-100', // Only fetch first 100 bytes to save bandwidth
          'Accept': '*/*'
        },
        signal: controller.signal
      });
    });

    clearTimeout(timeoutId);

    const httpCode = res.status;
    let status = ResourceStatus.ACTIVE;

    if (httpCode === 404 || httpCode === 410) {
      status = ResourceStatus.BROKEN;
    } else if (httpCode === 403 || httpCode === 401) {
      status = ResourceStatus.PRIVATE;
    } else if (httpCode >= 500) {
      // Temporary server issue, keep active or pending for safety
      status = ResourceStatus.PENDING;
    }

    return {
      status,
      httpCode,
      redirectUrl: res.headers.get('location') || undefined
    };
  } catch (err) {
    // Timeout or network error
    return {
      status: ResourceStatus.PENDING,
      httpCode: 0,
      error: err.message
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');

  console.log('Fetching active learning resources from database...');
  const resources = await prisma.learningResource.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      url: true,
      provider: true,
      status: true,
    }
  });

  console.log(`Found ${resources.length} active resources. Checking status...`);
  console.log(fix ? '🔧 Database auto-fix enabled (--fix)' : '🔍 Dry-run mode (run with --fix to apply changes)');
  console.log('--------------------------------------------------');

  let activeCount = 0;
  let brokenCount = 0;
  let privateCount = 0;
  let pendingCount = 0;

  for (const res of resources) {
    const result = await checkUrl(res.url);

    let statusSymbol = '🟢';
    if (result.status === ResourceStatus.BROKEN) {
      statusSymbol = '❌';
      brokenCount++;
    } else if (result.status === ResourceStatus.PRIVATE) {
      statusSymbol = '🔒';
      privateCount++;
    } else if (result.status === ResourceStatus.PENDING) {
      statusSymbol = '⚠️';
      pendingCount++;
    } else {
      activeCount++;
    }

    console.log(`${statusSymbol} [${result.httpCode || 'ERR'}] ${res.provider} | ${res.title}`);
    console.log(`   URL: ${res.url}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    if (fix && res.status !== result.status) {
      await prisma.learningResource.update({
        where: { id: res.id },
        data: {
          status: result.status,
          httpStatus: result.httpCode,
          lastVerifiedAt: new Date(),
        }
      });
      console.log(`   🔧 Updated status in DB: ${res.status} -> ${result.status}`);
    }
  }

  console.log('--------------------------------------------------');
  console.log('Verification Summary:');
  console.log(`🟢 Active:   ${activeCount}`);
  console.log(`❌ Broken:   ${brokenCount}`);
  console.log(`🔒 Private:  ${privateCount}`);
  console.log(`⚠️ Pending:  ${pendingCount}`);
  console.log('--------------------------------------------------');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
