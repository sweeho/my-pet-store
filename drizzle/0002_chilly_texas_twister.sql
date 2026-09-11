CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`j_signon` integer DEFAULT false NOT NULL,
	`j_signon_username` text,
	`original_url` text,
	`updated_at` integer NOT NULL
);
