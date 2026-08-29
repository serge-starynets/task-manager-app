import 'server-only';

import { eq } from 'drizzle-orm';
import { del, head } from '@vercel/blob';
import { db } from '@/db';
import { tasks, taskAttachments, type Task, type User } from '@/db/schema';
import { canManageTask, getProject, getTaskAttachments } from '@/lib/dal';
import { sanitizeRichText } from '@/lib/rich-text';
import { allocateTaskId } from '@/lib/task-id';
import {
  MAX_ATTACHMENT_BYTES,
  formatFileSize,
  parsePendingAttachments,
  sumAttachmentBytes,
  validateTaskAttachmentBudget,
  type PendingAttachment,
} from '@/lib/attachments';
import {
  CreateTaskSchema,
  type CreateTaskServiceInput,
} from '@/lib/validations/task';

export type { CreateTaskServiceInput } from '@/lib/validations/task';

export type ServiceFailure = {
  ok: false;
  status: number;
  message: string;
  errors?: Record<string, string[]>;
};

export type CreateTaskResult = { ok: true; task: Task } | ServiceFailure;

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

/**
 * Replace client-supplied blob metadata with authoritative values from the
 * blob store. Size, URL, and content type all come from `head()`, so an
 * understated `sizeBytes` or a mismatched `url` cannot bypass the quota.
 */
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
): Promise<CreateTaskResult> {
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

  // Verify attachments against the blob store before touching the tasks
  // table, so quota failures never leave a half-created task behind.
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
      // Compensate: don't leave a task behind whose attachments failed to link.
      await db.delete(tasks).where(eq(tasks.id, created.id));
      throw error;
    }
  }

  return { ok: true, task: created };
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

export async function deleteTaskForUser(
  taskId: number,
): Promise<{ ok: true } | ServiceFailure> {
  const canManage = await canManageTask(taskId);
  if (!canManage) {
    return { ok: false, status: 403, message: 'Forbidden' };
  }

  await deleteBlobsForTask(taskId);
  await db.delete(tasks).where(eq(tasks.id, taskId));
  return { ok: true };
}
