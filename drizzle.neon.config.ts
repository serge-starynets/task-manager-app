import type { Config } from 'drizzle-kit';
import 'dotenv/config';

/**
 * Push/migrate against Neon only (uses DATABASE_URL from .env).
 * Usage: npm run db:push:neon
 */
export default {
  dialect: 'postgresql',
  schema: './db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL?.trim() || '',
  },
} satisfies Config;
