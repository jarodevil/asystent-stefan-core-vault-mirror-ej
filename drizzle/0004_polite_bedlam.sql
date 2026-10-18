CREATE TABLE `devSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `devSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `devSettings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `errorLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`errorType` enum('falsification','source_mismatch','system_error','llm_error') NOT NULL,
	`message` text NOT NULL,
	`stackTrace` text,
	`context` text,
	`userId` int,
	`sessionId` int,
	`resolved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `errorLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qualityMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int,
	`messageId` int,
	`falsificationDetected` boolean NOT NULL DEFAULT false,
	`sourceMismatch` boolean NOT NULL DEFAULT false,
	`confidenceScore` decimal(5,2),
	`sourceUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `qualityMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sourceWhitelist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`domain` varchar(255) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`addedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sourceWhitelist_id` PRIMARY KEY(`id`),
	CONSTRAINT `sourceWhitelist_domain_unique` UNIQUE(`domain`)
);
--> statement-breakpoint
ALTER TABLE `devSettings` ADD CONSTRAINT `devSettings_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `errorLogs` ADD CONSTRAINT `errorLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `errorLogs` ADD CONSTRAINT `errorLogs_sessionId_chatSessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `chatSessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qualityMetrics` ADD CONSTRAINT `qualityMetrics_sessionId_chatSessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `chatSessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qualityMetrics` ADD CONSTRAINT `qualityMetrics_messageId_chatMessages_id_fk` FOREIGN KEY (`messageId`) REFERENCES `chatMessages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sourceWhitelist` ADD CONSTRAINT `sourceWhitelist_addedBy_users_id_fk` FOREIGN KEY (`addedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;