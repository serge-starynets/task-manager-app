import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'ol',
  'ul',
  'li',
  'a',
  'img',
  'h1',
  'h2',
  'h3',
  'blockquote',
  'pre',
  'code',
  'span',
];

function isSafeSrc(src: string): boolean {
  return (
    src.startsWith('/api/attachments/file/') || /^https:\/\//i.test(src)
  );
}

function isSafeHref(href: string): boolean {
  return (
    href.startsWith('/api/attachments/file/') ||
    /^(https?:|mailto:)/i.test(href)
  );
}

/** Quill empty doc is usually <p><br></p> */
export function isEmptyHtml(html: string | null | undefined): boolean {
  if (!html) return true;
  const text = html
    .replace(/<img\b[^>]*>/gi, 'img')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return text.length === 0;
}

export function sanitizeRichText(
  html: string | null | undefined,
): string | null {
  if (!html || isEmptyHtml(html)) return null;

  const clean = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt'],
      span: ['class'],
      '*': ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    exclusiveFilter: (frame) => {
      if (frame.tag === 'img') {
        return !isSafeSrc(frame.attribs.src ?? '');
      }
      if (frame.tag === 'a') {
        const href = frame.attribs.href ?? '';
        return href.length > 0 && !isSafeHref(href);
      }
      return false;
    },
  });

  return isEmptyHtml(clean) ? null : clean;
}

/** Plain-text preview for cards / one-line summaries */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}
