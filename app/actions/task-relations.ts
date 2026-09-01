'use server';

import { getCurrentUser, searchRelatableTasks as searchRelatableTasksDal, searchRelatableTasksForNewTask as searchRelatableTasksForNewTaskDal } from '@/lib/dal';
import {
  actionError,
  revalidateRelatedTaskViews,
  toActionResponse,
  unauthorizedResponse,
  relationErrorCode,
} from '@/lib/actions/helpers';
import {
  addTaskRelation as addTaskRelationService,
  removeTaskRelation as removeTaskRelationService,
} from '@/lib/services/relation-service';

export type RelationActionResponse = {
  success: boolean;
  message: string;
  error?: string;
};

export async function searchRelatableTasks(
  sourceTaskId: number,
  query: string,
) {
  return searchRelatableTasksDal(sourceTaskId, query);
}

export async function searchRelatableTasksForNewTask(
  projectId: number | null,
  query: string,
  excludeIds: number[],
) {
  const user = await getCurrentUser();
  if (!user) return [];

  return searchRelatableTasksForNewTaskDal(
    user.id,
    projectId,
    query,
    excludeIds,
  );
}

export async function addTaskRelation(
  sourceId: number,
  targetId: number,
): Promise<RelationActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const result = await addTaskRelationService(sourceId, targetId);
    if (!result.ok) {
      return toActionResponse(result, relationErrorCode);
    }

    revalidateRelatedTaskViews(sourceId, targetId);
    return { success: true, message: 'Related task added' };
  } catch (error) {
    console.error('Error adding task relation:', error);
    return actionError(
      'An error occurred while adding the relation',
      'Failed to add relation',
    );
  }
}

export async function removeTaskRelation(
  sourceId: number,
  targetId: number,
): Promise<RelationActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const result = await removeTaskRelationService(sourceId, targetId);
    if (!result.ok) {
      return toActionResponse(result, relationErrorCode);
    }

    revalidateRelatedTaskViews(sourceId, targetId);
    return { success: true, message: 'Related task removed' };
  } catch (error) {
    console.error('Error removing task relation:', error);
    return actionError(
      'An error occurred while removing the relation',
      'Failed to remove relation',
    );
  }
}
