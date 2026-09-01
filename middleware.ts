import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { verifyAccessToken } from '@/lib/auth/jwt';

const PROTECTED_PAGE_PREFIXES = ['/dashboard', '/tasks', '/projects'];

const PUBLIC_API_V1_PATHS = new Set([
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
]);

function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

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

async function hasBearerAccessToken(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const payload = await verifyAccessToken(authHeader.slice(7));
  return payload !== null;
}

async function hasValidApiAuth(request: NextRequest): Promise<boolean> {
  const session = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });
  if (hasSessionToken(session)) {
    return true;
  }

  return hasBearerAccessToken(request);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/v1/')) {
    if (PUBLIC_API_V1_PATHS.has(pathname)) {
      return NextResponse.next();
    }

    if (!(await hasValidApiAuth(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
  }

  if (isProtectedPage(pathname)) {
    const session = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });
    if (!hasSessionToken(session)) {
      const signInUrl = new URL('/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tasks/:path*',
    '/projects/:path*',
    '/api/v1/:path*',
  ],
};
