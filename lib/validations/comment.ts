import { z } from 'zod';
import { isEmptyHtml, sanitizeRichText } from '@/lib/rich-text';

const MAX_COMMENT_HTML_LENGTH = 20_000;

export const CommentBodySchema = z
  .string()
  .max(MAX_COMMENT_HTML_LENGTH, 'Comment is too long')
  .transform((value, ctx) => {
    const clean = sanitizeRichText(value);
    if (!clean || isEmptyHtml(clean)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Comment cannot be empty',
      });
      return z.NEVER;
    }
    return clean;
  });

export const CreateCommentSchema = z.object({
  taskId: z.number().int().positive(),
  body: CommentBodySchema,
});

export const UpdateCommentSchema = z.object({
  commentId: z.number().int().positive(),
  body: CommentBodySchema,
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;
