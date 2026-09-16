ALTER TABLE `order_line_item` ADD `catid` text REFERENCES category(catid);--> statement-breakpoint
ALTER TABLE `order_line_item` ADD `productid` text REFERENCES product(productid);--> statement-breakpoint
ALTER TABLE `order_line_item` ADD `quantity_shipped` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `billing_given_name` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `billing_family_name` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `billing_telephone` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `billing_email` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `billing_street_name1` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `billing_street_name2` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `billing_city` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `billing_state` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `billing_zip_code` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `billing_country` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_given_name` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_family_name` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_telephone` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_email` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_street_name1` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_street_name2` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_city` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_state` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_zip_code` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_country` text;