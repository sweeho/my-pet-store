ALTER TABLE `notifications` ADD `status` text DEFAULT 'QUEUED' NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` ADD `sent_at` integer;--> statement-breakpoint
ALTER TABLE `notifications` ADD `failure_reason` text;