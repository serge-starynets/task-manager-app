import { z } from 'zod';

export const MAX_USERNAME_LENGTH = 20;

export const UsernameSchema = z
  .string()
  .trim()
  .max(MAX_USERNAME_LENGTH, `Username must be at most ${MAX_USERNAME_LENGTH} characters`)
  .regex(
    /^[a-zA-Z0-9_\- ]*$/,
    'Username may only contain letters, numbers, spaces, hyphens, and underscores',
  );

export const UpdateProfileSchema = z
  .object({
    username: UsernameSchema.optional(),
    preferCustomProfile: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.preferCustomProfile && !data.username?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Username is required when using your custom profile',
        path: ['username'],
      });
    }
  });

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const SetAvatarSchema = z.object({
  /** App proxy URL (`/api/attachments/file/...`) or legacy https Blob URL. */
  url: z
    .string()
    .min(1)
    .max(2048)
    .refine(
      (value) =>
        value.startsWith('/api/attachments/file/') ||
        value.startsWith('https://'),
      'Invalid avatar URL',
    ),
  pathname: z.string().min(1).max(512),
});

export type SetAvatarInput = z.infer<typeof SetAvatarSchema>;
