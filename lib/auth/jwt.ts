import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';
import {
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from '@/lib/auth-constants';

const ACCESS_TOKEN_TYPE = 'access';
const REFRESH_TOKEN_TYPE = 'refresh';

function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is required for JWT signing');
  }
  return new TextEncoder().encode(secret);
}

export type AccessTokenPayload = {
  userId: string;
};

export type RefreshTokenPayload = {
  userId: string;
  jti: string;
};

export async function createAccessToken(userId: string): Promise<string> {
  return new SignJWT({ type: ACCESS_TOKEN_TYPE })
    .setSubject(userId)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function createRefreshToken(userId: string): Promise<string> {
  const jti = nanoid();
  return new SignJWT({ type: REFRESH_TOKEN_TYPE, jti })
    .setSubject(userId)
    .setJti(jti)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (payload.type !== ACCESS_TOKEN_TYPE || typeof payload.sub !== 'string') {
      return null;
    }
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (payload.type !== REFRESH_TOKEN_TYPE || typeof payload.sub !== 'string') {
      return null;
    }
    const jti = typeof payload.jti === 'string' ? payload.jti : null;
    if (!jti) {
      return null;
    }
    return { userId: payload.sub, jti };
  } catch {
    return null;
  }
}
