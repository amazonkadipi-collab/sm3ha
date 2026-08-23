CREATE TABLE `albums` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`normalizedTitle` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`artistId` int,
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `albums_id` PRIMARY KEY(`id`),
	CONSTRAINT `albums_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `artists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`normalizedName` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `artists_id` PRIMARY KEY(`id`),
	CONSTRAINT `artists_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `conversionJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`songId` int NOT NULL,
	`format` enum('mp3','mp4') NOT NULL,
	`quality` varchar(32) NOT NULL,
	`status` enum('queued','processing','ready','failed','expired','cancelled') NOT NULL DEFAULT 'queued',
	`progress` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`expiresAt` timestamp,
	CONSTRAINT `conversionJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mediaVariants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`songId` int NOT NULL,
	`format` enum('mp3','mp4') NOT NULL,
	`quality` varchar(32) NOT NULL,
	`sizeBytes` int,
	`storageKey` text,
	`status` enum('ready','processing','unavailable') NOT NULL DEFAULT 'unavailable',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mediaVariants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `searchLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`query` varchar(255) NOT NULL,
	`songId` int,
	`hashedIp` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `searchLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `songs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`normalizedTitle` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`artistId` int,
	`albumId` int,
	`provider` varchar(64) NOT NULL DEFAULT 'demo',
	`providerVideoId` varchar(64) NOT NULL,
	`providerUrl` text,
	`opaqueToken` varchar(128) NOT NULL,
	`thumbnailUrl` text,
	`durationSeconds` int,
	`availabilityStatus` enum('available','pending','unavailable','removed') NOT NULL DEFAULT 'available',
	`rightsStatus` enum('demo','licensed','metadata_only','removed') NOT NULL DEFAULT 'demo',
	`viewCount` int NOT NULL DEFAULT 0,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `songs_id` PRIMARY KEY(`id`),
	CONSTRAINT `songs_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `songs_opaqueToken_unique` UNIQUE(`opaqueToken`),
	CONSTRAINT `songs_provider_video_idx` UNIQUE(`provider`,`providerVideoId`)
);
--> statement-breakpoint
CREATE TABLE `takedownRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`songId` int,
	`claimantName` varchar(255) NOT NULL,
	`claimantEmail` varchar(320) NOT NULL,
	`reason` text NOT NULL,
	`status` enum('open','reviewing','resolved','rejected') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `takedownRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `artists_normalized_name_idx` ON `artists` (`normalizedName`);--> statement-breakpoint
CREATE INDEX `songs_normalized_title_idx` ON `songs` (`normalizedTitle`);