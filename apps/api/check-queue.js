const { Queue, QueueEvents } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis({
  host: 'localhost',
  port: 6379,
});

async function main() {
  const queue = new Queue('thumbnail', { connection });
  
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  console.log('Queue Metrics:');
  console.log(`- Waiting: ${waiting}`);
  console.log(`- Active: ${active}`);
  console.log(`- Completed: ${completed}`);
  console.log(`- Failed: ${failed}`);
  console.log(`- Delayed: ${delayed}`);

  const failedJobs = await queue.getFailed(0, 10);
  console.log('\nLast 10 Failed Jobs:');
  for (const job of failedJobs) {
    console.log(`- Job ID: ${job.id} | Name: ${job.name} | Failed Reason: ${job.failedReason}`);
  }

  const activeJobs = await queue.getActive(0, 10);
  console.log('\nActive Jobs:');
  for (const job of activeJobs) {
    console.log(`- Job ID: ${job.id} | Name: ${job.name}`);
  }

  connection.disconnect();
}

main().catch(console.error);
