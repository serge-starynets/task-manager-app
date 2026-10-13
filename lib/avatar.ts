/** Shared avatar upload rules (client + server). */

export const MAX_AVATAR_BYTES = 200 * 1024; // 200 KB
export const ALLOWED_AVATAR_EXTENSIONS = ['jpg', 'jpeg', 'png'] as const;
export const ALLOWED_AVATAR_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
] as const;

export type AllowedAvatarExtension = (typeof ALLOWED_AVATAR_EXTENSIONS)[number];

const EXT_TO_MIME: Record<AllowedAvatarExtension, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

export function getAvatarExtension(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() ?? fileName;
  const dot = base.lastIndexOf('.');
  if (dot < 0) return '';
  return base.slice(dot + 1).toLowerCase();
}

export function isAllowedAvatarExtension(
  ext: string,
): ext is AllowedAvatarExtension {
  return (ALLOWED_AVATAR_EXTENSIONS as readonly string[]).includes(ext);
}

export function mimeForAvatarExtension(ext: string): string | null {
  if (!isAllowedAvatarExtension(ext)) return null;
  return EXT_TO_MIME[ext];
}

export function sanitizeAvatarFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() ?? 'avatar';
  const cleaned = base
    .replace(/\s+/g, '-')
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '');
  return cleaned.slice(0, 80) || 'avatar';
}

export function buildAvatarPathname(opts: {
  userId: string;
  fileName: string;
  id: string;
}): string {
  const safeName = sanitizeAvatarFileName(opts.fileName);
  return `avatars/${opts.userId}/${opts.id}-${safeName}`;
}

export function isValidAvatarPathname(pathname: string, userId: string): boolean {
  const prefix = `avatars/${userId}/`;
  return (
    pathname.startsWith(prefix) &&
    !pathname.includes('..') &&
    pathname.length > prefix.length
  );
}

export function validateAvatarFile(file: {
  name: string;
  size: number;
  type: string;
}): { ok: true } | { ok: false; error: string } {
  if (file.size <= 0) {
    return { ok: false, error: 'File is empty' };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: 'Avatar must be 200 KB or smaller' };
  }

  const ext = getAvatarExtension(file.name);
  if (!isAllowedAvatarExtension(ext)) {
    return { ok: false, error: 'Only JPG and PNG images are allowed' };
  }

  if (
    file.type &&
    file.type !== 'application/octet-stream' &&
    !ALLOWED_AVATAR_CONTENT_TYPES.includes(
      file.type as (typeof ALLOWED_AVATAR_CONTENT_TYPES)[number],
    )
  ) {
    return { ok: false, error: 'Only JPG and PNG images are allowed' };
  }

  return { ok: true };
}
