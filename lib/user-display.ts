import type { User } from '@/db/schema';

export type DisplayUser = Pick<
  User,
  | 'email'
  | 'name'
  | 'image'
  | 'username'
  | 'customImage'
  | 'preferCustomProfile'
>;

export type ResolvedUserDisplay = {
  name: string;
  image: string | null;
  usingCustomProfile: boolean;
};

/** Resolve the name/avatar shown across the app based on profile preference. */
export function resolveUserDisplay(user: DisplayUser): ResolvedUserDisplay {
  if (user.preferCustomProfile) {
    const username = user.username?.trim();
    return {
      name: username || user.name?.trim() || user.email,
      image: user.customImage?.trim() || null,
      usingCustomProfile: true,
    };
  }

  return {
    name: user.name?.trim() || user.email,
    image: user.image?.trim() || null,
    usingCustomProfile: false,
  };
}

export function displayUserName(user: DisplayUser): string {
  return resolveUserDisplay(user).name;
}

export function displayUserImage(user: DisplayUser): string | null {
  return resolveUserDisplay(user).image;
}
