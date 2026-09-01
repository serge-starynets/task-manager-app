import 'server-only';

import { eq } from 'drizzle-orm';
import { del, head } from '@vercel/blob';
import { db } from '@/db';
import { tasks, taskAttachments, type Task, type User } from '@/db/schema';
import {
  canManageTask,
  getProject,
  getTaskAttachments,
  isAdmin,
} from '@/lib/dal';
import { sanitizeRichText } from '@/lib/rich-text';
import { allocateTaskId } from '@/lib/task-id';
import { linkRelatedTasks } from '@/lib/services/relation-service';
import {
  MAX_ATTACHMENT_BYTES,
  formatFileSize,
  parsePendingAttachments,
  sumAttachmentBytes,
  validateTaskAttachmentBudget,
  type PendingAttachment,
} from '@/lib/attachments';
import type { ServiceResult, ServiceVoidResult } from '@/lib/services/types';
import {
  CreateTaskSchema,
  TaskStatusSchema,
  UpdateTaskSchema,
  type CreateTaskServiceInput,
  type TaskData,
} from '@/lib/validations/task';

export type { CreateTaskServiceInput } from '@/lib/validations/task';

/** Retries cover concurrent creates racing for the same MAX(sequence). */
const MAX_TASK_ID_ATTEMPTS = 3;

function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  while (current instanceof Error) {
    if ((current as { code?: unknown }).code === '23505') return true;
    current = current.cause;
  }
  return false;
}

async function verifyPendingAttachments(
  pending: PendingAttachment[],
): Promise<PendingAttachment[]> {
  const verified: PendingAttachment[] = [];
  for (const item of pending) {
    const meta = await head(item.pathname);
    if (meta.size > MAX_ATTACHMENT_BYTES) {
      throw new Error(
        `Task attachments are limited to ${formatFileSize(MAX_ATTACHMENT_BYTES)} per file`,
      );
    }
    verified.push({
      url: meta.url,
      pathname: meta.pathname,
      fileName: item.fileName,
      contentType: meta.contentType || item.contentType,
      sizeBytes: meta.size,
    });
  }
  return verified;
}

export async function createTaskForUser(
  user: Pick<User, 'id'>,
  input: CreateTaskServiceInput,
): Promise<ServiceResult<Task>> {
  const validationResult = CreateTaskSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      ok: false,
      status: 400,
      message: 'Validation failed',
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const data = validationResult.data;
  const projectId: number | null = data.projectId ?? null;

  if (projectId !== null) {
    const project = await getProject(projectId);
    if (!project || project.userId !== user.id) {
      return {
        ok: false,
        status: 403,
        message: 'Invalid project',
        errors: { projectId: ['Please select a valid project'] },
      };
    }
  }

  let attachmentsToLink: PendingAttachment[] = [];
  if (input.uploadSessionId && input.pendingAttachmentsJson) {
    const pending = parsePendingAttachments(
      input.pendingAttachmentsJson,
      user.id,
      input.uploadSessionId,
    );
    attachmentsToLink = await verifyPendingAttachments(pending);
    const budget = validateTaskAttachmentBudget(
      0,
      sumAttachmentBytes(attachmentsToLink),
    );
    if (attachmentsToLink.length > 0 && !budget.ok) {
      return { ok: false, status: 400, message: budget.error };
    }
  }

  let created: Task | undefined;
  for (let attempt = 1; attempt <= MAX_TASK_ID_ATTEMPTS; attempt++) {
    const taskId = await allocateTaskId(projectId, user.id);
    try {
      [created] = await db
        .insert(tasks)
        .values({
          taskId,
          title: data.title,
          description: sanitizeRichText(data.description),
          status: data.status,
          priority: data.priority,
          userId: user.id,
          projectId,
        })
        .returning();
      break;
    } catch (error) {
      if (isUniqueViolation(error) && attempt < MAX_TASK_ID_ATTEMPTS) {
        continue;
      }
      throw error;
    }
  }

  if (!created) {
    return { ok: false, status: 500, message: 'Failed to create task' };
  }

  if (attachmentsToLink.length > 0) {
    try {
      await db.insert(taskAttachments).values(
        attachmentsToLink.map((item) => ({
          taskId: created!.id,
          fileName: item.fileName,
          contentType: item.contentType,
          sizeBytes: item.sizeBytes,
          url: item.url,
          pathname: item.pathname,
          uploadedBy: user.id,
        })),
      );
    } catch (error) {
      await db.delete(tasks).where(eq(tasks.id, created.id));
      throw error;
    }
  }

  const relatedTaskIds = data.relatedTaskIds ?? [];
  if (relatedTaskIds.length > 0) {
    const relationResult = await linkRelatedTasks(created.id, relatedTaskIds);
    if (!relationResult.ok) {
      await db.delete(tasks).where(eq(tasks.id, created.id));
      return relationResult;
    }
  }

  return { ok: true, data: created };
}

