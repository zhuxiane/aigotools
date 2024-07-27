CREATE TABLE `blogs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`icon` text,
	`parent_id` integer,
	`name` text NOT NULL,
	`featured` integer DEFAULT false,
	`weight` integer DEFAULT 0,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`userId` text NOT NULL,
	`userEmail` text NOT NULL,
	`state` text DEFAULT 'pending',
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text DEFAULT '00000000000000000',
	`siteKey` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`name` text,
	`featured` integer DEFAULT false,
	`weight` integer DEFAULT 0,
	`snapshot` text DEFAULT '',
	`description` text DEFAULT '',
	`pricingType` text DEFAULT '',
	`categories` text DEFAULT '[]',
	`pricings` text DEFAULT '[]',
	`images` text DEFAULT '[]',
	`features` text DEFAULT '[]',
	`usecases` text DEFAULT '[]',
	`users` text DEFAULT '[]',
	`relatedSearches` text DEFAULT '[]',
	`links` text DEFAULT '{}',
	`voteCount` integer DEFAULT 0,
	`metaKeywords` text DEFAULT '[]',
	`metaDescription` text DEFAULT '',
	`searchSuggestWords` text DEFAULT '[]',
	`state` text DEFAULT 'unpublished',
	`processStage` text DEFAULT 'pending',
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `upvotes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`targetId` text NOT NULL,
	`upvoteType` text NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `sites_siteKey_unique` ON `sites` (`siteKey`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `sites` (`name`);--> statement-breakpoint
CREATE INDEX `weight_idx` ON `sites` (`weight`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `upvotes` (`userId`);--> statement-breakpoint
CREATE INDEX `upvoteType_idx` ON `upvotes` (`upvoteType`);