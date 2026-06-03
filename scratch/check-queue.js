const { Queue } = require('bullmq');
const IoRedis = require('ioredis');

const connection = new IoRedis({
  host: 'localhost',
  port: 6379,
});

async function main() {
  const queue = new Queue('thumbnail-queue', { connection });
  
  console.log('Inspecting thumbnail-queue...');
  
  const [waiting, active, delayed, failed, completed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getDelayedCount(),
    queue.getFailedCount(),
    queue.getCompletedCount(),
  ]);
  
  console.log('Job Counts:');
  console.log(`- Waiting: ${waiting}`);
  console.log(`- Active: ${active}`);
  console.log(`- Delayed: ${delayed}`);
  console.log(`- Failed: ${failed}`);
  console.log(`- Completed: ${completed}`);
  
  const jobs = await queue.getJobs(['waiting', 'active', 'delayed', 'failed']);
  console.log(`\nFound ${jobs.length} jobs in queue:`);
  for (const job of jobs) {
    console.log(`- Job ID: ${job.id}`);
    console.log(`  Name: ${job.name}`);
    console.log(`  State: ${await job.getState()}`);
    console.log(`  Data: ${JSON.stringify(job.data)}`);
    console.log(`  Attempts Made: ${job.attemptsMade}`);
    console.log(`  Failed Reason: ${job.failedReason}`);
  }
}

main()
  .catch(console.error)
  .finally(() => {
    connection.disconnect();
  });
