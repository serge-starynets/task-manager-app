ALTER TABLE "entity_history" ADD COLUMN "operation_id" varchar(36);--> statement-breakpoint
UPDATE "entity_history" SET "operation_id" = gen_random_uuid()::text WHERE "operation_id" IS NULL;--> statement-breakpoint
ALTER TABLE "entity_history" ALTER COLUMN "operation_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "entity_history_operation_idx" ON "entity_history" USING btree ("operation_id");
