import { neon } from '@neondatabase/serverless';
import pg from 'pg';
import 'dotenv/config';

/**
 * Promote a user to admin by email.
 *
 * Local app uses LOCAL_DATABASE_URL; Vercel uses Neon (DATABASE_URL).
 *
 * Usage:
 *   npx tsx scripts/promote-admin.ts user@example.com          # local DB
 *   npx tsx scripts/promote-admin.ts user@example.com --neon   # Neon / production
 *   npx tsx scripts/promote-admin.ts user@example.com --both   # both databases
 */
async function promoteOnNeon(email: string) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(databaseUrl);
  const result = await sql`
    UPDATE users
    SET role = 'admin'
    WHERE email = ${email}
    RETURNING email, role
  `;

  if (result.length === 0) {
    throw new Error(`No user found on Neon with email: ${email}`);
  }

  console.log(`[neon] Promoted ${result[0].email} to ${result[0].role}`);
}

async function promoteOnLocal(email: string) {
  const databaseUrl = process.env.LOCAL_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('LOCAL_DATABASE_URL is not set');
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const result = await client.query(
      `UPDATE users SET role = 'admin' WHERE email = $1 RETURNING email, role`,
      [email],
    );

    if (result.rows.length === 0) {
      throw new Error(`No user found on local DB with email: ${email}`);
    }

    console.log(
      `[local] Promoted ${result.rows[0].email} to ${result.rows[0].role}`,
    );
  } finally {
    await client.end();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const email = args.find((arg) => !arg.startsWith('--'));
  const targetNeon = args.includes('--neon');
  const targetBoth = args.includes('--both');

  if (!email) {
    console.error(
      'Usage: npx tsx scripts/promote-admin.ts <email> [--neon|--both]',
    );
    process.exit(1);
  }

  // Default to local — that is what `next dev` uses
  if (targetBoth) {
    await promoteOnLocal(email);
    await promoteOnNeon(email);
  } else if (targetNeon) {
    await promoteOnNeon(email);
  } else {
    await promoteOnLocal(email);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
