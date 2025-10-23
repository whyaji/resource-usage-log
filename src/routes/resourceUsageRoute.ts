import { and, desc, gte, lte } from 'drizzle-orm';
import { Hono } from 'hono';

import { db } from '../db/database.js';
import { resourceUsageTable } from '../db/schema/schema.js';
import { logger } from '../lib/logger.js';
import { resourceUsageQueue } from '../lib/queue.js';

const resourceUsageRoute = new Hono();

resourceUsageRoute.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = (page - 1) * limit;

    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');

    let whereCondition;
    if (startDate && endDate) {
      whereCondition = and(
        gte(resourceUsageTable.created_at, new Date(startDate)),
        lte(resourceUsageTable.created_at, new Date(endDate))
      );
    } else if (startDate) {
      whereCondition = gte(resourceUsageTable.created_at, new Date(startDate));
    } else if (endDate) {
      whereCondition = lte(resourceUsageTable.created_at, new Date(endDate));
    }

    const results = await db
      .select()
      .from(resourceUsageTable)
      .where(whereCondition)
      .orderBy(desc(resourceUsageTable.created_at))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: resourceUsageTable.id })
      .from(resourceUsageTable)
      .where(whereCondition);
    const total = totalCount.length;

    return c.json({
      success: true,
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching resource usage data');
    return c.json({ success: false, error: 'Failed to fetch resource usage data' }, 500);
  }
});

// Get resource usage history with that return 30 days of data
resourceUsageRoute.get('/history', async (c) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const results = await db
      .select()
      .from(resourceUsageTable)
      .where(
        and(
          gte(resourceUsageTable.created_at, startDate),
          lte(resourceUsageTable.created_at, endDate)
        )
      )
      .orderBy(desc(resourceUsageTable.created_at));

    return c.json({
      success: true,
      data: results,
      meta: {
        days: 30,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        total_records: results.length,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching resource usage history');
    return c.json({ success: false, error: 'Failed to fetch resource usage history' }, 500);
  }
});

// Get latest resource usage data
resourceUsageRoute.get('/latest', async (c) => {
  try {
    const result = await db
      .select()
      .from(resourceUsageTable)
      .orderBy(desc(resourceUsageTable.created_at))
      .limit(1);

    if (result.length === 0) {
      return c.json({ success: false, error: 'No resource usage data found' }, 404);
    }

    return c.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching latest resource usage data');
    return c.json({ success: false, error: 'Failed to fetch latest resource usage data' }, 500);
  }
});

// Get resource usage statistics
resourceUsageRoute.get('/stats', async (c) => {
  try {
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');

    let whereCondition;
    if (startDate && endDate) {
      whereCondition = and(
        gte(resourceUsageTable.created_at, new Date(startDate)),
        lte(resourceUsageTable.created_at, new Date(endDate))
      );
    } else if (startDate) {
      whereCondition = gte(resourceUsageTable.created_at, new Date(startDate));
    } else if (endDate) {
      whereCondition = lte(resourceUsageTable.created_at, new Date(endDate));
    }

    const results = await db
      .select()
      .from(resourceUsageTable)
      .where(whereCondition)
      .orderBy(desc(resourceUsageTable.created_at));

    if (results.length === 0) {
      return c.json({ success: false, error: 'No data found for the specified period' }, 404);
    }

    // Calculate statistics
    const cpuUsages = results.map((r) => r.cpu_usage);
    const memoryUsages = results.map((r) => (r.memory_used_mb / r.memory_total_mb) * 100);
    const diskUsages = results.map((r) => (r.disk_used_mb / r.disk_total_mb) * 100);

    const stats = {
      cpu: {
        avg: cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length,
        min: Math.min(...cpuUsages),
        max: Math.max(...cpuUsages),
      },
      memory: {
        avg: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
        min: Math.min(...memoryUsages),
        max: Math.max(...memoryUsages),
      },
      disk: {
        avg: diskUsages.reduce((a, b) => a + b, 0) / diskUsages.length,
        min: Math.min(...diskUsages),
        max: Math.max(...diskUsages),
      },
      totalRecords: results.length,
      dateRange: {
        start: results[results.length - 1].created_at,
        end: results[0].created_at,
      },
    };

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching resource usage statistics');
    return c.json({ success: false, error: 'Failed to fetch resource usage statistics' }, 500);
  }
});

// Trigger resource usage check (async by default)
resourceUsageRoute.post('/check', async (c) => {
  try {
    // Add job to queue
    const job = await resourceUsageQueue.add(
      'manual-collect-resource-usage',
      {
        timestamp: new Date(),
      },
      {
        priority: 1,
        delay: 0,
      }
    );

    logger.info(`Resource usage check job added: ${job.id}`);

    return c.json({
      success: true,
      message: 'Resource usage check job added to queue',
      jobId: job.id,
    });
  } catch (error) {
    logger.error({ error }, 'Error triggering resource usage check');
    return c.json({ success: false, error: 'Failed to trigger resource usage check' }, 500);
  }
});

export { resourceUsageRoute };
