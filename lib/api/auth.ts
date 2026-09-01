import { loginWithCredentials, refreshWithToken } from '@/lib/auth/login';
import { checkAuthRateLimit } from '@/lib/auth/rate-limit';
import { issueTokenPair } from '@/lib/auth/tokens';
import { userToDto } from '@/lib/api/mappers';
import {
  isApiUser,
  requireApiUser,
} from '@/lib/api/handler';
import {
  jsonError,
  jsonOk,
} from '@/lib/api/responses';
import {
  RefreshTokenSchema,
  SignInSchema,
} from '@/lib/validations/auth';

const GENERIC_SIGNIN_FAILURE = 'Invalid email or password';

export async function handleLogin(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const parsed = SignInSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      'Validation failed',
      400,
      parsed.error.flatten().fieldErrors,
    );
  }

  const allowed = await checkAuthRateLimit('api-login', parsed.data.email);
  if (!allowed) {
    return jsonError('Too many attempts. Please try again later.', 429);
  }

  const result = await loginWithCredentials(
    parsed.data.email,
    parsed.data.password,
  );
  if (!result.ok) {
    return jsonError(GENERIC_SIGNIN_FAILURE, 401);
  }

  const tokens = await issueTokenPair(result.user);
  return jsonOk(tokens);
}

export async function handleRefresh(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const parsed = RefreshTokenSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      'Validation failed',
      400,
      parsed.error.flatten().fieldErrors,
    );
  }

  const tokens = await refreshWithToken(parsed.data.refreshToken);
  if (!tokens) {
    return jsonError('Invalid or expired refresh token', 401);
  }

  return jsonOk(tokens);
}

export async function handleMe() {
  const userOrResponse = await requireApiUser();
  if (!isApiUser(userOrResponse)) {
    return userOrResponse;
  }

  return jsonOk(userToDto(userOrResponse));
}
