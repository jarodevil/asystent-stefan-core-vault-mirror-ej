CREATE TABLE `legalNews` (
	`id` varchar(255) NOT NULL,
	`title` text NOT NULL,
	`date` varchar(50) NOT NULL,
	`source` varchar(255) NOT NULL,
	`excerpt` text NOT NULL,
	`url` text NOT NULL,
	`fullText` text,
	`category` enum('ustawa','rozporządzenie','orzeczenie','nowelizacja') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `legalNews_id` PRIMARY KEY(`id`)
);
