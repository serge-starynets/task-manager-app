import { db } from '@/db';
import {
  taskRelations,
  tasks,
  type RelatedTaskSummary,
  type Task,
} from '@/db/schema';
import { and, eq, ilike, inArray, isNull, notInArray, or } from 'drizzle-orm';
import { canManageTask, getTask } from '@/lib/dal/tasks';

/** Ordered pair for undirected relations: always taskIdA < taskIdB. */
export function orderedTaskPair(id1: number, id2: number): [number, number] {
  return id1 < id2 ? [id1, id2] : [id2, id1];
}

/** Same project, or both orphaned. Self-links are never eligible. */
export function areTasksRelatable(
  a: Pick<Task, 'id' | 'projectId'>,
  b: Pick<Task, 'id' | 'projectId'>,
): boolean {
  if (a.id === b.id) return false;
  if (a.projectId === null && b.projectId === null) return true;
  if (a.projectId !== null && a.projectId === b.projectId) return true;
  return false;
}

async function fetchRelatedTaskIds(taskId: number): Promise<number[]> {
  const rows = await db
    .select({
      taskIdA: taskRelations.taskIdA,
      taskIdB: taskRelations.taskIdB,
    })
    .from(taskRelations)
    .where(
      or(eq(taskRelations.taskIdA, taskId), eq(taskRelations.taskIdB, taskId)),
    );

  return rows.map((row) =>
    row.taskIdA === taskId ? row.taskIdB : row.taskIdA,
  );
}

export async function getRelatedTasks(
  taskId: number,
): Promise<RelatedTaskSummary[]> {
  try {
    const relatedIds = await fetchRelatedTaskIds(taskId);
    if (relatedIds.length === 0) return [];

    return await db
      .select({
        id: tasks.id,
        taskId: tasks.taskId,
        title: tasks.title,
      })
      .from(tasks)
      .where(inArray(tasks.id, relatedIds))
      .orderBy(tasks.taskId);
  } catch (error) {
    console.error('Error fetching related tasks:', taskId, error);
    return [];
  }
}

export async function searchRelatableTasks(
  sourceTaskId: number,
  query: string,
): Promise<RelatedTaskSummary[]> {
  const trimmed = query.trim();
  if (trimmed.length < 1) return [];

  const canManage = await canManageTask(sourceTaskId);
  if (!canManage) return [];

  const source = await getTask(sourceTaskId);
  if (!source) return [];

  const relatedIds = await fetchRelatedTaskIds(sourceTaskId);
  const excludeIds =
    relatedIds.length > 0 ? [sourceTaskId, ...relatedIds] : [sourceTaskId];

  const pattern = `%${trimmed}%`;
  const eligibility =
    source.projectId === null
      ? isNull(tasks.projectId)
      : eq(tasks.projectId, source.projectId);

  try {
    return await db
      .select({
        id: tasks.id,
        taskId: tasks.taskId,
        title: tasks.title,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, source.userId),
          eligibility,
          notInArray(tasks.id, excludeIds),
          or(ilike(tasks.title, pattern), ilike(tasks.taskId, pattern)),
        ),
      )
      .orderBy(tasks.taskId)
      .limit(10);
  } catch (error) {
    console.error('Error searching relatable tasks:', error);
    return [];
  }
}
