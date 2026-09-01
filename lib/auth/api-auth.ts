import 'server-only';

import { headers } from 'next/headers';
import type { User } from '@/db/schema';
import { getCurrentUser, getUserById } from '@/lib/dal/users';
import { verifyAccessToken } from '@/lib/auth/jwt';

/**
 * Resolve the authenticated user for API routes.
 * Accepts Auth.js session cookies (web) or `Authorization: Bearer` (mobile).
 */
export async function getApiUser(): Promise<User | null> {
  const headerList = await headers();
  const authHeader = headerList.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = await verifyAccessToken(token);
    if (!payload) {
      return null;
    }
    return getUserById(payload.userId);
  }

  return getCurrentUser();
}
