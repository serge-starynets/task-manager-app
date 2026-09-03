'use server';

import {
  getCurrentUser,
  searchRelatableTasks as searchRelatableTasksDal,
  searchRelatableTasksForNewTask as searchRelatableTasksForNewTaskDal,
} from '@/lib/dal';
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
import type { RelationKind, TicketType } from '@/lib/validations/task';

export type RelationActionResponse = {
  success: boolean;
  message: string;
  error?: string;
};

export async function searchRelatableTasks(
  sourceTaskId: number,
  query: string,
  targetType: TicketType,
  excludeIds: number[] = [],
) {
  return searchRelatableTasksDal(
    sourceTaskId,
    query,
    targetType,
    excludeIds,
  );
}

export async function searchRelatableTasksForNewTask(
  projectId: number | null,
  query: string,
  excludeIds: number[],
  targetType: TicketType,
) {
  const user = await getCurrentUser();
  if (!user) return [];

  return searchRelatableTasksForNewTaskDal(
    user.id,
    projectId,
    query,
    excludeIds,
    targetType,
  );
}

export async function addTaskRelation(
  sourceId: number,
  targetId: number,
  kind: RelationKind = 'related',
): Promise<RelationActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const result = await addTaskRelationService(sourceId, targetId, kind);
    if (!result.ok) {
      return toActionResponse(result, relationErrorCode);
    }

    revalidateRelatedTaskViews(sourceId, targetId);
    return { success: true, message: 'Related ticket added' };
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
  kind: RelationKind = 'related',
): Promise<RelationActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const result = await removeTaskRelationService(sourceId, targetId, kind);
    if (!result.ok) {
      return toActionResponse(result, relationErrorCode);
    }

    revalidateRelatedTaskViews(sourceId, targetId);
    return { success: true, message: 'Related ticket removed' };
  } catch (error) {
    console.error('Error removing task relation:', error);
    return actionError(
      'An error occurred while removing the relation',
      'Failed to remove relation',
    );
  }
}
