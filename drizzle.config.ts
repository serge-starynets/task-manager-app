import type { Config } from 'drizzle-kit';
import 'dotenv/config';

function resolveDbUrl() {
  // Treat empty strings as unset (e.g. DRIZZLE_DB_URL="$DATABASE_URL" when shell has no DATABASE_URL)
  const candidates = [
    process.env.DRIZZLE_DB_URL,
    process.env.LOCAL_DATABASE_URL,
    process.env.DATABASE_URL,
  ];

  for (const candidate of candidates) {
    const url = candidate?.trim();
    if (url) return url;
  }

  return '';
}

export default {
  dialect: 'postgresql',
  schema: './db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: resolveDbUrl(),
  },
} satisfies Config;
