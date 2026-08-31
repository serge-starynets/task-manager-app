'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUser, searchRelatableTasks as searchRelatableTasksDal } from '@/lib/dal';
import {
  addTaskRelation as addTaskRelationService,
  removeTaskRelation as removeTaskRelationService,
} from '@/lib/services/relation-service';
import { relationErrorCode } from '@/lib/actions/helpers';

export type RelationActionResponse = {
  success: boolean;
  message: string;
  error?: string;
};

function revalidateTaskViews(sourceId: number, targetId: number) {
  revalidateTag('tasks', 'max');
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

    const result = await addTaskRelationService(sourceId, targetId);
    if (!result.ok) {
      return {
        success: false,
        message: result.message,
        error: relationErrorCode(result.status),
      };
    }

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

    const result = await removeTaskRelationService(sourceId, targetId);
    if (!result.ok) {
      return {
        success: false,
        message: result.message,
        error: relationErrorCode(result.status),
      };
    }

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
