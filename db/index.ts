import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';

import { env } from '@/lib/env';
import * as schema from './schema';

export const db = env.VERCEL
  ? drizzleNeon({
      client: neon(env.DATABASE_URL!),
      schema,
      casing: 'snake_case',
    })
  : drizzlePostgres(env.LOCAL_DATABASE_URL!, {
      schema,
      casing: 'snake_case',
    });
