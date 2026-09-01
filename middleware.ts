import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { verifyAccessToken } from '@/lib/auth/jwt';

const PUBLIC_API_V1_PATHS = new Set([
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
]);

function hasSessionToken(
  token: Awaited<ReturnType<typeof getToken>>,
): boolean {
  if (!token || typeof token === 'string') {
    return false;
  }
  if (typeof token.userId === 'string') {
    return true;
  }
  return typeof token.sub === 'string';
}

async function getAuthToken(request: NextRequest) {
  return getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: request.nextUrl.protocol === 'https:',
  });
}

async function hasBearerAccessToken(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const payload = await verifyAccessToken(authHeader.slice(7));
  return payload !== null;
}

async function hasValidApiAuth(request: NextRequest): Promise<boolean> {
  const session = await getAuthToken(request);
  if (hasSessionToken(session)) {
    return true;
  }

  return hasBearerAccessToken(request);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api/v1/')) {
    return NextResponse.next();
  }

  if (PUBLIC_API_V1_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (!(await hasValidApiAuth(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/v1/:path*'],
};
