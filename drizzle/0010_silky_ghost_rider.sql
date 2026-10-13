CREATE TABLE "notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" varchar(256) DEFAULT '' NOT NULL,
	"pos_x" real,
	"pos_y" real,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "notes_user_id_idx" ON "notes" USING btree ("user_id");