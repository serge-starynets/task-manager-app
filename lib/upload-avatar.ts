'use client';

import { upload } from '@vercel/blob/client';
import { nanoid } from 'nanoid';
import {
  buildAvatarPathname,
  getAvatarExtension,
  mimeForAvatarExtension,
  sanitizeAvatarFileName,
  validateAvatarFile,
} from '@/lib/avatar';
import { attachmentFileUrl } from '@/lib/attachments';

export type UploadedAvatar = {
  url: string;
  pathname: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

export async function uploadAvatarFile(
  file: File,
  userId: string,
): Promise<UploadedAvatar> {
  const validation = validateAvatarFile(file);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const fileName = sanitizeAvatarFileName(file.name);
  const ext = getAvatarExtension(fileName);
  const contentType =
    file.type && file.type !== 'application/octet-stream'
      ? file.type
      : mimeForAvatarExtension(ext) || 'image/jpeg';

  const pathname = buildAvatarPathname({
    userId,
    fileName,
    id: nanoid(12),
  });

  // Same private store as task attachments — public access hangs/fails here.
  const blob = await upload(pathname, file, {
    access: 'private',
    handleUploadUrl: '/api/profile/avatar/upload',
    contentType,
  });

  return {
    url: attachmentFileUrl(blob.pathname),
    pathname: blob.pathname,
    fileName,
    contentType,
    sizeBytes: file.size,
  };
}
