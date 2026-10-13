ALTER TABLE "users" ADD COLUMN "username" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "custom_image" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "custom_image_pathname" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "prefer_custom_profile" boolean DEFAULT false NOT NULL;