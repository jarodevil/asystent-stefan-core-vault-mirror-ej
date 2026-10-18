CREATE TABLE `generatedDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientCardId` int,
	`templateId` varchar(100) NOT NULL,
	`templateTitle` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`fieldValues` text,
	`legalBasis` varchar(500),
	`clientName` varchar(255),
	`clientNip` varchar(20),
	`status` enum('draft','final','archived') NOT NULL DEFAULT 'draft',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `generatedDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `generatedDocuments` ADD CONSTRAINT `generatedDocuments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `generatedDocuments` ADD CONSTRAINT `generatedDocuments_clientCardId_ksefClientCards_id_fk` FOREIGN KEY (`clientCardId`) REFERENCES `ksefClientCards`(`id`) ON DELETE set null ON UPDATE no action;