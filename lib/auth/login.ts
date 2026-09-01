import 'server-only';

import type { User } from '@/db/schema';
import { getUserById } from '@/lib/dal/users';
import { verifyRefreshToken } from '@/lib/auth/jwt';
import { issueTokenPair } from '@/lib/auth/tokens';
import { verifyPassword } from '@/lib/password';
import { getUserByEmail } from '@/lib/users';
import type { AuthTokensDto } from '@/lib/dto/auth';

export type CredentialsResult =
  | { ok: true; user: User }
  | { ok: false; reason: 'invalid' };

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<CredentialsResult> {
  const user = await getUserByEmail(email);
  if (!user?.password) {
    return { ok: false, reason: 'invalid' };
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return { ok: false, reason: 'invalid' };
  }

  return { ok: true, user };
}

export async function refreshWithToken(
  refreshToken: string,
): Promise<AuthTokensDto | null> {
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    return null;
  }

  const user = await getUserById(payload.userId);
  if (!user) {
    return null;
  }

  return issueTokenPair(user);
}
