'use server';

import { del } from '@vercel/blob';
import { revalidatePath, revalidateTag } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { taskAttachments, type TaskAttachment } from '@/db/schema';
import { canManageTask, getCurrentUser, getTaskAttachments } from '@/lib/dal';
import {
  isValidDraftPathname,
  isValidTaskPathname,
  type PendingAttachment,
} from '@/lib/attachments';
import { z } from 'zod';

export type AttachmentActionResponse = {
  success: boolean;
  message: string;
  attachment?: TaskAttachment;
  error?: string;
};

const PendingAttachmentSchema = z.object({
  url: z.string().url(),
  pathname: z.string().min(1).max(500),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(200),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(25 * 1024 * 1024),
});

const RegisterSchema = PendingAttachmentSchema.extend({
  taskId: z.number().int().positive(),
});

export async function registerTaskAttachment(input: {
  taskId: number;
  url: string;
  pathname: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}): Promise<AttachmentActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized', error: 'Unauthorized' };
    }

    const parsed = RegisterSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Invalid attachment data',
        error: 'Validation failed',
      };
    }

    const data = parsed.data;
    const canManage = await canManageTask(data.taskId);
    if (!canManage) {
      return { success: false, message: 'Forbidden', error: 'Forbidden' };
    }

    if (!isValidTaskPathname(data.pathname, data.taskId)) {
      return {
        success: false,
        message: 'Invalid attachment path',
        error: 'Forbidden',
      };
    }

    const [attachment] = await db
      .insert(taskAttachments)
      .values({
        taskId: data.taskId,
        fileName: data.fileName,
        contentType: data.contentType,
        sizeBytes: data.sizeBytes,
        url: data.url,
        pathname: data.pathname,
        uploadedBy: user.id,
      })
      .returning();

    revalidateTag('tasks', 'max');
    revalidatePath(`/tasks/${data.taskId}`);
    revalidatePath(`/tasks/${data.taskId}/edit`);

    return {
      success: true,
      message: 'Attachment added',
      attachment,
    };
  } catch (error) {
    console.error('Error registering attachment:', error);
    return {
      success: false,
      message: 'Failed to save attachment',
      error: 'Failed to save attachment',
    };
  }
}

export async function deleteTaskAttachment(
  attachmentId: number,
): Promise<AttachmentActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized', error: 'Unauthorized' };
    }

    const [attachment] = await db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.id, attachmentId))
      .limit(1);

    if (!attachment) {
      return {
        success: false,
        message: 'Attachment not found',
        error: 'Not found',
      };
    }

    const canManage = await canManageTask(attachment.taskId);
    if (!canManage) {
      return { success: false, message: 'Forbidden', error: 'Forbidden' };
    }

    try {
      await del(attachment.url);
    } catch (blobError) {
      console.error('Error deleting blob:', blobError);
    }

    await db
      .delete(taskAttachments)
      .where(eq(taskAttachments.id, attachmentId));

    revalidateTag('tasks', 'max');
    revalidatePath(`/tasks/${attachment.taskId}`);
    revalidatePath(`/tasks/${attachment.taskId}/edit`);

    return { success: true, message: 'Attachment removed' };
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return {
      success: false,
      message: 'Failed to remove attachment',
      error: 'Failed to remove attachment',
    };
  }
}

/** Delete a draft blob that was never linked to a task (create flow). */
export async function deleteDraftBlob(
  pathname: string,
  uploadSessionId: string,
): Promise<AttachmentActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'Unauthorized', error: 'Unauthorized' };
    }

    if (!isValidDraftPathname(pathname, user.id, uploadSessionId)) {
      return {
        success: false,
        message: 'Invalid draft path',
        error: 'Forbidden',
      };
    }

    try {
      await del(pathname);
    } catch (blobError) {
      console.error('Error deleting draft blob:', blobError);
    }

    return { success: true, message: 'Draft file removed' };
  } catch (error) {
    console.error('Error deleting draft blob:', error);
    return {
      success: false,
      message: 'Failed to remove file',
      error: 'Failed to remove file',
    };
  }
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

export async function linkPendingAttachments(
  taskId: number,
  userId: string,
  pending: PendingAttachment[],
): Promise<void> {
  if (pending.length === 0) return;

  await db.insert(taskAttachments).values(
    pending.map((item) => ({
      taskId,
      fileName: item.fileName,
      contentType: item.contentType,
      sizeBytes: item.sizeBytes,
      url: item.url,
      pathname: item.pathname,
      uploadedBy: userId,
    })),
  );
}
