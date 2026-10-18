CREATE TABLE `modelAuditEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surface` enum('chat','document','pdf','ksef') NOT NULL,
	`model` varchar(100) NOT NULL,
	`fallbackUsed` boolean NOT NULL DEFAULT false,
	`safetyBlocked` boolean NOT NULL DEFAULT false,
	`validationIssues` int NOT NULL DEFAULT 0,
	`sourceVerified` boolean NOT NULL DEFAULT false,
	`promptTokens` int,
	`completionTokens` int,
	`failureKind` varchar(100),
	`configHash` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `modelAuditEvents_id` PRIMARY KEY(`id`)
);
