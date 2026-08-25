'use server';

import { del, head } from '@vercel/blob';
import { revalidatePath, revalidateTag } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { taskAttachments, type TaskAttachment } from '@/db/schema';
import { canManageTask, getCurrentUser, getTaskAttachments } from '@/lib/dal';
import {
  MAX_ATTACHMENT_BYTES,
  isValidDraftPathname,
  isValidTaskPathname,
  sumAttachmentBytes,
  validateTaskAttachmentBudget,
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
  sizeBytes: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
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

    // Client-sent size/url/contentType are untrusted; read the authoritative
    // values from the blob store for the validated pathname.
    let blobMeta;
    try {
      blobMeta = await head(data.pathname);
    } catch (headError) {
      console.error('Error reading blob metadata:', headError);
      return {
        success: false,
        message: 'Uploaded file not found',
        error: 'Not found',
      };
    }

    if (blobMeta.size > MAX_ATTACHMENT_BYTES) {
      return {
        success: false,
        message: 'File is too large',
        error: 'File is too large',
      };
    }

    const existing = await getTaskAttachments(data.taskId);
    const budget = validateTaskAttachmentBudget(
      sumAttachmentBytes(existing),
      blobMeta.size,
    );
    if (!budget.ok) {
      return {
        success: false,
        message: budget.error,
        error: budget.error,
      };
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
