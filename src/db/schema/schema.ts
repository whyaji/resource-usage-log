import { bigint, float, mysqlTable, timestamp } from 'drizzle-orm/mysql-core';

export const resourceUsageTable = mysqlTable('resource_usage', {
  id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().notNull().primaryKey(),
  cpu_usage: float('cpu_usage').notNull(),
  memory_used_mb: bigint('memory_used_mb', { mode: 'number', unsigned: true }).notNull(),
  memory_total_mb: bigint('memory_total_mb', { mode: 'number', unsigned: true }).notNull(),
  disk_used_mb: bigint('disk_used_mb', { mode: 'number', unsigned: true }).notNull(),
  disk_total_mb: bigint('disk_total_mb', { mode: 'number', unsigned: true }).notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});
