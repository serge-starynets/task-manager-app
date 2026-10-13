import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInMinutes, format, formatDistanceToNow } from 'date-fns';

// Utility function for combining Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse DB/API timestamps as absolute instants.
 * Timezone-naive strings from Postgres `timestamp` are treated as UTC so they
 * are not shifted again when formatted in the user's local timezone.
 */
export function parseAppDate(date: Date | string): Date {
  if (date instanceof Date) return date;

  const trimmed = date.trim();
  if (!trimmed) return new Date(NaN);

  // Already has an explicit offset / Z
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }

  // "2026-10-13 20:08:00" or "2026-10-13T20:08:00(.sss)"
  const normalized = trimmed.includes('T')
    ? trimmed
    : trimmed.replace(' ', 'T');
  return new Date(`${normalized}Z`);
}

// Relative time for the last 5 minutes (e.g. "2 minutes ago"); otherwise local dd.mm.yyyy:hh:mm
export function formatRelativeTime(date: Date | string) {
  const parsedDate = parseAppDate(date);
  const minutesAgo = differenceInMinutes(new Date(), parsedDate);

  // Only the recent past — future dates (negative minutesAgo) use the absolute format
  if (minutesAgo >= 0 && minutesAgo < 5) {
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  }

  return format(parsedDate, 'dd.MM.yyyy:HH:mm');
}

// Simple validation check for email
export function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

// Creates a URL-friendly slug from a string
export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export function mockDelay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
