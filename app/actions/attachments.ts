'use server';

import { type TaskAttachment } from '@/db/schema';
import { getCurrentUser } from '@/lib/dal';
import {
  actionError,
  attachmentErrorCode,
  revalidateTaskDetail,
  toActionResponse,
  unauthorizedResponse,
} from '@/lib/actions/helpers';
import {
  deleteDraftBlobForUser,
  deleteTaskAttachmentById,
  registerTaskAttachmentForUser,
} from '@/lib/services/attachment-service';

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
      return toActionResponse(result, attachmentErrorCode);
    }

    revalidateTaskDetail(input.taskId);

    return {
      success: true,
      message: 'Attachment added',
      attachment: result.data,
    };
  } catch (error) {
    console.error('Error registering attachment:', error);
    return actionError(
      'Failed to save attachment',
      'Failed to save attachment',
    );
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
      return toActionResponse(result, attachmentErrorCode);
    }

    revalidateTaskDetail(result.data.taskId);
    return { success: true, message: 'Attachment removed' };
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return actionError(
      'Failed to remove attachment',
      'Failed to remove attachment',
    );
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
      return actionError(result.message, 'Forbidden');
    }

    return { success: true, message: 'Draft file removed' };
  } catch (error) {
    console.error('Error deleting draft blob:', error);
    return actionError('Failed to remove file', 'Failed to remove file');
  }
}
