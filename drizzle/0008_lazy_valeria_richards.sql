CREATE TYPE "public"."entity_history_action" AS ENUM('created', 'updated');--> statement-breakpoint
CREATE TYPE "public"."entity_history_type" AS ENUM('task', 'project');--> statement-breakpoint
CREATE TABLE "entity_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" "entity_history_type" NOT NULL,
	"entity_id" integer NOT NULL,
	"entity_name" text NOT NULL,
	"action" "entity_history_action" NOT NULL,
	"field_name" varchar(64),
	"old_value" text,
	"new_value" text,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entity_history" ADD CONSTRAINT "entity_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entity_history_entity_created_idx" ON "entity_history" USING btree ("entity_type","entity_id","created_at");