/** Shared attachment rules (client + server). */

export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'pdf',
  'txt',
  'csv',
  'md',
  'docx',
  'xlsx',
] as const;

export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

export const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

const EXT_TO_MIME: Record<AllowedExtension, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
  txt: 'text/plain',
  csv: 'text/csv',
  md: 'text/markdown',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export function mimeForExtension(ext: string): string | null {
  if (!isAllowedExtension(ext)) return null;
  return EXT_TO_MIME[ext];
}

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);

export type PendingAttachment = {
  url: string;
  pathname: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

export function getExtension(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() ?? fileName;
  const dot = base.lastIndexOf('.');
  if (dot < 0) return '';
  return base.slice(dot + 1).toLowerCase();
}

export function isAllowedExtension(ext: string): ext is AllowedExtension {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
}

export function isImageExtension(ext: string): boolean {
  return IMAGE_EXTENSIONS.has(ext.toLowerCase());
}

export function isImageContentType(contentType: string): boolean {
  return contentType.startsWith('image/');
}

export function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() ?? 'file';
  const cleaned = base
    .replace(/\s+/g, '-')
    .replace(/[^\w.\-()]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '');
  return cleaned.slice(0, 180) || 'file';
}

/** Authenticated app URL used in description embeds and download links. */
export function attachmentFileUrl(pathname: string): string {
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment));
  return `/api/attachments/file/${segments.join('/')}`;
}

export function validateAttachmentFile(file: {
  name: string;
  size: number;
  type: string;
}): { ok: true } | { ok: false; error: string } {
  if (file.size <= 0) {
    return { ok: false, error: 'File is empty' };
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return {
      ok: false,
      error: `File must be ${formatFileSize(MAX_ATTACHMENT_BYTES)} or smaller`,
    };
  }

  const ext = getExtension(file.name);
  if (!isAllowedExtension(ext)) {
    return {
      ok: false,
      error: `File type .${ext || '?'} is not allowed`,
    };
  }

  const expectedMime = EXT_TO_MIME[ext];
  if (
    file.type &&
    file.type !== 'application/octet-stream' &&
    file.type !== expectedMime &&
    !(ext === 'jpg' && file.type === 'image/jpeg') &&
    !(ext === 'md' && file.type === 'text/plain') &&
    !(ext === 'csv' && (file.type === 'text/plain' || file.type === 'application/csv'))
  ) {
    // Soft check: browsers sometimes send odd MIME; extension is the source of truth
    // when MIME is empty or octet-stream. Reject only clear mismatches for known risky types.
    if (file.type === 'text/html' || file.type === 'application/javascript') {
      return { ok: false, error: 'File type is not allowed' };
    }
  }

  return { ok: true };
}

export function buildAttachmentPathname(opts: {
  fileName: string;
  taskId?: number;
  userId?: string;
  uploadSessionId?: string;
  id: string;
}): string {
  const safeName = sanitizeFileName(opts.fileName);
  const leaf = `${opts.id}-${safeName}`;

  if (opts.taskId != null) {
    return `tasks/${opts.taskId}/${leaf}`;
  }

  if (!opts.userId || !opts.uploadSessionId) {
    throw new Error('Draft uploads require userId and uploadSessionId');
  }

  return `drafts/${opts.userId}/${opts.uploadSessionId}/${leaf}`;
}

export function isValidDraftPathname(
  pathname: string,
  userId: string,
  uploadSessionId: string,
): boolean {
  const prefix = `drafts/${userId}/${uploadSessionId}/`;
  return (
    pathname.startsWith(prefix) &&
    !pathname.includes('..') &&
    pathname.length > prefix.length
  );
}

export function isValidTaskPathname(pathname: string, taskId: number): boolean {
  const prefix = `tasks/${taskId}/`;
  return (
    pathname.startsWith(prefix) &&
    !pathname.includes('..') &&
    pathname.length > prefix.length
  );
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Remove img/a tags that point at the given URLs from Quill HTML. */
export function stripAttachmentUrlsFromHtml(
  html: string,
  urls: string[],
): string {
  if (!html || urls.length === 0) return html;

  let result = html;
  for (const url of urls) {
    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(
      new RegExp(`<img\\b[^>]*\\bsrc=["']${escaped}["'][^>]*>`, 'gi'),
      '',
    );
    result = result.replace(
      new RegExp(
        `<a\\b[^>]*\\bhref=["']${escaped}["'][^>]*>[\\s\\S]*?<\\/a>`,
        'gi',
      ),
      '',
    );
  }
  return result;
}

export function parsePendingAttachments(
  raw: string | null,
  userId: string,
  uploadSessionId: string,
): PendingAttachment[] {
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const results: PendingAttachment[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const url = typeof row.url === 'string' ? row.url : '';
    const pathname = typeof row.pathname === 'string' ? row.pathname : '';
    const fileName = typeof row.fileName === 'string' ? row.fileName : '';
    const contentType =
      typeof row.contentType === 'string' ? row.contentType : '';
    const sizeBytes =
      typeof row.sizeBytes === 'number' ? row.sizeBytes : Number(row.sizeBytes);

    if (!url.startsWith('https://')) continue;
    if (!fileName || !contentType || !pathname) continue;
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) continue;
    if (sizeBytes > MAX_ATTACHMENT_BYTES) continue;
    if (!isValidDraftPathname(pathname, userId, uploadSessionId)) continue;

    results.push({ url, pathname, fileName, contentType, sizeBytes });
  }
  return results;
}
