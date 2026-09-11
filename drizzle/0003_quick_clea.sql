CREATE TABLE `accounts` (
	`user_name` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`user_name`) REFERENCES `customers`(`user_name`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `addresses` (
	`user_name` text PRIMARY KEY NOT NULL,
	`street_name1` text,
	`street_name2` text,
	`city` text,
	`state` text,
	`zip_code` text,
	`country` text,
	FOREIGN KEY (`user_name`) REFERENCES `contact_info`(`user_name`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `card_metadata` (
	`user_name` text PRIMARY KEY NOT NULL,
	`card_type` text,
	`expiry_date` text,
	`last_four` text,
	FOREIGN KEY (`user_name`) REFERENCES `customers`(`user_name`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `contact_info` (
	`user_name` text PRIMARY KEY NOT NULL,
	`given_name` text,
	`family_name` text,
	`telephone` text,
	`email` text,
	FOREIGN KEY (`user_name`) REFERENCES `customers`(`user_name`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`user_name` text PRIMARY KEY NOT NULL,
	FOREIGN KEY (`user_name`) REFERENCES `auth_users`(`user_name`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_name` text PRIMARY KEY NOT NULL,
	`preferred_language` text DEFAULT 'en_US' NOT NULL,
	`favorite_category` text,
	`my_list_preference` integer DEFAULT true NOT NULL,
	`banner_preference` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`user_name`) REFERENCES `customers`(`user_name`) ON UPDATE no action ON DELETE cascade
);
