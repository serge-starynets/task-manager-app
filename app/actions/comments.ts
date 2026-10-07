'use server';

import { getCurrentUser } from '@/lib/dal';
import {
  actionError,
  revalidateTaskDetail,
  toActionResponse,
  unauthorizedResponse,
} from '@/lib/actions/helpers';
import {
  createTaskCommentForUser,
  deleteTaskCommentForUser,
  updateTaskCommentForUser,
} from '@/lib/services/comment-service';

export type CommentActionResponse = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
};

export async function createTaskComment(input: {
  taskId: number;
  body: string;
}): Promise<CommentActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const result = await createTaskCommentForUser(user, input);
    if (!result.ok) return toActionResponse(result);

    revalidateTaskDetail(input.taskId);
    return { success: true, message: 'Comment added' };
  } catch (error) {
    console.error('Error creating comment:', error);
    return actionError('Failed to add comment', 'Failed to add comment');
  }
}

export async function updateTaskComment(input: {
  commentId: number;
  body: string;
}): Promise<CommentActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const result = await updateTaskCommentForUser(user, input);
    if (!result.ok) return toActionResponse(result);

    revalidateTaskDetail(result.data.taskId);
    return { success: true, message: 'Comment updated' };
  } catch (error) {
    console.error('Error updating comment:', error);
    return actionError('Failed to update comment', 'Failed to update comment');
  }
}

export async function deleteTaskComment(
  commentId: number,
): Promise<CommentActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const result = await deleteTaskCommentForUser(user, commentId);
    if (!result.ok) return toActionResponse(result);

    revalidateTaskDetail(result.data.taskId);
    return { success: true, message: 'Comment deleted' };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return actionError('Failed to delete comment', 'Failed to delete comment');
  }
}
