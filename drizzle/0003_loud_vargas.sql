ALTER TABLE "tasks" ADD COLUMN "board_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
WITH ranked AS (
  SELECT
    id,
    (ROW_NUMBER() OVER (
      PARTITION BY user_id, COALESCE(project_id, 0), status
      ORDER BY updated_at DESC, created_at DESC, id DESC
    ) - 1)::integer AS rn
  FROM tasks
)
UPDATE tasks
SET board_order = ranked.rn
FROM ranked
WHERE tasks.id = ranked.id;
