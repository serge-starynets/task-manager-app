import 'server-only';
import type { User } from '@/db/schema';
import { ACCESS_TOKEN_MAX_AGE_SECONDS } from '@/lib/auth-constants';
import { createAccessToken, createRefreshToken } from '@/lib/auth/jwt';
import { userToDto } from '@/lib/api/mappers';
import type { AuthTokensDto } from '@/lib/dto/auth';

export async function issueTokenPair(user: User): Promise<AuthTokensDto> {
  const [accessToken, refreshToken] = await Promise.all([
    createAccessToken(user.id),
    createRefreshToken(user.id),
  ]);

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_MAX_AGE_SECONDS,
    tokenType: 'Bearer',
    user: userToDto(user),
  };
}
