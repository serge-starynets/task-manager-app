'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { type TaskAttachment } from '@/db/schema';
import { getCurrentUser } from '@/lib/dal';
import {
  deleteDraftBlobForUser,
  deleteTaskAttachmentById,
  registerTaskAttachmentForUser,
} from '@/lib/services/attachment-service';
import { attachmentErrorCode } from '@/lib/actions/helpers';

export type AttachmentActionResponse = {
  success: boolean;
  message: string;
  attachment?: TaskAttachment;
  error?: string;
};

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

    const result = await registerTaskAttachmentForUser(user.id, input);
    if (!result.ok) {
      return {
        success: false,
        message: result.message,
        error: attachmentErrorCode(result.status, result.message),
      };
    }

    revalidateTag('tasks', 'max');
    revalidatePath(`/tasks/${input.taskId}`);
    revalidatePath(`/tasks/${input.taskId}/edit`);

    return {
      success: true,
      message: 'Attachment added',
      attachment: result.data,
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

    const result = await deleteTaskAttachmentById(attachmentId);
    if (!result.ok) {
      return {
        success: false,
        message: result.message,
        error: attachmentErrorCode(result.status, result.message),
      };
    }

    revalidateTag('tasks', 'max');
    revalidatePath(`/tasks/${result.data.taskId}`);
    revalidatePath(`/tasks/${result.data.taskId}/edit`);

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

    const result = await deleteDraftBlobForUser(
      user.id,
      pathname,
      uploadSessionId,
    );
    if (!result.ok) {
      return {
        success: false,
        message: result.message,
        error: 'Forbidden',
      };
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
