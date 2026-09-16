CREATE TABLE `cart_items` (
	`session_id` text NOT NULL,
	`itemid` text NOT NULL,
	`quantity` integer NOT NULL,
	PRIMARY KEY(`session_id`, `itemid`),
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`itemid`) REFERENCES `item`(`itemid`) ON UPDATE no action ON DELETE cascade
);
