CREATE TABLE `category` (
	`catid` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `category_details` (
	`catid` text NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	`descn` text NOT NULL,
	PRIMARY KEY(`catid`, `locale`),
	FOREIGN KEY (`catid`) REFERENCES `category`(`catid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `category_details_locale_idx` ON `category_details` (`locale`);--> statement-breakpoint
CREATE TABLE `item` (
	`itemid` text PRIMARY KEY NOT NULL,
	`productid` text NOT NULL,
	`list_price` real NOT NULL,
	`unit_cost` real NOT NULL,
	FOREIGN KEY (`productid`) REFERENCES `product`(`productid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `item_productid_idx` ON `item` (`productid`);--> statement-breakpoint
CREATE TABLE `item_details` (
	`itemid` text NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	`image` text NOT NULL,
	`descn` text NOT NULL,
	`attr1` text,
	`attr2` text,
	`attr3` text,
	`attr4` text,
	`attr5` text,
	PRIMARY KEY(`itemid`, `locale`),
	FOREIGN KEY (`itemid`) REFERENCES `item`(`itemid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `item_details_locale_idx` ON `item_details` (`locale`);--> statement-breakpoint
CREATE TABLE `product` (
	`productid` text PRIMARY KEY NOT NULL,
	`catid` text NOT NULL,
	FOREIGN KEY (`catid`) REFERENCES `category`(`catid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `product_catid_idx` ON `product` (`catid`);--> statement-breakpoint
CREATE TABLE `product_details` (
	`productid` text NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	`descn` text NOT NULL,
	PRIMARY KEY(`productid`, `locale`),
	FOREIGN KEY (`productid`) REFERENCES `product`(`productid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `product_details_locale_idx` ON `product_details` (`locale`);