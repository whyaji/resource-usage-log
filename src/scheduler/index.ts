import { logger } from '../lib/logger.js';
import { startResourceUsageScheduler } from './resourceUsageScheduler.js';

// Start the scheduler
const scheduler = startResourceUsageScheduler();

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down scheduler...');
  scheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down scheduler...');
  scheduler.stop();
  process.exit(0);
});
