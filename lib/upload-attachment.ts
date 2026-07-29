'use client';

import { upload } from '@vercel/blob/client';
import { nanoid } from 'nanoid';
import {
  buildAttachmentPathname,
  getExtension,
  mimeForExtension,
  sanitizeFileName,
  validateAttachmentFile,
  type PendingAttachment,
} from '@/lib/attachments';

export type UploadContext = {
  taskId?: number;
  userId: string;
  uploadSessionId?: string;
};

export async function uploadAttachmentFile(
  file: File,
  context: UploadContext,
): Promise<PendingAttachment> {
  const validation = validateAttachmentFile(file);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  if (context.taskId == null && !context.uploadSessionId) {
    throw new Error('Missing upload context');
  }

  const fileName = sanitizeFileName(file.name);
  const ext = getExtension(fileName);
  const contentType =
    file.type && file.type !== 'application/octet-stream'
      ? file.type
      : mimeForExtension(ext) || 'application/octet-stream';

  const pathname = buildAttachmentPathname({
    fileName,
    taskId: context.taskId,
    userId: context.userId,
    uploadSessionId: context.uploadSessionId,
    id: nanoid(12),
  });

  const blob = await upload(pathname, file, {
    access: 'private',
    handleUploadUrl: '/api/attachments/upload',
    contentType,
    clientPayload: JSON.stringify({
      taskId: context.taskId,
      uploadSessionId: context.uploadSessionId,
    }),
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    fileName,
    contentType,
    sizeBytes: file.size,
  };
}
