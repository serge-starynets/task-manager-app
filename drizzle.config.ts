import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  dialect: 'postgresql',
  schema: './db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    // Prefer DRIZZLE_DB_URL override (e.g. Neon), then local, then DATABASE_URL
    url:
      process.env.DRIZZLE_DB_URL ||
      process.env.LOCAL_DATABASE_URL ||
      process.env.DATABASE_URL ||
      '',
  },
} satisfies Config;
