CREATE TABLE `family` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`personal_for_user_id` text UNIQUE,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_family_personal_for_user_id_user_id_fk` FOREIGN KEY (`personal_for_user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `family_invite` (
	`code` text PRIMARY KEY,
	`family_id` text NOT NULL,
	`created_by_id` text,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_family_invite_family_id_family_id_fk` FOREIGN KEY (`family_id`) REFERENCES `family`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_family_invite_created_by_id_user_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `family_member` (
	`family_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`joined_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `family_member_pk` PRIMARY KEY(`family_id`, `user_id`),
	CONSTRAINT `fk_family_member_family_id_family_id_fk` FOREIGN KEY (`family_id`) REFERENCES `family`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_family_member_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `family_invite_familyId_idx` ON `family_invite` (`family_id`);--> statement-breakpoint
CREATE INDEX `family_member_userId_idx` ON `family_member` (`user_id`);