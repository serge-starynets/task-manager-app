'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { taskRelations } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import {
  areTasksRelatable,
  canManageTask,
  getCurrentUser,
  getTask,
  orderedTaskPair,
  searchRelatableTasks as searchRelatableTasksDal,
} from '@/lib/dal';

export type RelationActionResponse = {
  success: boolean;
  message: string;
  error?: string;
};

function revalidateTaskViews(sourceId: number, targetId: number) {
  revalidateTag('tasks');
  revalidatePath('/dashboard');
  revalidatePath('/tasks', 'layout');
  revalidatePath(`/tasks/${sourceId}`);
  revalidatePath(`/tasks/${sourceId}/edit`);
  revalidatePath(`/tasks/${targetId}`);
  revalidatePath(`/tasks/${targetId}/edit`);
}

export async function searchRelatableTasks(
  sourceTaskId: number,
  query: string,
) {
  return searchRelatableTasksDal(sourceTaskId, query);
}

export async function addTaskRelation(
  sourceId: number,
  targetId: number,
): Promise<RelationActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized access',
        error: 'Unauthorized',
      };
    }

    const canManageSource = await canManageTask(sourceId);
    const canManageTarget = await canManageTask(targetId);
    if (!canManageSource || !canManageTarget) {
      return {
        success: false,
        message: 'You do not have permission to relate these tasks',
        error: 'Forbidden',
      };
    }

    const source = await getTask(sourceId);
    const target = await getTask(targetId);
    if (!source || !target) {
      return {
        success: false,
        message: 'Task not found',
        error: 'NotFound',
      };
    }

    if (!areTasksRelatable(source, target)) {
      return {
        success: false,
        message:
          'Tasks can only be related within the same project, or both without a project',
        error: 'Invalid',
      };
    }

    const [taskIdA, taskIdB] = orderedTaskPair(sourceId, targetId);

    await db.insert(taskRelations).values({ taskIdA, taskIdB });

    revalidateTaskViews(sourceId, targetId);

    return { success: true, message: 'Related task added' };
  } catch (error) {
    console.error('Error adding task relation:', error);
    return {
      success: false,
      message: 'An error occurred while adding the relation',
      error: 'Failed to add relation',
    };
  }
}

export async function removeTaskRelation(
  sourceId: number,
  targetId: number,
): Promise<RelationActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'Unauthorized access',
        error: 'Unauthorized',
      };
    }

    const canManageSource = await canManageTask(sourceId);
    if (!canManageSource) {
      return {
        success: false,
        message: 'You do not have permission to update this task',
        error: 'Forbidden',
      };
    }

    if (sourceId === targetId) {
      return {
        success: false,
        message: 'Invalid relation',
        error: 'Invalid',
      };
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

    revalidateTaskViews(sourceId, targetId);

    return { success: true, message: 'Related task removed' };
  } catch (error) {
    console.error('Error removing task relation:', error);
    return {
      success: false,
      message: 'An error occurred while removing the relation',
      error: 'Failed to remove relation',
    };
  }
}
