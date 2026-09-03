import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { taskRelations } from '@/db/schema';
import {
  areTasksRelatable,
  areTicketTypesRelatable,
  canManageTask,
  getTask,
  relationPair,
} from '@/lib/dal';
import type { ServiceVoidResult } from '@/lib/services/types';
import type { RelationKind, TicketRelationInput } from '@/lib/validations/task';

export async function addTaskRelation(
  sourceId: number,
  targetId: number,
  kind: RelationKind = 'related',
): Promise<ServiceVoidResult> {
  const canManageSource = await canManageTask(sourceId);
  const canManageTarget = await canManageTask(targetId);
  if (!canManageSource || !canManageTarget) {
    return {
      ok: false,
      status: 403,
      message: 'You do not have permission to relate these tasks',
    };
  }

  const source = await getTask(sourceId);
  const target = await getTask(targetId);
  if (!source || !target) {
    return { ok: false, status: 404, message: 'Task not found' };
  }

  if (!areTasksRelatable(source, target)) {
    return {
      ok: false,
      status: 400,
      message:
        'Tasks can only be related within the same project, or both without a project',
    };
  }

  if (!areTicketTypesRelatable(source.type, target.type)) {
    return {
      ok: false,
      status: 400,
      message: 'Bugs can only be related to tasks',
    };
  }

  const [taskIdA, taskIdB] = relationPair(sourceId, targetId, kind);
  await db.insert(taskRelations).values({ taskIdA, taskIdB, kind });

  return { ok: true };
}

export async function removeTaskRelation(
  sourceId: number,
  targetId: number,
  kind: RelationKind = 'related',
): Promise<ServiceVoidResult> {
  const canManageSource = await canManageTask(sourceId);
  if (!canManageSource) {
    return {
      ok: false,
      status: 403,
      message: 'You do not have permission to update this task',
    };
  }

  if (sourceId === targetId) {
    return { ok: false, status: 400, message: 'Invalid relation' };
  }

  const [taskIdA, taskIdB] = relationPair(sourceId, targetId, kind);

  await db
    .delete(taskRelations)
    .where(
      and(
        eq(taskRelations.taskIdA, taskIdA),
        eq(taskRelations.taskIdB, taskIdB),
        eq(taskRelations.kind, kind),
      ),
    );

  return { ok: true };
}

export async function linkRelatedTasks(
  sourceId: number,
  targetIds: number[],
): Promise<ServiceVoidResult> {
  return linkTicketRelations(
    sourceId,
    targetIds.map((targetId) => ({ targetId, kind: 'related' as const })),
  );
}

export async function linkTicketRelations(
  sourceId: number,
  relations: TicketRelationInput[],
): Promise<ServiceVoidResult> {
  const seen = new Set<string>();

  for (const relation of relations) {
    if (relation.targetId === sourceId) continue;
    const key = `${relation.targetId}:${relation.kind}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const result = await addTaskRelation(
      sourceId,
      relation.targetId,
      relation.kind,
    );
    if (!result.ok) {
      return result;
    }
  }

  return { ok: true };
}
