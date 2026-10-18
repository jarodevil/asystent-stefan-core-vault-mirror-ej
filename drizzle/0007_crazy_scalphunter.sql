CREATE TABLE `stefanNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`category` enum('ksef','klient','sprawa','preferencja','inne') NOT NULL DEFAULT 'inne',
	`isPinned` boolean NOT NULL DEFAULT false,
	`sessionId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stefanNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cacheKey` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`ttlSeconds` int,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `systemCache_cacheKey_unique` UNIQUE(`cacheKey`)
);
--> statement-breakpoint
ALTER TABLE `stefanNotes` ADD CONSTRAINT `stefanNotes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stefanNotes` ADD CONSTRAINT `stefanNotes_sessionId_chatSessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `chatSessions`(`id`) ON DELETE set null ON UPDATE no action;