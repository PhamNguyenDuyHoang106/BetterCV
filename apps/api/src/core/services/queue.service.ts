import { Injectable, Logger } from '@nestjs/common';

export type JobPriority = 'high' | 'medium' | 'low';

export type JobType = 'ocr' | 'export' | 'maintenance' | 'rewrite';

export type Job<T = any> = {
  id: string;
  type: JobType;
  priority: JobPriority;
  payload: T;
  retries: number;
  maxRetries: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
};

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  // In-memory job registry (Drop-in replaceable with Redis/BullMQ)
  private queue: Job[] = [];
  private dlq: Job[] = []; // Dead-Letter Queue for permanently failed jobs

  private retryLimits: Record<JobType, number> = {
    rewrite: 0, // ai-high (interactive: fail fast)
    ocr: 2, // ai-medium
    export: 1, // export queue
    maintenance: 1, // maintenance/cleanup queue
  };

  private priorityWeights: Record<JobPriority, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  /**
   * Pushes a new job into the queue.
   */
  async addJob<T>(
    type: JobType,
    priority: JobPriority,
    payload: T,
  ): Promise<Job<T>> {
    const job: Job<T> = {
      id: Math.random().toString(36).substring(7),
      type,
      priority,
      payload,
      retries: 0,
      maxRetries: this.retryLimits[type] ?? 1,
      status: 'queued',
      createdAt: new Date(),
    };

    this.queue.push(job);
    this.logger.log(
      `Job ${job.id} [${type}] added to queue with priority [${priority}]`,
    );

    // Sort queue by priority weight (high first) then by creation date (FIFO)
    this.sortQueue();

    return job;
  }

  /**
   * Retrieves the next high-priority job from the queue and sets it to processing.
   */
  async getNextJob(): Promise<Job | null> {
    const job = this.queue.find((j) => j.status === 'queued');
    if (!job) return null;

    job.status = 'processing';
    return job;
  }

  /**
   * Marks a job as completed.
   */
  async completeJob(jobId: string) {
    const index = this.queue.findIndex((j) => j.id === jobId);
    if (index !== -1) {
      const job = this.queue[index];
      job.status = 'completed';
      this.queue.splice(index, 1); // Remove from active queue
      this.logger.log(`Job ${jobId} [${job.type}] completed successfully`);
    }
  }

  /**
   * Handles job failure, performing retries or sending to Dead-Letter Queue (DLQ).
   */
  async failJob(jobId: string, errorMsg: string) {
    const index = this.queue.findIndex((j) => j.id === jobId);
    if (index === -1) return;

    const job = this.queue[index];
    job.error = errorMsg;

    if (job.retries < job.maxRetries) {
      job.retries++;
      job.status = 'queued'; // Re-queue
      this.logger.warn(
        `Job ${jobId} [${job.type}] failed. Retrying (${job.retries}/${job.maxRetries}). Error: ${errorMsg}`,
      );
      this.sortQueue();
    } else {
      job.status = 'failed';
      this.queue.splice(index, 1); // Remove from active queue
      this.dlq.push(job); // Move to DLQ
      this.logger.error(
        `Job ${jobId} [${job.type}] failed permanently after ${job.maxRetries} retries. Moved to Dead-Letter Queue. Error: ${errorMsg}`,
      );
    }
  }

  /**
   * Lists all active jobs.
   */
  getActiveJobs(): Job[] {
    return this.queue;
  }

  /**
   * Lists all dead-letter queue items.
   */
  getDLQ(): Job[] {
    return this.dlq;
  }

  private sortQueue() {
    this.queue.sort((a, b) => {
      const weightA = this.priorityWeights[a.priority];
      const weightB = this.priorityWeights[b.priority];

      if (weightA !== weightB) {
        return weightB - weightA; // Higher weight first
      }
      return a.createdAt.getTime() - b.createdAt.getTime(); // FIFO
    });
  }
}
