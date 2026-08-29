import { z } from 'zod';
import { MAX_ATTACHMENT_BYTES } from '@/lib/attachments';

export const PendingAttachmentSchema = z.object({
  url: z.string().url(),
  pathname: z.string().min(1).max(500),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(200),
  sizeBytes: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
});

export const RegisterAttachmentSchema = PendingAttachmentSchema.extend({
  taskId: z.number().int().positive(),
});

export type PendingAttachmentInput = z.infer<typeof PendingAttachmentSchema>;
export type RegisterAttachmentInput = z.infer<typeof RegisterAttachmentSchema>;
