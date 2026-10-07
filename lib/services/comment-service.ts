import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { taskComments, type TaskComment, type User } from '@/db/schema';
import {
  canManageTask,
  getTaskComment,
  isAdmin,
} from '@/lib/dal';
import type { ServiceResult } from '@/lib/services/types';
import {
  CreateCommentSchema,
  UpdateCommentSchema,
  type CreateCommentInput,
  type UpdateCommentInput,
} from '@/lib/validations/comment';

function canEditComment(
  user: Pick<User, 'id' | 'role'>,
  comment: TaskComment,
): boolean {
  return isAdmin(user) || comment.userId === user.id;
}

export async function createTaskCommentForUser(
  user: Pick<User, 'id' | 'role'>,
  input: CreateCommentInput,
): Promise<ServiceResult<TaskComment>> {
  const parsed = CreateCommentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      message: parsed.error.errors[0]?.message ?? 'Invalid comment',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const canManage = await canManageTask(parsed.data.taskId);
  if (!canManage) {
    return { ok: false, status: 403, message: 'Forbidden' };
  }

  const [comment] = await db
    .insert(taskComments)
    .values({
      taskId: parsed.data.taskId,
      userId: user.id,
      body: parsed.data.body,
    })
    .returning();

  return { ok: true, data: comment };
}

export async function updateTaskCommentForUser(
  user: Pick<User, 'id' | 'role'>,
  input: UpdateCommentInput,
): Promise<ServiceResult<TaskComment>> {
  const parsed = UpdateCommentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      message: parsed.error.errors[0]?.message ?? 'Invalid comment',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const comment = await getTaskComment(parsed.data.commentId);
  if (!comment) {
    return { ok: false, status: 404, message: 'Comment not found' };
  }

  const canManage = await canManageTask(comment.taskId);
  if (!canManage || !canEditComment(user, comment)) {
    return { ok: false, status: 403, message: 'Forbidden' };
  }

  const [updated] = await db
    .update(taskComments)
    .set({
      body: parsed.data.body,
      updatedAt: new Date(),
    })
    .where(eq(taskComments.id, comment.id))
    .returning();

  return { ok: true, data: updated };
}

export async function deleteTaskCommentForUser(
  user: Pick<User, 'id' | 'role'>,
  commentId: number,
): Promise<ServiceResult<{ taskId: number }>> {
  const comment = await getTaskComment(commentId);
  if (!comment) {
    return { ok: false, status: 404, message: 'Comment not found' };
  }

  const canManage = await canManageTask(comment.taskId);
  if (!canManage || !canEditComment(user, comment)) {
    return { ok: false, status: 403, message: 'Forbidden' };
  }

  await db.delete(taskComments).where(eq(taskComments.id, commentId));

  return { ok: true, data: { taskId: comment.taskId } };
}
