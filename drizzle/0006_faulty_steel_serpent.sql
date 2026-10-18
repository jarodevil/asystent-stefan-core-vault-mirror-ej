CREATE TABLE `ksefClientCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`nip` varchar(20) NOT NULL,
	`address` text,
	`taxOffice` varchar(255),
	`contactEmail` varchar(320),
	`contactPhone` varchar(50),
	`implementationStatus` enum('not_started','in_progress','completed','issues') NOT NULL DEFAULT 'not_started',
	`obligationDate` varchar(20),
	`obligationType` enum('mandatory_large','mandatory_standard','voluntary','exempt') DEFAULT 'mandatory_standard',
	`authMethod` enum('token','qualified_sig','trusted_sig','not_set') DEFAULT 'not_set',
	`checklistJson` text,
	`zawFaGranted` boolean NOT NULL DEFAULT false,
	`zawFaDate` varchar(20),
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ksefClientCards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ksefClientCards` ADD CONSTRAINT `ksefClientCards_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;