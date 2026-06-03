import { Queue, Job } from 'bullmq';
import { RequestContextStore } from '../context/request-context.store';

export async function addJobWithTrace(
  queue: Queue,
  name: string,
  data: any,
  opts?: any,
): Promise<Job> {
  const store = RequestContextStore.getStore();
  const requestId = store?.requestId || null;

  const trace = {
    requestId,
    source: 'api',
    createdAt: Date.now(),
  };

  // Preserve any existing meta block, but inject trace block
  const jobData = {
    ...data,
    trace,
    meta: {
      ...data?.meta,
      requestId: requestId || data?.meta?.requestId,
    },
  };

  return queue.add(name, jobData, opts);
}
