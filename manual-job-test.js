#!/usr/bin/env node

/**
 * Manual job test script
 * This script manually adds a job to the queue to test the worker
 */

import dotenv from 'dotenv';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

dotenv.config();

async function addManualJob() {
  console.log('Adding manual resource usage job to queue...\n');

  try {
    // Create Redis connection
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
    });

    // Create queue
    const resourceUsageQueue = new Queue('resource-usage', {
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

    // Add job
    const job = await resourceUsageQueue.add(
      'manual-test-job',
      {
        timestamp: new Date(),
      },
      {
        priority: 1,
        delay: 0,
      }
    );

    console.log(`✅ Job added successfully with ID: ${job.id}`);
    console.log('Job data:', job.data);
    console.log('Job options:', job.opts);

    // Wait a moment and check job status
    setTimeout(async () => {
      try {
        const jobStatus = await resourceUsageQueue.getJob(job.id);
        console.log('\nJob status:', {
          id: jobStatus.id,
          state: await jobStatus.getState(),
          progress: jobStatus.progress,
          processedOn: jobStatus.processedOn,
          finishedOn: jobStatus.finishedOn,
          failedReason: jobStatus.failedReason,
        });

        if (jobStatus.failedReason) {
          console.log('❌ Job failed:', jobStatus.failedReason);
        } else {
          console.log('✅ Job completed successfully');
        }
      } catch (error) {
        console.error('Error checking job status:', error.message);
      }

      // Clean up
      await redis.disconnect();
      process.exit(0);
    }, 5000);
  } catch (error) {
    console.error('❌ Error adding manual job:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

addManualJob();
