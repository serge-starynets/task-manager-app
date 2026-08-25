import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/db';
import { users } from '@/db/schema';
import { hashPassword } from '@/lib/password';

/**
 * Canonical form used for every email lookup and write. The database also
 * enforces a lower(email) unique index, so case variants cannot coexist.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getUserByEmail(email: string) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizeEmail(email)));
    return result[0] ?? null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = await hashPassword(password);
  const id = nanoid();
  const normalizedEmail = normalizeEmail(email);

  try {
    await db.insert(users).values({
      id,
      email: normalizedEmail,
      password: hashedPassword,
    });

    return { id, email: normalizedEmail };
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}
