ALTER TABLE `share` ADD `source_image_key` text;--> statement-breakpoint
CREATE INDEX `share_createdById_recipeId_idx` ON `share` (`created_by_id`,`recipe_id`);