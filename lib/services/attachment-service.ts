import 'server-only';

import { del, head } from '@vercel/blob';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { taskAttachments, type TaskAttachment } from '@/db/schema';
import { canManageTask, getTask, getTaskAttachments } from '@/lib/dal';
import {
  MAX_ATTACHMENT_BYTES,
  isValidDraftPathname,
  isValidTaskPathname,
  sumAttachmentBytes,
  validateTaskAttachmentBudget,
} from '@/lib/attachments';
import {
  recordAttachmentRemoved,
  recordAttachmentsAdded,
} from '@/lib/services/history-service';
import type { ServiceResult, ServiceVoidResult } from '@/lib/services/types';
import {
  RegisterAttachmentSchema,
  type RegisterAttachmentInput,
} from '@/lib/validations/attachment';

export async function registerTaskAttachmentForUser(
  userId: string,
  input: RegisterAttachmentInput,
): Promise<ServiceResult<TaskAttachment>> {
  const parsed = RegisterAttachmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      message: 'Invalid attachment data',
    };
  }

  const data = parsed.data;
  const canManage = await canManageTask(data.taskId);
  if (!canManage) {
    return { ok: false, status: 403, message: 'Forbidden' };
  }

  if (!isValidTaskPathname(data.pathname, data.taskId)) {
    return {
      ok: false,
      status: 403,
      message: 'Invalid attachment path',
    };
  }

  let blobMeta;
  try {
    blobMeta = await head(data.pathname);
  } catch (headError) {
    console.error('Error reading blob metadata:', headError);
    return { ok: false, status: 404, message: 'Uploaded file not found' };
  }

  if (blobMeta.size > MAX_ATTACHMENT_BYTES) {
    return { ok: false, status: 400, message: 'File is too large' };
  }

  const existing = await getTaskAttachments(data.taskId);
  const budget = validateTaskAttachmentBudget(
    sumAttachmentBytes(existing),
    blobMeta.size,
  );
  if (!budget.ok) {
    return { ok: false, status: 400, message: budget.error };
  }

  const [attachment] = await db
    .insert(taskAttachments)
    .values({
      taskId: data.taskId,
      fileName: data.fileName,
      contentType: blobMeta.contentType || data.contentType,
      sizeBytes: blobMeta.size,
      url: blobMeta.url,
      pathname: blobMeta.pathname,
      uploadedBy: userId,
    })
    .returning();

  const task = await getTask(data.taskId);
  await recordAttachmentsAdded({
    taskId: data.taskId,
    entityName: task?.title ?? `Task #${data.taskId}`,
    userId,
    fileNames: [attachment.fileName],
  });

  return { ok: true, data: attachment };
}

export async function deleteTaskAttachmentById(
  actorUserId: string,
  attachmentId: number,
): Promise<ServiceResult<{ taskId: number }>> {
  const [attachment] = await db
    .select()
    .from(taskAttachments)
    .where(eq(taskAttachments.id, attachmentId))
    .limit(1);

  if (!attachment) {
    return { ok: false, status: 404, message: 'Attachment not found' };
  }

  const canManage = await canManageTask(attachment.taskId);
  if (!canManage) {
    return { ok: false, status: 403, message: 'Forbidden' };
  }

  try {
    await del(attachment.url);
  } catch (blobError) {
    console.error('Error deleting blob:', blobError);
  }

  const task = await getTask(attachment.taskId);
  await db.delete(taskAttachments).where(eq(taskAttachments.id, attachmentId));

  await recordAttachmentRemoved({
    taskId: attachment.taskId,
    entityName: task?.title ?? `Task #${attachment.taskId}`,
    userId: actorUserId,
    fileName: attachment.fileName,
  });

  return { ok: true, data: { taskId: attachment.taskId } };
}

export async function deleteDraftBlobForUser(
  userId: string,
  pathname: string,
  uploadSessionId: string,
): Promise<ServiceVoidResult> {
  if (!isValidDraftPathname(pathname, userId, uploadSessionId)) {
    return { ok: false, status: 403, message: 'Invalid draft path' };
  }

  try {
    await del(pathname);
  } catch (blobError) {
    console.error('Error deleting draft blob:', blobError);
  }

  return { ok: true };
}
