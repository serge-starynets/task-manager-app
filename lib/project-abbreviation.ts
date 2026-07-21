import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { projects } from '@/db/schema';

const ABBREVIATION_PATTERN = /^[A-Za-z]{1,8}$/;

/** Normalize to uppercase A–Z only (max 8). Returns null if invalid. */
export function normalizeAbbreviation(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!ABBREVIATION_PATTERN.test(trimmed)) return null;
  return trimmed.toUpperCase();
}

export async function isAbbreviationTaken(
  userId: string,
  abbreviation: string,
  excludeProjectId?: number,
): Promise<boolean> {
  const conditions = [
    eq(projects.userId, userId),
    eq(projects.abbreviation, abbreviation),
  ];

  if (excludeProjectId != null) {
    conditions.push(ne(projects.id, excludeProjectId));
  }

  const existing = await db.query.projects.findFirst({
    where: and(...conditions),
    columns: { id: true },
  });

  return Boolean(existing);
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  );
}

/** Best-effort abbreviation from a title (for backfills / seeds). */
export function abbreviationFromTitle(title: string, fallbackIndex = 0): string {
  const letters = title.replace(/[^A-Za-z]/g, '').toUpperCase();
  const base = (letters.slice(0, 8) || `P${fallbackIndex}`).slice(0, 8);
  return base;
}
