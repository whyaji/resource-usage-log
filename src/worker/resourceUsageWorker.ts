import { Job, Worker } from 'bullmq';
import * as si from 'systeminformation';

import { db } from '../db/database.js';
import { resourceUsageTable } from '../db/schema/schema.js';
import { logger } from '../lib/logger.js';
import { redis } from '../lib/redis.js';

interface ResourceUsageJobData {
  timestamp?: Date | string;
}

async function collectResourceUsage(): Promise<{
  cpu_usage: number;
  memory_used_mb: number;
  memory_total_mb: number;
  disk_used_mb: number;
  disk_total_mb: number;
}> {
  try {
    // Get CPU usage
    const cpuData = await si.currentLoad();
    const cpuUsage = cpuData.avgLoad;

    // Get memory information
    const memData = await si.mem();
    const memoryUsedMB = Math.round(memData.active / 1024 / 1024);
    const memoryTotalMB = Math.round(memData.total / 1024 / 1024);

    // Get disk information
    const diskData = await si.fsSize();
    const systemDisk = diskData.find((disk) => disk.mount === '/') || diskData[0];
    const diskUsedMB = Math.round(systemDisk.used / 1024 / 1024);
    const diskTotalMB = Math.round(systemDisk.size / 1024 / 1024);

    return {
      cpu_usage: cpuUsage,
      memory_used_mb: memoryUsedMB,
      memory_total_mb: memoryTotalMB,
      disk_used_mb: diskUsedMB,
      disk_total_mb: diskTotalMB,
    };
  } catch (error) {
    // Improved error logging with better serialization
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      cause: error instanceof Error ? error.cause : undefined,
    };
    logger.error({ error: errorDetails }, 'Error collecting resource usage');
    throw error;
  }
}

async function processResourceUsageJob(job: Job<ResourceUsageJobData>) {
  try {
    logger.info(`Processing resource usage job ${job.id}`);

    const resourceData = await collectResourceUsage();

    // Save to database
    // Ensure we have a proper Date object for created_at
    const createdAt = job.data.timestamp ? new Date(job.data.timestamp) : new Date();

    await db.insert(resourceUsageTable).values({
      cpu_usage: resourceData.cpu_usage,
      memory_used_mb: resourceData.memory_used_mb,
      memory_total_mb: resourceData.memory_total_mb,
      disk_used_mb: resourceData.disk_used_mb,
      disk_total_mb: resourceData.disk_total_mb,
      created_at: createdAt,
    });

    logger.info(`Resource usage data saved successfully for job ${job.id}`);
  } catch (error) {
    // Improved error logging with better serialization
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      cause: error instanceof Error ? error.cause : undefined,
    };
    logger.error({ error: errorDetails, jobId: job.id }, 'Error processing resource usage job');
    throw error;
  }
}

const worker = new Worker('resource-usage', processResourceUsageJob, {
  connection: redis,
  concurrency: 1,
});

worker.on('completed', (job) => {
  logger.info(`Resource usage job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  // Improved error logging for failed jobs
  const errorDetails = err
    ? {
        message: err.message,
        stack: err.stack,
        name: err.name,
        cause: err.cause,
      }
    : { message: 'Unknown error', name: 'UnknownError' };

  logger.error({ error: errorDetails, jobId: job?.id }, 'Resource usage job failed');
});

worker.on('error', (err) => {
  // Improved error logging for worker errors
  const errorDetails = {
    message: err.message,
    stack: err.stack,
    name: err.name,
    cause: err.cause,
  };
  logger.error({ error: errorDetails }, 'Worker error');
});

logger.info('Resource usage worker started');

export { worker };
