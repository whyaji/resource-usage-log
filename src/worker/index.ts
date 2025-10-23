import { logger } from '../lib/logger.js';
import { worker } from './resourceUsageWorker.js';

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down worker...');
  await worker.close();
  process.exit(0);
});
