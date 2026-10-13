import { z } from 'zod';

export const MAX_NOTE_CONTENT_LENGTH = 140;

export const NoteContentSchema = z
  .string()
  .trim()
  .min(1, 'Note cannot be empty')
  .max(MAX_NOTE_CONTENT_LENGTH, `Note must be at most ${MAX_NOTE_CONTENT_LENGTH} characters`);

export const CreateNoteSchema = z.object({
  content: NoteContentSchema,
});

export const UpdateNoteSchema = z.object({
  noteId: z.number().int().positive(),
  content: NoteContentSchema,
});

export const PlaceNoteSchema = z.object({
  noteId: z.number().int().positive(),
  posX: z.number().finite().min(0).max(10_000),
  posY: z.number().finite().min(0).max(10_000),
});

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;
export type PlaceNoteInput = z.infer<typeof PlaceNoteSchema>;
