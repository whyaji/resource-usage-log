import * as cron from 'node-cron';

import { logger } from '../lib/logger.js';
import { resourceUsageQueue } from '../lib/queue.js';

export function startResourceUsageScheduler() {
  // Schedule resource usage collection every day at 6:00 AM
  const task = cron.schedule(
    '0 6 * * *',
    async () => {
      try {
        logger.info('Scheduled resource usage collection started');

        // Add job to queue
        await resourceUsageQueue.add(
          'collect-resource-usage',
          {
            timestamp: new Date(),
          },
          {
            priority: 1,
            delay: 0,
          }
        );

        logger.info('Resource usage collection job added to queue');
      } catch (error) {
        logger.error({ error }, 'Error scheduling resource usage collection');
      }
    },
    {
      timezone: 'Asia/Jakarta',
    }
  );

  // Start the scheduler
  task.start();
  logger.info('Resource usage scheduler started');

  return task;
}
