'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/dal';
import {
  actionError,
  toActionResponse,
  unauthorizedResponse,
  type BaseActionResponse,
} from '@/lib/actions/helpers';
import {
  removeCustomAvatarForUser,
  setCustomAvatarForUser,
  updateProfileForUser,
} from '@/lib/services/profile-service';

export type ProfileActionResponse = BaseActionResponse;

function revalidateProfileViews() {
  revalidatePath('/profile');
  revalidatePath('/dashboard');
  // Header + comments/history sit under the app layout.
  revalidatePath('/', 'layout');
}

export async function updateProfile(input: {
  username?: string;
  preferCustomProfile: boolean;
}): Promise<ProfileActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const result = await updateProfileForUser(user, input);
    if (!result.ok) return toActionResponse(result);

    revalidateProfileViews();
    return { success: true, message: 'Profile updated' };
  } catch (error) {
    console.error('Error updating profile:', error);
    return actionError('Failed to update profile', 'Failed to update profile');
  }
}

export async function setProfileAvatar(input: {
  url: string;
  pathname: string;
}): Promise<ProfileActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const result = await setCustomAvatarForUser(user, input);
    if (!result.ok) return toActionResponse(result);

    revalidateProfileViews();
    return { success: true, message: 'Avatar updated' };
  } catch (error) {
    console.error('Error setting avatar:', error);
    return actionError('Failed to update avatar', 'Failed to update avatar');
  }
}

export async function removeProfileAvatar(): Promise<ProfileActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const result = await removeCustomAvatarForUser(user);
    if (!result.ok) return toActionResponse(result);

    revalidateProfileViews();
    return { success: true, message: 'Avatar removed' };
  } catch (error) {
    console.error('Error removing avatar:', error);
    return actionError('Failed to remove avatar', 'Failed to remove avatar');
  }
}
