CREATE TABLE `inventory` (
	`itemid` text PRIMARY KEY NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`itemid`) REFERENCES `item`(`itemid`) ON UPDATE no action ON DELETE no action
);