export async function updateTaskForUser(
  user: Pick<User, 'id' | 'role'>,
  taskId: number,
  data: Partial<TaskData>,
): Promise<ServiceResult<Task>> {
  const canManage = await canManageTask(taskId);
  if (!canManage) {
    return {
      ok: false,
      status: 403,
      message: 'You do not have permission to update this task',
    };
  }

  const newData = {
    ...data,
    updatedAt: new Date(),
  };

  const validationResult = UpdateTaskSchema.safeParse(newData);
  if (!validationResult.success) {
    return {
      ok: false,
      status: 400,
      message: 'Validation failed',
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const validatedData = validationResult.data;
  const updateData: Record<string, unknown> = {};

  if (validatedData.title !== undefined) updateData.title = validatedData.title;
  if (validatedData.description !== undefined) {
    updateData.description = sanitizeRichText(validatedData.description);
  }
  if (validatedData.status !== undefined) updateData.status = validatedData.status;
  if (validatedData.priority !== undefined) {
    updateData.priority = validatedData.priority;
  }
  if (validatedData.userId !== undefined && isAdmin(user)) {
    updateData.userId = validatedData.userId;
  }
  updateData.updatedAt = validatedData.updatedAt;

  const [updated] = await db
    .update(tasks)
    .set(updateData)
    .where(eq(tasks.id, taskId))
    .returning();

  if (!updated) {
    return { ok: false, status: 404, message: 'Task not found' };
  }

  return { ok: true, data: updated };
}

export async function updateTaskStatusForUser(
  taskId: number,
  status: TaskData['status'],
): Promise<ServiceResult<Task>> {
  const canManage = await canManageTask(taskId);
  if (!canManage) {
    return {
      ok: false,
      status: 403,
      message: 'You do not have permission to update this task',
    };
  }

  const validationResult = TaskStatusSchema.safeParse(status);
  if (!validationResult.success) {
    return {
      ok: false,
      status: 400,
      message: 'Validation failed',
      errors: { status: ['Please select a valid status'] },
    };
  }

  const [updated] = await db
    .update(tasks)
    .set({
      status: validationResult.data,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning();

  if (!updated) {
    return { ok: false, status: 404, message: 'Task not found' };
  }

  return { ok: true, data: updated };
}

export async function deleteBlobsForTask(taskId: number): Promise<void> {
  const attachments = await getTaskAttachments(taskId);
  if (attachments.length === 0) return;

  try {
    await del(attachments.map((a) => a.url));
  } catch (error) {
    console.error('Error deleting task blobs:', taskId, error);
  }
}

export async function deleteTaskForUser(taskId: number): Promise<ServiceVoidResult> {
  const canManage = await canManageTask(taskId);
  if (!canManage) {
    return { ok: false, status: 403, message: 'Forbidden' };
  }

  await deleteBlobsForTask(taskId);
  await db.delete(tasks).where(eq(tasks.id, taskId));
  return { ok: true };
}
