CREATE TYPE "public"."relation_kind" AS ENUM('related', 'blocked_by');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."ticket_type" AS ENUM('task', 'bug');--> statement-breakpoint
DROP INDEX "task_relations_pair_uidx";--> statement-breakpoint
ALTER TABLE "task_relations" ADD COLUMN "kind" "relation_kind" DEFAULT 'related' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "type" "ticket_type" DEFAULT 'task' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "severity" "severity";--> statement-breakpoint
CREATE UNIQUE INDEX "task_relations_pair_kind_uidx" ON "task_relations" USING btree ("task_id_a","task_id_b","kind");