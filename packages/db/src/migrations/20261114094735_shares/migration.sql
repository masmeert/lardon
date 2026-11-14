CREATE TABLE `share` (
	`token` text PRIMARY KEY,
	`recipe_id` text NOT NULL,
	`created_by_id` text NOT NULL,
	`snapshot` text NOT NULL,
	`image_key` text,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_share_created_by_id_user_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `share_expiresAt_idx` ON `share` (`expires_at`);