import 'server-only';

import { headers } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';
import { normalizeEmail } from '@/lib/users';

const AUTH_RATE_LIMIT = 10;
const AUTH_RATE_WINDOW_MS = 15 * 60 * 1000;

export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return headerList.get('x-real-ip') ?? 'unknown';
}

/** Throttle by IP and by target email so neither can be brute-forced alone. */
export async function checkAuthRateLimit(
  scope: 'signin' | 'signup' | 'api-login',
  email: string,
): Promise<boolean> {
  const ip = await getClientIp();
  const ipResult = checkRateLimit(
    `${scope}:ip:${ip}`,
    AUTH_RATE_LIMIT,
    AUTH_RATE_WINDOW_MS,
  );
  const emailResult = checkRateLimit(
    `${scope}:email:${normalizeEmail(email)}`,
    AUTH_RATE_LIMIT,
    AUTH_RATE_WINDOW_MS,
  );
  return ipResult.ok && emailResult.ok;
}
