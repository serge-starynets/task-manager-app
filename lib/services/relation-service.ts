import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { taskRelations } from '@/db/schema';
import {
  areTasksRelatable,
  canManageTask,
  getTask,
  orderedTaskPair,
} from '@/lib/dal';
import type { ServiceResult, ServiceVoidResult } from '@/lib/services/types';

export async function addTaskRelation(
  sourceId: number,
  targetId: number,
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

  const [taskIdA, taskIdB] = orderedTaskPair(sourceId, targetId);
  await db.insert(taskRelations).values({ taskIdA, taskIdB });

  return { ok: true };
}

export async function removeTaskRelation(
  sourceId: number,
  targetId: number,
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

  const [taskIdA, taskIdB] = orderedTaskPair(sourceId, targetId);

  await db
    .delete(taskRelations)
    .where(
      and(
        eq(taskRelations.taskIdA, taskIdA),
        eq(taskRelations.taskIdB, taskIdB),
      ),
    );

  return { ok: true };
}
