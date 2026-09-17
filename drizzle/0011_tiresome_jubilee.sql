CREATE TABLE `supplier_po` (
	`order_id` integer PRIMARY KEY NOT NULL,
	`po_date` integer NOT NULL,
	`shipping_given_name` text,
	`shipping_family_name` text,
	`shipping_telephone` text,
	`shipping_email` text,
	`shipping_street_name1` text,
	`shipping_street_name2` text,
	`shipping_city` text,
	`shipping_state` text,
	`shipping_zip_code` text,
	`shipping_country` text,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `supplier_po_line_item` (
	`order_id` integer NOT NULL,
	`line_number` integer NOT NULL,
	`catid` text,
	`productid` text,
	`itemid` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` real NOT NULL,
	PRIMARY KEY(`order_id`, `line_number`),
	FOREIGN KEY (`order_id`) REFERENCES `supplier_po`(`order_id`) ON UPDATE no action ON DELETE cascade
);
