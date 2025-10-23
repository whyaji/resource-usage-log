import { Queue } from 'bullmq';

import { redis } from './redis.js';

export const resourceUsageQueue = new Queue('resource-usage', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export { Queue };
