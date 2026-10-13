import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { notes, type Note, type User } from '@/db/schema';
import { getNote } from '@/lib/dal/notes';
import type { ServiceResult, ServiceVoidResult } from '@/lib/services/types';
import {
  CreateNoteSchema,
  PlaceNoteSchema,
  UpdateNoteSchema,
  type CreateNoteInput,
  type PlaceNoteInput,
  type UpdateNoteInput,
} from '@/lib/validations/note';

function ownedBy(
  note: Note,
  user: Pick<User, 'id'>,
): boolean {
  return note.userId === user.id;
}

export async function createNoteForUser(
  user: Pick<User, 'id'>,
  input: CreateNoteInput,
): Promise<ServiceResult<Note>> {
  const parsed = CreateNoteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      message: parsed.error.errors[0]?.message ?? 'Invalid note',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const now = new Date();
  const [created] = await db
    .insert(notes)
    .values({
      content: parsed.data.content,
      userId: user.id,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return { ok: true, data: created };
}

export async function updateNoteForUser(
  user: Pick<User, 'id'>,
  input: UpdateNoteInput,
): Promise<ServiceResult<Note>> {
  const parsed = UpdateNoteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      message: parsed.error.errors[0]?.message ?? 'Invalid note',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const note = await getNote(parsed.data.noteId);
  if (!note || !ownedBy(note, user)) {
    return { ok: false, status: 404, message: 'Note not found' };
  }

  const [updated] = await db
    .update(notes)
    .set({
      content: parsed.data.content,
      updatedAt: new Date(),
    })
    .where(and(eq(notes.id, note.id), eq(notes.userId, user.id)))
    .returning();

  return { ok: true, data: updated };
}

export async function deleteNoteForUser(
  user: Pick<User, 'id'>,
  noteId: number,
): Promise<ServiceVoidResult> {
  const note = await getNote(noteId);
  if (!note || !ownedBy(note, user)) {
    return { ok: false, status: 404, message: 'Note not found' };
  }

  await db
    .delete(notes)
    .where(and(eq(notes.id, note.id), eq(notes.userId, user.id)));

  return { ok: true };
}

export async function placeNoteForUser(
  user: Pick<User, 'id'>,
  input: PlaceNoteInput,
): Promise<ServiceResult<Note>> {
  const parsed = PlaceNoteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      message: parsed.error.errors[0]?.message ?? 'Invalid position',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const note = await getNote(parsed.data.noteId);
  if (!note || !ownedBy(note, user)) {
    return { ok: false, status: 404, message: 'Note not found' };
  }

  if (!note.content.trim()) {
    return {
      ok: false,
      status: 400,
      message: 'Add text before placing a note on the board',
    };
  }

  const [updated] = await db
    .update(notes)
    .set({
      posX: parsed.data.posX,
      posY: parsed.data.posY,
      updatedAt: new Date(),
    })
    .where(and(eq(notes.id, note.id), eq(notes.userId, user.id)))
    .returning();

  return { ok: true, data: updated };
}

export async function unplaceNoteForUser(
  user: Pick<User, 'id'>,
  noteId: number,
): Promise<ServiceResult<Note>> {
  const note = await getNote(noteId);
  if (!note || !ownedBy(note, user)) {
    return { ok: false, status: 404, message: 'Note not found' };
  }

  if (note.posX == null && note.posY == null) {
    return { ok: true, data: note };
  }

  const [updated] = await db
    .update(notes)
    .set({
      posX: null,
      posY: null,
      updatedAt: new Date(),
    })
    .where(and(eq(notes.id, note.id), eq(notes.userId, user.id)))
    .returning();

  return { ok: true, data: updated };
}
