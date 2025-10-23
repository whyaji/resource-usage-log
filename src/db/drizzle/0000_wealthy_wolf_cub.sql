CREATE TABLE `resource_usage` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`cpu_usage` float NOT NULL,
	`memory_used_mb` bigint unsigned NOT NULL,
	`memory_total_mb` bigint unsigned NOT NULL,
	`disk_used_mb` bigint unsigned NOT NULL,
	`disk_total_mb` bigint unsigned NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resource_usage_id` PRIMARY KEY(`id`)
);
