import type { Config } from 'drizzle-kit';
import 'dotenv/config';

/**
 * Local development config. Deliberately accepts ONLY LOCAL_DATABASE_URL so
 * `db:push` and friends can never fall back to the production DATABASE_URL.
 * Production changes go through drizzle.neon.config.ts explicitly.
 */
const url = process.env.LOCAL_DATABASE_URL?.trim();
if (!url) {
  throw new Error(
    'LOCAL_DATABASE_URL is not set. This config only targets the local database; use drizzle.neon.config.ts for Neon.',
  );
}

export default {
  dialect: 'postgresql',
  schema: './db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url,
  },
} satisfies Config;
