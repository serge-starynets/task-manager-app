import { db } from '@/db';
import { getSession } from './auth';
import { eq } from 'drizzle-orm';
import { unstable_cacheTag as cacheTag } from 'next/cache';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { issues, users, User } from '@/db/schema';

export function isAdmin(user: Pick<User, 'role'>) {
  return user.role === 'admin';
}

// Current user
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

// Get user by email
export const getUserByEmail = async (email: string) => {
  try {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0] || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
};

export async function getIssues(user: Pick<User, 'id' | 'role'>) {
  'use cache';
  cacheTag('issues');
  try {
    const result = await db.query.issues.findMany({
      where: isAdmin(user) ? undefined : eq(issues.userId, user.id),
      with: {
        user: true,
      },
      orderBy: (issues, { desc }) => [desc(issues.createdAt)],
    });
    return result;
  } catch (error) {
    console.error('Error fetching issues:', error);
    throw new Error('Failed to fetch issues');
  }
}

export async function getIssue(issueId: number) {
  try {
    const result = await db.query.issues.findFirst({
      where: eq(issues.id, issueId),
      with: { user: true },
    });
    return result;
  } catch (err) {
    console.log('Error getting issues:', issueId);
    return null;
  }
}

/** Returns the issue if the current user owns it or is an admin; otherwise null. */
export async function getAccessibleIssue(issueId: number) {
  const user = await requireUser();
  const issue = await getIssue(issueId);

  if (!issue) return null;
  if (isAdmin(user) || issue.userId === user.id) {
    return issue;
  }

  return null;
}

export async function canManageIssue(issueId: number) {
  const user = await getCurrentUser();
  if (!user) return false;

  const issue = await getIssue(issueId);
  if (!issue) return false;

  return isAdmin(user) || issue.userId === user.id;
}
