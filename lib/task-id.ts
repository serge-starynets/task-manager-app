import { and, eq, isNull, like, sql } from 'drizzle-orm';
import { db } from '@/db';
import { projects, tasks } from '@/db/schema';

/** Prefix used for tasks that are not linked to a project */
export const ORPHAN_TASK_PREFIX = 'TASK';

export function formatTaskId(prefix: string, sequence: number): string {
  return `${prefix}-${sequence}`;
}

/**
 * Next ascending number for a project (or orphaned tasks for a user).
 * Uses MAX of the numeric suffix so deleted IDs leave gaps (safe & simple).
 */
export async function getNextTaskSequence(
  projectId: number | null,
  userId: string,
  prefix: string,
): Promise<number> {
  const pattern = `${prefix}-%`;

  const whereClause =
    projectId != null
      ? and(eq(tasks.projectId, projectId), like(tasks.taskId, pattern))
      : and(
          eq(tasks.userId, userId),
          isNull(tasks.projectId),
          like(tasks.taskId, pattern),
        );

  const [row] = await db
    .select({
      maxSeq: sql<number>`COALESCE(MAX(CAST(SPLIT_PART(${tasks.taskId}, '-', 2) AS INTEGER)), 0)`,
    })
    .from(tasks)
    .where(whereClause);

  return Number(row?.maxSeq ?? 0) + 1;
}

export async function allocateTaskId(
  projectId: number | null,
  userId: string,
): Promise<string> {
  let prefix = ORPHAN_TASK_PREFIX;

  if (projectId != null) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      columns: { abbreviation: true, userId: true },
    });

    if (!project || project.userId !== userId) {
      throw new Error('Invalid project for task ID allocation');
    }

    prefix = project.abbreviation;
  }

  const sequence = await getNextTaskSequence(projectId, userId, prefix);
  return formatTaskId(prefix, sequence);
}
