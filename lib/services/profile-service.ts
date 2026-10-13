import 'server-only';

import { del } from '@vercel/blob';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { accounts, users, type User } from '@/db/schema';
import { isValidAvatarPathname } from '@/lib/avatar';
import type { ServiceResult, ServiceVoidResult } from '@/lib/services/types';
import {
  SetAvatarSchema,
  UpdateProfileSchema,
  type SetAvatarInput,
  type UpdateProfileInput,
} from '@/lib/validations/profile';

export async function userHasGoogleAccount(userId: string): Promise<boolean> {
  try {
    const [row] = await db
      .select({ provider: accounts.provider })
      .from(accounts)
      .where(
        and(eq(accounts.userId, userId), eq(accounts.provider, 'google')),
      )
      .limit(1);
    return Boolean(row);
  } catch (error) {
    console.error('Error checking Google account:', error);
    return false;
  }
}

export async function updateProfileForUser(
  user: Pick<User, 'id'>,
  input: UpdateProfileInput,
): Promise<ServiceResult<User>> {
  const parsed = UpdateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      message: parsed.error.errors[0]?.message ?? 'Invalid profile',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const username = parsed.data.username?.trim() || null;

  const [updated] = await db
    .update(users)
    .set({
      username,
      preferCustomProfile: parsed.data.preferCustomProfile,
    })
    .where(eq(users.id, user.id))
    .returning();

  if (!updated) {
    return { ok: false, status: 404, message: 'User not found' };
  }

  return { ok: true, data: updated };
}

export async function setCustomAvatarForUser(
  user: Pick<User, 'id' | 'customImagePathname'>,
  input: SetAvatarInput,
): Promise<ServiceResult<User>> {
  const parsed = SetAvatarSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      message: parsed.error.errors[0]?.message ?? 'Invalid avatar',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  if (!isValidAvatarPathname(parsed.data.pathname, user.id)) {
    return { ok: false, status: 400, message: 'Invalid avatar path' };
  }

  const previousPathname = user.customImagePathname;

  const [updated] = await db
    .update(users)
    .set({
      customImage: parsed.data.url,
      customImagePathname: parsed.data.pathname,
    })
    .where(eq(users.id, user.id))
    .returning();

  if (!updated) {
    return { ok: false, status: 404, message: 'User not found' };
  }

  if (
    previousPathname &&
    previousPathname !== parsed.data.pathname &&
    isValidAvatarPathname(previousPathname, user.id)
  ) {
    try {
      await del(previousPathname);
    } catch (error) {
      console.error('Failed to delete previous avatar blob:', error);
    }
  }

  return { ok: true, data: updated };
}

export async function removeCustomAvatarForUser(
  user: Pick<User, 'id' | 'customImagePathname'>,
): Promise<ServiceVoidResult> {
  const pathname = user.customImagePathname;

  await db
    .update(users)
    .set({
      customImage: null,
      customImagePathname: null,
    })
    .where(eq(users.id, user.id));

  if (pathname && isValidAvatarPathname(pathname, user.id)) {
    try {
      await del(pathname);
    } catch (error) {
      console.error('Failed to delete avatar blob:', error);
    }
  }

  return { ok: true };
}
