import type { UserDto } from '@/lib/dto/user';

export type AuthTokensDto = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: UserDto;
};
