CREATE TYPE "public"."project_type" AS ENUM('software', 'other');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "type" "project_type" DEFAULT 'software' NOT NULL;