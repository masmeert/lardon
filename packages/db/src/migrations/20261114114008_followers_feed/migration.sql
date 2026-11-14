CREATE TABLE `block` (
	`blocker_id` text NOT NULL,
	`blocked_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `block_pk` PRIMARY KEY(`blocker_id`, `blocked_id`),
	CONSTRAINT `fk_block_blocker_id_user_id_fk` FOREIGN KEY (`blocker_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_block_blocked_id_user_id_fk` FOREIGN KEY (`blocked_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `follow` (
	`follower_id` text NOT NULL,
	`followee_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `follow_pk` PRIMARY KEY(`follower_id`, `followee_id`),
	CONSTRAINT `fk_follow_follower_id_user_id_fk` FOREIGN KEY (`follower_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_follow_followee_id_user_id_fk` FOREIGN KEY (`followee_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`user_id` text PRIMARY KEY,
	`username` text NOT NULL UNIQUE,
	`bio` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_profile_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `published_recipe` (
	`recipe_id` text PRIMARY KEY,
	`family_id` text NOT NULL,
	`author_id` text NOT NULL,
	`snapshot` text NOT NULL,
	`image_key` text,
	`published_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_published_recipe_family_id_family_id_fk` FOREIGN KEY (`family_id`) REFERENCES `family`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_published_recipe_author_id_user_id_fk` FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `block_blockedId_idx` ON `block` (`blocked_id`);--> statement-breakpoint
CREATE INDEX `follow_followeeId_status_idx` ON `follow` (`followee_id`,`status`);--> statement-breakpoint
CREATE INDEX `published_recipe_authorId_publishedAt_idx` ON `published_recipe` (`author_id`,`published_at`);--> statement-breakpoint
CREATE INDEX `published_recipe_familyId_idx` ON `published_recipe` (`family_id`);