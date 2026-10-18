CREATE TABLE `ksefAlerts` (
	`id` varchar(255) NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`url` text NOT NULL,
	`source` varchar(100) NOT NULL,
	`alertType` enum('przepis','aktualnosc','interpretacja','komunikat','orzeczenie') NOT NULL,
	`priority` enum('wysoki','sredni','niski') NOT NULL DEFAULT 'sredni',
	`publishedAt` timestamp NOT NULL,
	`isNew` boolean NOT NULL DEFAULT true,
	`isRead` boolean NOT NULL DEFAULT false,
	`notified` boolean NOT NULL DEFAULT false,
	`legalBasis` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ksefAlerts_id` PRIMARY KEY(`id`)
);
