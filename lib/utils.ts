import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInMinutes, format, formatDistanceToNow } from 'date-fns';

// Utility function for combining Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Relative time for the last 5 minutes (e.g. "2 minutes ago"); otherwise dd.mm.yyyy:hh:mm
export function formatRelativeTime(date: Date | string) {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
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
