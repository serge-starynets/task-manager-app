import { db } from '@/db';
import { users, type User } from '@/db/schema';
import { getSession } from '@/lib/session';
import { eq } from 'drizzle-orm';
import { cache } from 'react';
import { redirect } from 'next/navigation';

/**
 * Safe subset of user columns to expose alongside tasks.
 * Never widen this to the full row — it contains the password hash.
 */
export const PUBLIC_USER_COLUMNS = {
  id: true,
  email: true,
  role: true,
} as const;

export function isAdmin(user: Pick<User, 'role'>) {
  return user.role === 'admin';
}

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId));

    return result[0] || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/signin');
  }
  return user;
}
