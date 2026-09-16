CREATE TABLE `order_line_item` (
	`order_id` integer NOT NULL,
	`line_number` integer NOT NULL,
	`itemid` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` real NOT NULL,
	PRIMARY KEY(`order_id`, `line_number`),
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`itemid`) REFERENCES `item`(`itemid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`order_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_name` text NOT NULL,
	`order_date` integer NOT NULL,
	`order_amount` real NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`user_name`) REFERENCES `auth_users`(`user_name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_order_date_idx` ON `orders` (`order_date`);