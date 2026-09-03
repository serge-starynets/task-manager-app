import { db } from '@/db';
import {
  taskRelations,
  tasks,
  type RelatableTaskSummary,
  type RelatedTaskSummary,
  type Task,
} from '@/db/schema';
import { and, eq, ilike, inArray, isNull, notInArray, or } from 'drizzle-orm';
import { canManageTask, getTask } from '@/lib/dal/tasks';
import type { RelationKind, TicketType } from '@/lib/validations/task';

/** Ordered pair for undirected relations: always taskIdA < taskIdB. */
export function orderedTaskPair(id1: number, id2: number): [number, number] {
  return id1 < id2 ? [id1, id2] : [id2, id1];
}

export function relationPair(
  sourceId: number,
  targetId: number,
  kind: RelationKind,
): [number, number] {
  if (kind === 'blocked_by') {
    return [sourceId, targetId];
  }
  return orderedTaskPair(sourceId, targetId);
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

/** Bugs may only link to tasks. Tasks may link to tasks and bugs. */
export function areTicketTypesRelatable(
  sourceType: TicketType,
  targetType: TicketType,
): boolean {
  if (sourceType === 'bug' && targetType === 'bug') return false;
  return true;
}

export async function getRelatedTasks(
  taskId: number,
): Promise<RelatedTaskSummary[]> {
  try {
    const rows = await db
      .select({
        taskIdA: taskRelations.taskIdA,
        taskIdB: taskRelations.taskIdB,
        kind: taskRelations.kind,
      })
      .from(taskRelations)
      .where(
        or(
          and(
            eq(taskRelations.kind, 'related'),
            or(
              eq(taskRelations.taskIdA, taskId),
              eq(taskRelations.taskIdB, taskId),
            ),
          ),
          and(
            eq(taskRelations.kind, 'blocked_by'),
            eq(taskRelations.taskIdA, taskId),
          ),
        ),
      );

    if (rows.length === 0) return [];

    const relatedIds = [
      ...new Set(
        rows.map((row) =>
          row.taskIdA === taskId ? row.taskIdB : row.taskIdA,
        ),
      ),
    ];

    const ticketRows = await db
      .select({
        id: tasks.id,
        taskId: tasks.taskId,
        title: tasks.title,
        type: tasks.type,
      })
      .from(tasks)
      .where(inArray(tasks.id, relatedIds));

    const ticketsById = new Map(ticketRows.map((ticket) => [ticket.id, ticket]));

    return rows
      .map((row) => {
        const otherId = row.taskIdA === taskId ? row.taskIdB : row.taskIdA;
        const ticket = ticketsById.get(otherId);
        if (!ticket) return null;
        return { ...ticket, kind: row.kind };
      })
      .filter((item): item is RelatedTaskSummary => item !== null)
      .sort((a, b) => a.taskId.localeCompare(b.taskId));
  } catch (error) {
    console.error('Error fetching related tasks:', taskId, error);
    return [];
  }
}

export async function searchRelatableTasks(
  sourceTaskId: number,
  query: string,
  targetType: TicketType,
  excludeIds: number[] = [],
): Promise<RelatableTaskSummary[]> {
  const trimmed = query.trim();
  if (trimmed.length < 1) return [];

  const canManage = await canManageTask(sourceTaskId);
  if (!canManage) return [];

  const source = await getTask(sourceTaskId);
  if (!source) return [];

  if (!areTicketTypesRelatable(source.type, targetType)) return [];

  return searchRelatableTasksForUser(
    source.userId,
    source.projectId,
    trimmed,
    [sourceTaskId, ...excludeIds],
    targetType,
  );
}

export async function searchRelatableTasksForNewTask(
  userId: string,
  projectId: number | null,
  query: string,
  excludeIds: number[] = [],
  targetType: TicketType = 'task',
): Promise<RelatableTaskSummary[]> {
  const trimmed = query.trim();
  if (trimmed.length < 1) return [];

  return searchRelatableTasksForUser(
    userId,
    projectId,
    trimmed,
    excludeIds,
    targetType,
  );
}

async function searchRelatableTasksForUser(
  userId: string,
  projectId: number | null,
  trimmedQuery: string,
  excludeIds: number[],
  targetType: TicketType,
): Promise<RelatableTaskSummary[]> {
  const pattern = `%${trimmedQuery}%`;
  const eligibility =
    projectId === null
      ? isNull(tasks.projectId)
      : eq(tasks.projectId, projectId);

  const exclude =
    excludeIds.length > 0 ? notInArray(tasks.id, excludeIds) : undefined;

  try {
    return await db
      .select({
        id: tasks.id,
        taskId: tasks.taskId,
        title: tasks.title,
        type: tasks.type,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.type, targetType),
          eligibility,
          exclude,
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
