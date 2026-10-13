import { db } from '@/db';
import { notes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { CACHE_REVALIDATE_SECONDS } from '@/lib/dal/constants';
import { requireUser } from '@/lib/dal/users';

async function fetchNotes(userId: string) {
  try {
    return await db.query.notes.findMany({
      where: eq(notes.userId, userId),
      orderBy: (notesTable, { desc }) => [desc(notesTable.updatedAt)],
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw new Error('Failed to fetch notes');
  }
}

export async function getNotes(userId: string) {
  return unstable_cache(() => fetchNotes(userId), ['notes', userId], {
    tags: ['notes'],
    revalidate: CACHE_REVALIDATE_SECONDS,
  })();
}

export async function getNote(noteId: number) {
  try {
    const result = await db.query.notes.findFirst({
      where: eq(notes.id, noteId),
    });
    return result ?? null;
  } catch (error) {
    console.error('Error fetching note:', noteId, error);
    return null;
  }
}

/** Returns notes for the signed-in user. */
export async function getCurrentUserNotes() {
  const user = await requireUser();
  return getNotes(user.id);
}
