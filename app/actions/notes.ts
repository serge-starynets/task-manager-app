'use server';

import { revalidatePath, revalidateTag, updateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/dal';
import {
  actionError,
  toActionResponse,
  unauthorizedResponse,
  type BaseActionResponse,
} from '@/lib/actions/helpers';
import {
  createNoteForUser,
  deleteNoteForUser,
  placeNoteForUser,
  unplaceNoteForUser,
  updateNoteForUser,
} from '@/lib/services/note-service';
import type { Note } from '@/db/schema';

export type NoteActionResponse = BaseActionResponse & {
  note?: Note;
};

function revalidateNotes() {
  updateTag('notes');
  revalidateTag('notes', 'max');
  revalidatePath('/notes');
}

export async function createNote(input: {
  content: string;
}): Promise<NoteActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const result = await createNoteForUser(user, input);
    if (!result.ok) return toActionResponse(result);

    revalidateNotes();
    return { success: true, message: 'Note saved', note: result.data };
  } catch (error) {
    console.error('Error creating note:', error);
    return actionError('Failed to save note', 'Failed to save note');
  }
}

export async function updateNote(input: {
  noteId: number;
  content: string;
}): Promise<NoteActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const result = await updateNoteForUser(user, input);
    if (!result.ok) return toActionResponse(result);

    revalidateNotes();
    return { success: true, message: 'Note updated', note: result.data };
  } catch (error) {
    console.error('Error updating note:', error);
    return actionError('Failed to update note', 'Failed to update note');
  }
}

export async function deleteNote(noteId: number): Promise<NoteActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const result = await deleteNoteForUser(user, noteId);
    if (!result.ok) return toActionResponse(result);

    revalidateNotes();
    return { success: true, message: 'Note deleted' };
  } catch (error) {
    console.error('Error deleting note:', error);
    return actionError('Failed to delete note', 'Failed to delete note');
  }
}

export async function placeNote(input: {
  noteId: number;
  posX: number;
  posY: number;
}): Promise<NoteActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const result = await placeNoteForUser(user, input);
    if (!result.ok) return toActionResponse(result);

    revalidateNotes();
    return { success: true, message: 'Note placed', note: result.data };
  } catch (error) {
    console.error('Error placing note:', error);
    return actionError('Failed to place note', 'Failed to place note');
  }
}

export async function unplaceNote(
  noteId: number,
): Promise<NoteActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const result = await unplaceNoteForUser(user, noteId);
    if (!result.ok) return toActionResponse(result);

    revalidateNotes();
    return { success: true, message: 'Note returned to stack', note: result.data };
  } catch (error) {
    console.error('Error unplacing note:', error);
    return actionError('Failed to remove note', 'Failed to remove note');
  }
}
