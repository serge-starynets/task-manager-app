import type { User } from '@/db/schema';
import { getApiUser } from '@/lib/auth/api-auth';
import { jsonUnauthorized } from '@/lib/api/responses';
import type { ServiceFailure, ServiceResult } from '@/lib/services/types';

export async function requireApiUser(): Promise<User | Response> {
  const user = await getApiUser();
  if (!user) {
    return jsonUnauthorized();
  }
  return user;
}

export function isApiUser(value: User | Response): value is User {
  return !(value instanceof Response);
}

export function parseIdParam(id: string): number | null {
  const parsed = parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }
  return parsed;
}

export function parseOptionalProjectId(
  value: string | null,
): number | null | 'invalid' {
  if (value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 'invalid';
  }
  return parsed;
}

export function serviceFailureToBody(result: ServiceFailure) {
  return {
    error: result.message,
    errors: result.errors,
    status: result.status,
  };
}

export type ServiceMapper<T, D> = (data: T) => D;

export function mapServiceResult<T, D>(
  result: ServiceResult<T>,
  mapper: ServiceMapper<T, D>,
): { ok: true; data: D } | ServiceFailure {
  if (!result.ok) {
    return result;
  }
  return { ok: true, data: mapper(result.data) };
}
