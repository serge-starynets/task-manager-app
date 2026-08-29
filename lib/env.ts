import 'server-only';
import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    VERCEL: z.string().optional(),
    AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
    JWT_SECRET: z.string().optional(),
    DATABASE_URL: z.string().min(1).optional(),
    LOCAL_DATABASE_URL: z.string().min(1).optional(),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isVercel = Boolean(data.VERCEL);
    const isTest = data.NODE_ENV === 'test';

    if (isVercel && !data.DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'DATABASE_URL is required on Vercel',
        path: ['DATABASE_URL'],
      });
    }

    if (!isVercel && !isTest && !data.LOCAL_DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'LOCAL_DATABASE_URL is required for local development',
        path: ['LOCAL_DATABASE_URL'],
      });
    }
  });

function parseEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error(
      'Invalid environment variables:',
      result.error.flatten().fieldErrors,
    );
    throw new Error('Invalid environment variables');
  }

  return result.data;
}

export const env = parseEnv();
